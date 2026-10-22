/**
 * Progress analytics for activity-book tracking.
 *
 * Pure functions: they take rows already loaded from the database and return
 * the figures the dashboards show. Levels are 1 = Not yet, 2 = With help,
 * 3 = On their own. Where a child has been rated on the same activity more
 * than once, the most recent lesson counts.
 */

export type Mode = 'practical' | 'book';
export type Level = 1 | 2 | 3;

export const SKILLS = ['vocabulary', 'directions', 'sequencing', 'navigation', 'debugging', 'collaboration'] as const;
export type Skill = (typeof SKILLS)[number];

export interface Activity {
  id: string;
  unit_id: string;
  position: number;
  title: string;
  book_page: number | null;
  skills: string[];
  modes: Mode[];
}

export interface Unit {
  id: string;
  position: number;
  title: string;
  unit_type: string;
  book_pages: string | null;
  summary: string | null;
  activities: Activity[];
}

export interface Learner {
  id: string;
  first_name: string;
  last_name: string;
}

export interface Session {
  id: string;
  session_date: string;
  created_at: string;
  notes?: string | null;
}

export interface SessionActivity {
  session_id: string;
  activity_id: string;
}

export interface Attendance {
  session_id: string;
  learner_id: string;
  present: boolean;
  note?: string | null;
}

export interface Result {
  session_id: string;
  learner_id: string;
  activity_id: string;
  mode: Mode;
  level: Level;
}

export interface ProgressInput {
  units: Unit[];
  learners: Learner[];
  sessions: Session[];
  sessionActivities: SessionActivity[];
  attendance: Attendance[];
  results: Result[];
}

/** Level 1/2/3 as a 0-100 score. */
export const levelScore = (level: number) => ((level - 1) / 2) * 100;

const round = (n: number, digits = 0) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

const average = (values: number[]): number | null =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

const pct = (part: number, whole: number): number | null => (whole > 0 ? round((part / whole) * 100) : null);

/** Sessions oldest first; same-day lessons ordered by when they were logged. */
const sortSessions = (sessions: Session[]) =>
  [...sessions].sort((a, b) =>
    a.session_date === b.session_date
      ? a.created_at.localeCompare(b.created_at)
      : a.session_date.localeCompare(b.session_date)
  );

const resultKey = (learnerId: string, activityId: string, mode: Mode) => `${learnerId}|${activityId}|${mode}`;

/** Most recent result per learner + activity + mode. */
export const latestResults = (results: Result[], sessions: Session[]): Map<string, Result> => {
  const order = new Map(sortSessions(sessions).map((s, i) => [s.id, i]));
  const latest = new Map<string, Result>();
  const latestOrder = new Map<string, number>();
  for (const r of results) {
    const key = resultKey(r.learner_id, r.activity_id, r.mode);
    const o = order.get(r.session_id) ?? -1;
    if (!latest.has(key) || o >= (latestOrder.get(key) ?? -1)) {
      latest.set(key, r);
      latestOrder.set(key, o);
    }
  }
  return latest;
};

interface Summary {
  avgScore: number | null;
  independentRate: number | null;
  ratedCount: number;
}

const summarize = (results: Result[]): Summary => ({
  avgScore: results.length ? round(average(results.map((r) => levelScore(r.level)))!) : null,
  independentRate: pct(results.filter((r) => r.level === 3).length, results.length),
  ratedCount: results.length,
});

/** Practical vs book on activities rated in both modes for the same learner. */
const modeGap = (latest: Result[]) => {
  const byPair = new Map<string, { practical?: number; book?: number }>();
  for (const r of latest) {
    const key = `${r.learner_id}|${r.activity_id}`;
    const pair = byPair.get(key) || {};
    pair[r.mode] = r.level;
    byPair.set(key, pair);
  }
  const pairs = [...byPair.values()].filter((p) => p.practical !== undefined && p.book !== undefined);
  const practical = average(pairs.map((p) => levelScore(p.practical!)));
  const book = average(pairs.map((p) => levelScore(p.book!)));
  return {
    pairedCount: pairs.length,
    practicalScore: practical === null ? null : round(practical),
    bookScore: book === null ? null : round(book),
    gap: practical === null || book === null ? null : round(practical - book),
  };
};

