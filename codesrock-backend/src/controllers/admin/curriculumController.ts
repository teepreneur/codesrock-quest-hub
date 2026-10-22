import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/errorHandler';
import { clearCurriculumCache } from '../trackingController';

const UNIT_TYPES = ['song', 'story_mission', 'unplugged', 'robot', 'platform'];
const SKILLS = ['vocabulary', 'directions', 'sequencing', 'navigation', 'debugging', 'collaboration'];
const MODES = ['practical', 'book'];

const text = (v: unknown, field: string, { required = false, max = 200 } = {}): string | null => {
  if (v === undefined || v === null || String(v).trim() === '') {
    if (required) throw new AppError(`${field} is required`, 400);
    return null;
  }
  const s = String(v).trim();
  if (s.length > max) throw new AppError(`${field} is too long`, 400);
  return s;
};

const subset = (v: unknown, allowed: string[], field: string): string[] => {
  if (!Array.isArray(v) || v.some((x) => !allowed.includes(x))) throw new AppError(`${field} has an unknown value`, 400);
  return [...new Set(v as string[])];
};

/** Only the fields present in the body are validated and returned */
const unitFields = (body: any, creating: boolean) => {
  const out: Record<string, unknown> = {};
  if (creating || body.title !== undefined) out.title = text(body.title, 'Title', { required: true });
  if (creating || body.unitType !== undefined) {
    if (!UNIT_TYPES.includes(body.unitType)) throw new AppError('Unknown unit type', 400);
    out.unit_type = body.unitType;
  }
  if (body.bookPages !== undefined) out.book_pages = text(body.bookPages, 'Book pages', { max: 30 });
  if (body.summary !== undefined) out.summary = text(body.summary, 'Summary', { max: 1000 });
  return out;
};

const activityFields = (body: any, creating: boolean) => {
  const out: Record<string, unknown> = {};
  if (creating || body.title !== undefined) out.title = text(body.title, 'Title', { required: true });
  if (body.bookPage !== undefined) {
    if (body.bookPage === null || body.bookPage === '') out.book_page = null;
    else {
      const n = Number(body.bookPage);
      if (!Number.isInteger(n) || n < 1 || n > 1000) throw new AppError('Book page must be a page number', 400);
      out.book_page = n;
    }
  }
  if (creating || body.skills !== undefined) out.skills = subset(body.skills ?? [], SKILLS, 'Skills');
  if (creating || body.modes !== undefined) {
    const modes = subset(body.modes ?? [], MODES, 'Modes');
    if (modes.length === 0) throw new AppError('Choose practical, book or both', 400);
    out.modes = modes;
  }
  return out;
};

const countRows = async (table: string, filters: Record<string, string>): Promise<number> => {
  let q = supabase.from(table).select('*', { count: 'exact', head: true });
  for (const [k, v] of Object.entries(filters)) q = q.eq(k, v);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
};

const getUnit = async (id: string) => {
  const { data, error } = await supabase.from('curriculum_units').select('id, curriculum_id, position').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('Unit not found', 404);
  return data;
};

const getActivity = async (id: string) => {
  const { data, error } = await supabase.from('curriculum_activities').select('id, unit_id, position, modes').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('Activity not found', 404);
  return data;
};

/**
 * Swap a row with its neighbour. Positions are unique per parent, so one row
 * parks at a temporary position while the other moves.
 */
const moveRow = async (table: string, parentCol: string, row: { id: string; position: number } & Record<string, any>, direction: string) => {
  if (direction !== 'up' && direction !== 'down') throw new AppError('Direction must be up or down', 400);
  const { data: neighbour, error } = await supabase
    .from(table)
    .select('id, position')
    .eq(parentCol, row[parentCol])
    [direction === 'up' ? 'lt' : 'gt']('position', row.position)
    .order('position', { ascending: direction === 'down' })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!neighbour) return false;

  const steps = [
    { id: row.id, position: -1 },
    { id: neighbour.id, position: row.position },
    { id: row.id, position: neighbour.position },
  ];
  for (const s of steps) {
    const { error: e } = await supabase.from(table).update({ position: s.position }).eq('id', s.id);
    if (e) throw e;
  }
  return true;
};

