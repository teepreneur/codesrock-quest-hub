import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';
import { AppError } from '../../middleware/errorHandler';
import { getUserSchoolId } from '../../services/classAccess';

/**
 * Admins managing a school's classes. Super admins work with any school,
 * school admins only with their own. Rosters are managed through the
 * /api/tracking learner routes, which admins can already use.
 */

const assertSchoolAccess = async (req: Request, schoolId: string) => {
  if (req.user?.role === 'super_admin') return;
  const own = await getUserSchoolId(req.user!.userId);
  if (!own || own !== schoolId) throw new AppError('You can only manage classes in your own school', 403);
};

/** The teacher must be an active teacher at this school */
const assertTeacherAtSchool = async (teacherId: string, schoolId: string) => {
  const { data } = await supabase.from('profiles').select('role, school_id, is_active').eq('id', teacherId).single();
  if (!data || data.role !== 'teacher' || data.school_id !== schoolId || data.is_active === false) {
    throw new AppError('Choose a teacher from this school', 400);
  }
};

const getSchoolClass = async (schoolId: string, classId: string) => {
  const { data } = await supabase.from('classes').select('id, name, teacher_id, school_id').eq('id', classId).single();
  if (!data || data.school_id !== schoolId) throw new AppError('Class not found at this school', 404);
  return data;
};

/**
 * @desc    Create a class at a school for one of its teachers
 * @route   POST /api/admin/schools/:id/classes  { name, teacherId }
 */
export const createSchoolClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = req.params.id;
    await assertSchoolAccess(req, schoolId);
    await assertTeacherAtSchool(req.body.teacherId, schoolId);

    // New classes follow the CodesRock 1 activity book by default
    const { data: curriculum } = await supabase.from('curricula').select('id').eq('slug', 'codesrock-1-activity-book').single();

    const { data, error } = await supabase
      .from('classes')
      .insert({ name: String(req.body.name).trim(), teacher_id: req.body.teacherId, school_id: schoolId, curriculum_id: curriculum?.id || null })
      .select('id, name, teacher_id, school_id, created_at')
      .single();
    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rename a class or hand it to another teacher at the school
 * @route   PATCH /api/admin/schools/:id/classes/:classId  { name?, teacherId? }
 */
export const updateSchoolClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = req.params.id;
    await assertSchoolAccess(req, schoolId);
    await getSchoolClass(schoolId, req.params.classId);

    const update: Record<string, any> = { updated_at: new Date().toISOString() };
    if (req.body.name !== undefined) update.name = String(req.body.name).trim();
    if (req.body.teacherId !== undefined) {
      await assertTeacherAtSchool(req.body.teacherId, schoolId);
      update.teacher_id = req.body.teacherId;
    }

    const { data, error } = await supabase
      .from('classes')
      .update(update)
      .eq('id', req.params.classId)
      .select('id, name, teacher_id, school_id, created_at')
      .single();
    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a class with its roster links and logged lessons.
 *          Children left in no other class are marked inactive; their
 *          records are kept.
 * @route   DELETE /api/admin/schools/:id/classes/:classId
 */
export const deleteSchoolClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schoolId = req.params.id;
    await assertSchoolAccess(req, schoolId);
    const cls = await getSchoolClass(schoolId, req.params.classId);

    const { data: roster, error: rosterError } = await supabase.from('class_learners').select('learner_id').eq('class_id', cls.id);
    if (rosterError) throw rosterError;
    const learnerIds = (roster || []).map((r: any) => r.learner_id);

    // Lessons, their results and roster links go with the class (ON DELETE CASCADE)
    const { error } = await supabase.from('classes').delete().eq('id', cls.id);
    if (error) throw error;

    let deactivated = 0;
    if (learnerIds.length) {
      const { data: stillEnrolled } = await supabase.from('class_learners').select('learner_id').in('learner_id', learnerIds);
      const enrolled = new Set((stillEnrolled || []).map((r: any) => r.learner_id));
      const orphans = learnerIds.filter((id) => !enrolled.has(id));
      if (orphans.length) {
        await supabase.from('learners').update({ is_active: false, updated_at: new Date().toISOString() }).in('id', orphans);
        deactivated = orphans.length;
      }
    }

    res.status(200).json({ success: true, message: `Deleted ${cls.name}`, data: { deactivatedChildren: deactivated } });
  } catch (error) {
    next(error);
  }
};