const skillScores = (latest: Result[], activityById: Map<string, Activity>) =>
  SKILLS.map((skill) => {
    const rs = latest.filter((r) => activityById.get(r.activity_id)?.skills.includes(skill));
    return { skill, ...summarize(rs) };
  });

const flattenActivities = (units: Unit[]) =>
  [...units]
    .sort((a, b) => a.position - b.position)
    .flatMap((u) => [...u.activities].sort((a, b) => a.position - b.position));

export type Flag = 'repeated_not_yet' | 'low_attendance' | 'book_gap' | 'not_yet_assessed';

export const FLAG_RULES = {
  /** "Not yet" ratings in the learner's last two attended lessons */
  repeatedNotYet: 2,
  /** Attendance below this % over the last five lessons (needs 3+ lessons) */
  lowAttendancePct: 60,
  /** Practical minus book score, on at least two paired activities */
  bookGapPoints: 50,
};

export const computeClassProgress = (input: ProgressInput) => {
  const { units, learners, sessions, sessionActivities, attendance, results } = input;
  const ordered = sortSessions(sessions);
  const activities = flattenActivities(units);
  const activityById = new Map(activities.map((a) => [a.id, a]));
  const latestMap = latestResults(results, sessions);
  const latest = [...latestMap.values()];

  const coveredIds = new Set(sessionActivities.map((sa) => sa.activity_id));
  const totalItems = activities.length;

  const presentRows = attendance.filter((a) => a.present).length;

  const unitStats = [...units]
    .sort((a, b) => a.position - b.position)
    .map((u) => {
      const ids = new Set(u.activities.map((a) => a.id));
      const rs = latest.filter((r) => ids.has(r.activity_id));
      const gap = modeGap(rs);
      return {
        unitId: u.id,
        position: u.position,
        title: u.title,
        unitType: u.unit_type,
        activitiesTotal: u.activities.length,
        activitiesCovered: u.activities.filter((a) => coveredIds.has(a.id)).length,
        hasBothModes: u.activities.some((a) => a.modes.length === 2),
        practicalScore: gap.practicalScore,
        bookScore: gap.bookScore,
        ...summarize(rs),
      };
    });

  const trend = ordered.map((s) => {
    const rs = results.filter((r) => r.session_id === s.id);
    const att = attendance.filter((a) => a.session_id === s.id);
    return {
      sessionId: s.id,
      date: s.session_date,
      activitiesCovered: sessionActivities.filter((sa) => sa.session_id === s.id).length,
      attendanceRate: pct(att.filter((a) => a.present).length, att.length),
      ...summarize(rs),
    };
  });

  const learnerStats = learners.map((l) => {
    const mine = latest.filter((r) => r.learner_id === l.id);
    const myAttendance = attendance.filter((a) => a.learner_id === l.id);
    const attendedSessions = ordered.filter((s) =>
      myAttendance.some((a) => a.session_id === s.id && a.present)
    );

    const flags: Flag[] = [];

    // Repeated "Not yet" in the last two lessons the child attended
    const lastTwo = new Set(attendedSessions.slice(-2).map((s) => s.id));
    const recentNotYet = results.filter(
      (r) => r.learner_id === l.id && lastTwo.has(r.session_id) && r.level === 1
    ).length;
    if (recentNotYet >= FLAG_RULES.repeatedNotYet) flags.push('repeated_not_yet');

    // Attendance over the last five lessons
    const lastFive = new Set(ordered.slice(-5).map((s) => s.id));
    const recentAtt = myAttendance.filter((a) => lastFive.has(a.session_id));
    const recentRate = pct(recentAtt.filter((a) => a.present).length, recentAtt.length);
    if (recentAtt.length >= 3 && recentRate !== null && recentRate < FLAG_RULES.lowAttendancePct) {
      flags.push('low_attendance');
    }

    const gap = modeGap(mine);
    if (gap.pairedCount >= 2 && gap.gap !== null && gap.gap >= FLAG_RULES.bookGapPoints) flags.push('book_gap');

    if (ordered.length > 0 && mine.length === 0) flags.push('not_yet_assessed');

    const unitScores: Record<string, number | null> = {};
    for (const u of units) {
      const ids = new Set(u.activities.map((a) => a.id));
      unitScores[u.id] = summarize(mine.filter((r) => ids.has(r.activity_id))).avgScore;
    }

    return {
      learnerId: l.id,
      name: `${l.first_name} ${l.last_name}`.trim(),
      lessonsAttended: attendedSessions.length,
      attendanceRate: pct(myAttendance.filter((a) => a.present).length, myAttendance.length),
      ...summarize(mine),
      practicalScore: gap.practicalScore,
      bookScore: gap.bookScore,
      modeGap: gap.gap,
      unitScores,
      flags,
    };
  });

  const nextActivities = activities.filter((a) => !coveredIds.has(a.id)).slice(0, 6).map((a) => a.id);

  return {
    summary: {
      learnerCount: learners.length,
      lessonCount: sessions.length,
      lastLessonDate: ordered.length ? ordered[ordered.length - 1].session_date : null,
      activitiesCovered: activities.filter((a) => coveredIds.has(a.id)).length,
      activitiesTotal: totalItems,
      coveragePercent: pct(activities.filter((a) => coveredIds.has(a.id)).length, totalItems),
      attendanceRate: pct(presentRows, attendance.length),
      ...summarize(latest),
    },
    modeGap: modeGap(latest),
    units: unitStats,
    skills: skillScores(latest, activityById),
    trend,
    learners: learnerStats,
    needsAttention: learnerStats.filter((l) => l.flags.length > 0 && !(l.flags.length === 1 && l.flags[0] === 'not_yet_assessed')),
    nextActivityIds: nextActivities,
  };
};

