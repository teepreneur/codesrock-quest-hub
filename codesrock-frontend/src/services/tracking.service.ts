import { apiService } from './api.service';

/**
 * Activity-book progress tracking: roster, lesson logging and dashboards.
 * Ratings: 1 = Not yet, 2 = With help, 3 = On their own.
 */

export type Mode = 'practical' | 'book';
export type Level = 1 | 2 | 3;
export type Skill = 'vocabulary' | 'directions' | 'sequencing' | 'navigation' | 'debugging' | 'collaboration';
export type Flag = 'repeated_not_yet' | 'low_attendance' | 'book_gap' | 'not_yet_assessed';

export interface CurriculumActivity {
  id: string;
  unit_id: string;
  position: number;
  title: string;
  book_page: number | null;
  skills: Skill[];
  modes: Mode[];
}

export interface CurriculumUnit {
  id: string;
  position: number;
  title: string;
  unit_type: 'song' | 'story_mission' | 'unplugged' | 'robot' | 'platform';
  book_pages: string | null;
  summary: string | null;
  activities: CurriculumActivity[];
}

export interface Curriculum {
  curriculum: { id: string; slug: string; title: string; description: string | null } | null;
  units: CurriculumUnit[];
}

export interface Learner {
  id: string;
  first_name: string;
  last_name: string;
}

export interface LessonSummary {
  id: string;
  date: string;
  notes: string | null;
  activityCount: number;
  presentCount: number;
  learnerCount: number;
}

export interface LessonDetail {
  id: string;
  date: string;
  notes: string | null;
  activityIds: string[];
  attendance: { learnerId: string; present: boolean; note: string | null }[];
  results: { learnerId: string; activityId: string; mode: Mode; level: Level }[];
}

export interface LessonInput {
  date: string;
  notes?: string;
  activityIds: string[];
  attendance: { learnerId: string; present: boolean; note?: string }[];
  results: { learnerId: string; activityId: string; mode: Mode; level: Level }[];
}

/** avgScore: 0-100 (Not yet = 0, With help = 50, On their own = 100) */
export interface Score {
  avgScore: number | null;
  independentRate: number | null;
  ratedCount: number;
}

export interface UnitProgress extends Score {
  unitId: string;
  position: number;
  title: string;
  unitType: CurriculumUnit['unit_type'];
  activitiesTotal: number;
  activitiesCovered?: number;
  activitiesRated?: number;
  hasBothModes?: boolean;
  practicalScore?: number | null;
  bookScore?: number | null;
}

export interface SkillProgress extends Score {
  skill: Skill;
}

export interface LearnerSummary extends Score {
  learnerId: string;
  name: string;
  lessonsAttended: number;
  attendanceRate: number | null;
  practicalScore: number | null;
  bookScore: number | null;
  modeGap: number | null;
  unitScores: Record<string, number | null>;
  flags: Flag[];
}

export interface ClassProgress {
  class: { id: string; name: string };
  summary: Score & {
    learnerCount: number;
    lessonCount: number;
    lastLessonDate: string | null;
    activitiesCovered: number;
    activitiesTotal: number;
    coveragePercent: number | null;
    attendanceRate: number | null;
  };
  modeGap: { pairedCount: number; practicalScore: number | null; bookScore: number | null; gap: number | null };
  units: UnitProgress[];
  skills: SkillProgress[];
  trend: (Score & { sessionId: string; date: string; activitiesCovered: number; attendanceRate: number | null })[];
  learners: LearnerSummary[];
  needsAttention: LearnerSummary[];
  nextActivityIds: string[];
}

export interface LearnerProgress {
  class: { id: string; name: string };
  learner: LearnerSummary;
  units: UnitProgress[];
  skills: SkillProgress[];
  timeline: (Score & {
    sessionId: string;
    date: string;
    present: boolean | null;
    note: string | null;
    results: { activityId: string; activityTitle: string; bothModes: boolean; mode: Mode; level: Level }[];
  })[];
  transferGaps: { activityId: string; activityTitle: string; practical: Level; book: Level }[];
}

export interface OverviewRow {
  classId: string;
  className: string;
  schoolId: string | null;
  schoolName: string | null;
  teacherId: string;
  teacherName: string | null;
  learnerCount: number;
  lessonCount: number;
  lastLessonDate: string | null;
  activitiesCovered: number;
  activitiesTotal: number;
  coveragePercent: number | null;
  avgScore: number | null;
  independentRate: number | null;
  practicalScore: number | null;
  bookScore: number | null;
  attendanceRate: number | null;
}

export interface SchoolOverview {
  schoolId: string | null;
  schoolName: string;
  classCount: number;
  learnerCount: number;
  lessonCount: number;
  lastLessonDate: string | null;
  coveragePercent: number | null;
  avgScore: number | null;
  independentRate: number | null;
  practicalScore: number | null;
  bookScore: number | null;
  attendanceRate: number | null;
}

const base = (classId: string) => `/tracking/classes/${classId}`;

class TrackingService {
  getCurriculum(classId: string) {
    return apiService.get<Curriculum>(`${base(classId)}/curriculum`);
  }

  getLearners(classId: string) {
    return apiService.get<Learner[]>(`${base(classId)}/learners`);
  }

  addLearner(classId: string, firstName: string, lastName: string) {
    return apiService.post<Learner>(`${base(classId)}/learners`, { firstName, lastName });
  }

  updateLearner(classId: string, learnerId: string, data: { firstName?: string; lastName?: string }) {
    return apiService.patch<Learner>(`${base(classId)}/learners/${learnerId}`, data);
  }

  removeLearner(classId: string, learnerId: string) {
    return apiService.delete(`${base(classId)}/learners/${learnerId}`);
  }

  getLessons(classId: string) {
    return apiService.get<LessonSummary[]>(`${base(classId)}/sessions`);
  }

  getLesson(classId: string, sessionId: string) {
    return apiService.get<LessonDetail>(`${base(classId)}/sessions/${sessionId}`);
  }

  saveLesson(classId: string, lesson: LessonInput, sessionId?: string) {
    return sessionId
      ? apiService.put<{ id: string }>(`${base(classId)}/sessions/${sessionId}`, lesson)
      : apiService.post<{ id: string }>(`${base(classId)}/sessions`, lesson);
  }

  deleteLesson(classId: string, sessionId: string) {
    return apiService.delete(`${base(classId)}/sessions/${sessionId}`);
  }

  getClassProgress(classId: string) {
    return apiService.get<ClassProgress>(`${base(classId)}/progress`);
  }

  getLearnerProgress(classId: string, learnerId: string) {
    return apiService.get<LearnerProgress>(`${base(classId)}/learners/${learnerId}/progress`);
  }

  getOverview(schoolId?: string) {
    return apiService.get<{ schools: SchoolOverview[]; classes: OverviewRow[] }>(
      `/tracking/overview${schoolId ? `?schoolId=${schoolId}` : ''}`
    );
  }
}

export const trackingService = new TrackingService();