const nextPosition = async (table: string, parentCol: string, parentId: string) => {
  const { data, error } = await supabase
    .from(table).select('position').eq(parentCol, parentId).order('position', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return (data?.position || 0) + 1;
};

const done = (res: Response, data: unknown = null, status = 200) => {
  clearCurriculumCache();
  res.status(status).json({ success: true, data });
};

/**
 * @desc    Every activity book with its units, activities and how often each has been used
 * @route   GET /api/admin/content/curriculum
 */
export const getCurricula = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('curricula')
      .select(`id, slug, title, description, is_active,
        curriculum_units(id, position, title, unit_type, book_pages, summary,
          curriculum_activities(id, position, title, book_page, skills, modes,
            learner_activity_results(count), lesson_session_activities(count)))`)
      .order('created_at');
    if (error) throw error;

    const curricula = (data || []).map((c: any) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      isActive: c.is_active,
      units: [...(c.curriculum_units || [])]
        .sort((a: any, b: any) => a.position - b.position)
        .map((u: any) => ({
          id: u.id,
          position: u.position,
          title: u.title,
          unitType: u.unit_type,
          bookPages: u.book_pages,
          summary: u.summary,
          activities: [...(u.curriculum_activities || [])]
            .sort((a: any, b: any) => a.position - b.position)
            .map((a: any) => ({
              id: a.id,
              position: a.position,
              title: a.title,
              bookPage: a.book_page,
              skills: a.skills,
              modes: a.modes,
              ratingCount: a.learner_activity_results?.[0]?.count || 0,
              lessonCount: a.lesson_session_activities?.[0]?.count || 0,
            })),
        })),
    }));
    res.status(200).json({ success: true, data: curricula });
  } catch (error) {
    next(error);
  }
};

/** @route POST /api/admin/content/curriculum/:curriculumId/units */
export const createUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const curriculumId = String(req.params.curriculumId);
    const fields = unitFields(req.body, true);
    const position = await nextPosition('curriculum_units', 'curriculum_id', curriculumId);
    const { data, error } = await supabase
      .from('curriculum_units').insert({ ...fields, curriculum_id: curriculumId, position }).select().single();
    if (error) throw error;
    done(res, data, 201);
  } catch (error) {
    next(error);
  }
};

/** @route PATCH /api/admin/content/curriculum/units/:id */
export const updateUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unit = await getUnit(String(req.params.id));
    const { data, error } = await supabase.from('curriculum_units').update(unitFields(req.body, false)).eq('id', unit.id).select().single();
    if (error) throw error;
    done(res, data);
  } catch (error) {
    next(error);
  }
};

/** @route POST /api/admin/content/curriculum/units/:id/move */
export const moveUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unit = await getUnit(String(req.params.id));
    done(res, { moved: await moveRow('curriculum_units', 'curriculum_id', unit, req.body.direction) });
  } catch (error) {
    next(error);
  }
};

/** @route DELETE /api/admin/content/curriculum/units/:id (only while it has no activities) */
export const deleteUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unit = await getUnit(String(req.params.id));
    if (await countRows('curriculum_activities', { unit_id: unit.id })) {
      throw new AppError('Remove the activities in this unit first', 409);
    }
    const { error } = await supabase.from('curriculum_units').delete().eq('id', unit.id);
    if (error) throw error;
    done(res);
  } catch (error) {
    next(error);
  }
};

/** @route POST /api/admin/content/curriculum/units/:unitId/activities */
export const createActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const unit = await getUnit(String(req.params.unitId));
    const fields = activityFields(req.body, true);
    const position = await nextPosition('curriculum_activities', 'unit_id', unit.id);
    const { data, error } = await supabase
      .from('curriculum_activities').insert({ ...fields, unit_id: unit.id, position }).select().single();
    if (error) throw error;
    done(res, data, 201);
  } catch (error) {
    next(error);
  }
};

/** @route PATCH /api/admin/content/curriculum/activities/:id */
export const updateActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activity = await getActivity(String(req.params.id));
    const fields = activityFields(req.body, false);
    if (fields.modes) {
      // Dropping a mode would orphan the ratings teachers gave for it
      for (const mode of activity.modes.filter((m: string) => !(fields.modes as string[]).includes(m))) {
        if (await countRows('learner_activity_results', { activity_id: activity.id, mode })) {
          throw new AppError(`Teachers have already rated this activity ${mode === 'book' ? 'in the book' : 'as a practical'}, so that can't be removed`, 409);
        }
      }
    }
    const { data, error } = await supabase.from('curriculum_activities').update(fields).eq('id', activity.id).select().single();
    if (error) throw error;
    done(res, data);
  } catch (error) {
    next(error);
  }
};

/** @route POST /api/admin/content/curriculum/activities/:id/move */
export const moveActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activity = await getActivity(String(req.params.id));
    done(res, { moved: await moveRow('curriculum_activities', 'unit_id', activity, req.body.direction) });
  } catch (error) {
    next(error);
  }
};

/** @route DELETE /api/admin/content/curriculum/activities/:id (only if no lesson has used it) */
export const deleteActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activity = await getActivity(String(req.params.id));
    const used =
      (await countRows('lesson_session_activities', { activity_id: activity.id })) +
      (await countRows('learner_activity_results', { activity_id: activity.id }));
    if (used) throw new AppError('Teachers have already logged lessons with this activity, so it can\'t be deleted', 409);
    const { error } = await supabase.from('curriculum_activities').delete().eq('id', activity.id);
    if (error) throw error;
    done(res);
  } catch (error) {
    next(error);
  }
};