export const computeLearnerProgress = (input: ProgressInput, learnerId: string) => {
  const classProgress = computeClassProgress({
    ...input,
    learners: input.learners.filter((l) => l.id === learnerId),
  });
  const learner = classProgress.learners[0];
  const ordered = sortSessions(input.sessions);
  const activities = flattenActivities(input.units);
  const activityById = new Map(activities.map((a) => [a.id, a]));
  const latest = [...latestResults(input.results, input.sessions).values()].filter((r) => r.learner_id === learnerId);

  const units = [...input.units]
    .sort((a, b) => a.position - b.position)
    .map((u) => {
      const ids = new Set(u.activities.map((a) => a.id));
      const rs = latest.filter((r) => ids.has(r.activity_id));
      return {
        unitId: u.id,
        position: u.position,
        title: u.title,
        unitType: u.unit_type,
        activitiesTotal: u.activities.length,
        activitiesRated: new Set(rs.map((r) => r.activity_id)).size,
        ...summarize(rs),
      };
    });

  const timeline = ordered
    .map((s) => {
      const att = input.attendance.find((a) => a.session_id === s.id && a.learner_id === learnerId);
      const rs = input.results.filter((r) => r.session_id === s.id && r.learner_id === learnerId);
      return {
        sessionId: s.id,
        date: s.session_date,
        present: att ? att.present : null,
        note: att?.note || null,
        ...summarize(rs),
        results: rs.map((r) => ({
          activityId: r.activity_id,
          activityTitle: activityById.get(r.activity_id)?.title || '',
          bothModes: (activityById.get(r.activity_id)?.modes.length || 0) > 1,
          mode: r.mode,
          level: r.level,
        })),
      };
    })
    .filter((t) => t.present !== null || t.results.length > 0);

  // Activities where the child did better with the tools than in the book
  const byActivity = new Map<string, { practical?: number; book?: number }>();
  for (const r of latest) {
    const pair = byActivity.get(r.activity_id) || {};
    pair[r.mode] = r.level;
    byActivity.set(r.activity_id, pair);
  }
  const transferGaps = [...byActivity.entries()]
    .filter(([, p]) => p.practical !== undefined && p.book !== undefined && p.practical > p.book)
    .map(([activityId, p]) => ({
      activityId,
      activityTitle: activityById.get(activityId)?.title || '',
      practical: p.practical,
      book: p.book,
    }));

  return {
    learner,
    units,
    skills: skillScores(latest, activityById),
    timeline,
    transferGaps,
  };
};
