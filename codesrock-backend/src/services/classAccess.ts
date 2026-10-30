/**
 * Who can work with a class.
 *
 * Teachers often share a class, so a teacher works with every class in their
 * school (seeing and editing its roster, lessons and progress), plus any class
 * they created that is not linked to a school yet. School admins have the
 * classes in their school, super admins every class, and content admins can
 * read but not change anything.
 */
import { supabase } from '../config/supabase';

export interface AccessUser {
  userId: string;
  role: string;
  schoolId: string | null;
}

export interface ClassScope {
  teacher_id: string;
  school_id: string | null;
}

export const canAccessClass = (user: AccessUser, cls: ClassScope, write = false): boolean => {
  if (user.role === 'super_admin') return true;
  if (cls.teacher_id === user.userId) return true;
  const sameSchool = !!cls.school_id && cls.school_id === user.schoolId;
  if ((user.role === 'teacher' || user.role === 'school_admin') && sameSchool) return true;
  return user.role === 'content_admin' && !write;
};

export const getUserSchoolId = async (userId: string): Promise<string | null> => {
  const { data } = await supabase.from('profiles').select('school_id').eq('id', userId).single();
  return data?.school_id || null;
};

/** Classes a teacher works with, oldest first */
export const listTeacherClasses = async <T>(userId: string, columns: string): Promise<T[]> => {
  const schoolId = await getUserSchoolId(userId);
  let query = supabase.from('classes').select(columns);
  query = schoolId ? query.or(`school_id.eq.${schoolId},teacher_id.eq.${userId}`) : query.eq('teacher_id', userId);
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as T[];
};

/** "First Last" for each profile id, for "created by" and "logged by" labels */
export const teacherNames = async (ids: (string | null | undefined)[]): Promise<Map<string, string>> => {
  const unique = [...new Set(ids.filter((id): id is string => !!id))];
  if (unique.length === 0) return new Map();
  const { data } = await supabase.from('profiles').select('id, first_name, last_name').in('id', unique);
  return new Map((data || []).map((p: any) => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'A teacher']));
};
