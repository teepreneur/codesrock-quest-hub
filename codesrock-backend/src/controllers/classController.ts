import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import logger from '../utils/logger';

/**
 * Get all classes for a teacher
 * GET /api/classes
 */
export const getTeacherClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.query;

    // Security Check: IDOR Protection
    if (teacherId !== req.user?.userId && !['super_admin', 'school_admin'].includes(req.user?.role || '')) {
      logger.warn(`IDOR attempt: User ${req.user?.userId} tried to access classes for teacher ${teacherId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    if (!teacherId) {
      res.status(400).json({ success: false, message: 'Teacher ID is required' });
      return;
    }

    const { data: classes, error } = await supabase
      .from('classes')
      .select('*, courses(title, thumbnail), schools(name)')
      .eq('teacher_id', teacherId as string)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting teacher classes:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to get classes from database', 
        error: error.message,
        details: error.details,
        hint: 'Ensure the "classes" table exists and you have run the migration script.'
      });
      return;
    }

    // Get student counts for each class
    const classesWithCounts = await Promise.all((classes || []).map(async (cls) => {
      const { count } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', cls.id);
      
      return { ...cls, studentCount: count || 0 };
    }));

    res.status(200).json({
      success: true,
      count: classesWithCounts.length,
      data: classesWithCounts,
    });
  } catch (error: any) {
    console.error('Error in getTeacherClasses:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Create a new class
 * POST /api/classes
 */
export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, teacherId, courseId, schoolId } = req.body;

    // Security Check: IDOR Protection
    if (teacherId !== req.user?.userId && !['super_admin', 'school_admin'].includes(req.user?.role || '')) {
      logger.warn(`IDOR attempt: User ${req.user?.userId} tried to create class for teacher ${teacherId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    if (!name || !teacherId) {
      res.status(400).json({ success: false, message: 'Class name and teacher ID are required' });
      return;
    }

    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        name,
        teacher_id: teacherId,
        course_id: courseId || null,
        school_id: schoolId || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating class:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create class in database', 
        error: error.message,
        details: error.details,
        hint: 'Ensure the "classes" table exists and migrations are up to date.'
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });
  } catch (error: any) {
    console.error('Error in createClass:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add student to class
 * POST /api/classes/:classId/students
 */
export const addStudentToClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { studentId } = req.body;

    // Security Check: IDOR Protection (Verify teacher owns the class)
    const { data: cls } = await supabase.from('classes').select('teacher_id').eq('id', classId).single();
    if (!cls || (cls.teacher_id !== req.user?.userId && !['super_admin', 'school_admin'].includes(req.user?.role || ''))) {
      logger.warn(`Unauthorized class access: User ${req.user?.userId} tried to add student to class ${classId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    if (!studentId) {
      res.status(400).json({ success: false, message: 'Student ID is required' });
      return;
    }

    const { data: enrollment, error } = await supabase
      .from('class_students')
      .insert({
        class_id: classId,
        student_id: studentId
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        res.status(400).json({ success: false, message: 'Student is already in this class' });
        return;
      }
      console.error('Error adding student to class:', error);
      res.status(500).json({ success: false, message: 'Failed to add student to class', error: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Student added to class successfully',
      data: enrollment
    });
  } catch (error: any) {
    console.error('Error in addStudentToClass:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get students in a class
 * GET /api/classes/:classId/students
 */
export const getClassStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    // Security Check: IDOR Protection (Verify teacher owns the class)
    const { data: cls } = await supabase.from('classes').select('teacher_id').eq('id', classId).single();
    if (!cls || (cls.teacher_id !== req.user?.userId && !['super_admin', 'school_admin'].includes(req.user?.role || ''))) {
      logger.warn(`Unauthorized class access: User ${req.user?.userId} tried to get students for class ${classId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const { data: enrollments, error } = await supabase
      .from('class_students')
      .select('*, profiles!student_id(*)')
      .eq('class_id', classId);

    if (error) {
      console.error('Error getting class students:', error);
      res.status(500).json({ success: false, message: 'Failed to get students', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      count: enrollments?.length || 0,
      data: enrollments?.map(e => ({
        ...e,
        student: e.profiles
      })) || []
    });
  } catch (error: any) {
    console.error('Error in getClassStudents:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Batch enroll students (New requirement)
 * POST /api/classes/:classId/batch-enroll
 */
export const batchEnrollStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { studentIds } = req.body;

    // Security Check: IDOR Protection (Verify teacher owns the class)
    const { data: cls } = await supabase.from('classes').select('teacher_id').eq('id', classId).single();
    if (!cls || (cls.teacher_id !== req.user?.userId && !['super_admin', 'school_admin'].includes(req.user?.role || ''))) {
      logger.warn(`Unauthorized class access: User ${req.user?.userId} tried to batch enroll students in class ${classId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      res.status(400).json({ success: false, message: 'An array of student IDs is required' });
      return;
    }

    const enrollments = studentIds.map(id => ({
      class_id: classId,
      student_id: id
    }));

    const { data, error } = await supabase
      .from('class_students')
      .insert(enrollments)
      .select();

    if (error) {
      console.error('Error in batch enrollment:', error);
      res.status(500).json({ success: false, message: 'Failed to enroll students', error: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      message: `Successfully enrolled ${data?.length} students`,
      data
    });
  } catch (error: any) {
    console.error('Error in batchEnrollStudents:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Enroll student by email
 * POST /api/classes/:classId/enroll-email
 */
export const enrollStudentByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { email } = req.body;

    // Security Check: IDOR Protection (Verify teacher owns the class)
    const { data: cls } = await supabase.from('classes').select('teacher_id').eq('id', classId).single();
    if (!cls || (cls.teacher_id !== req.user?.userId && !['super_admin', 'school_admin'].includes(req.user?.role || ''))) {
      logger.warn(`Unauthorized class access: User ${req.user?.userId} tried to enroll student by email in class ${classId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    if (!email) {
      res.status(400).json({ success: false, message: 'Student email is required' });
      return;
    }

    // 1. Find the student profile by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ success: false, message: 'Student with this email not found. Please ensure they have registered.' });
      return;
    }

    // 2. Enroll the student in the class
    const { data: enrollment, error: enrollError } = await supabase
      .from('class_students')
      .insert({
        class_id: classId,
        student_id: profile.id
      })
      .select()
      .single();

    if (enrollError) {
      if (enrollError.code === '23505') {
        res.status(400).json({ success: false, message: 'Student is already in this class' });
        return;
      }
      throw enrollError;
    }

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: enrollment
    });
  } catch (error: any) {
    console.error('Error in enrollStudentByEmail:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get analytics for a specific class
 * GET /api/classes/:classId/analytics
 */
export const getClassAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;

    // Security Check: IDOR Protection
    const { data: cls } = await supabase.from('classes').select('teacher_id').eq('id', classId).single();
    if (!cls || (cls.teacher_id !== req.user?.userId && !['super_admin', 'school_admin'].includes(req.user?.role || ''))) {
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    // 1. Get all students in the class
    const { data: enrollments, error: enrollError } = await supabase
      .from('class_students')
      .select('student_id')
      .eq('class_id', classId);

    if (enrollError) throw enrollError;

    if (!enrollments || enrollments.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          class_id: classId,
          average_completion: 0,
          total_xp: 0,
          active_students: 0,
          student_progress: []
        }
      });
      return;
    }

    const studentIds = enrollments.map(e => e.student_id);

    // 2. Get detailed progress for all students
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', studentIds);

    if (profileError) throw profileError;

    const { data: progress, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .in('user_id', studentIds);

    if (progressError) throw progressError;

    // 3. Compile analytics
    const studentProgress = profiles.map(p => {
      const prog = progress?.find(pr => pr.user_id === p.id);
      return {
        student_id: p.id,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        xp: prog?.current_xp || 0,
        level: prog?.current_level || 1,
        completion_percentage: 0, // Calculated dynamically in a real app based on courses
        last_active: prog?.updated_at
      };
    });

    const totalXP = studentProgress.reduce((sum, s) => sum + s.xp, 0);
    const avgCompletion = studentProgress.length > 0 ? 
      studentProgress.reduce((sum, s) => sum + s.completion_percentage, 0) / studentProgress.length : 0;

    res.status(200).json({
      success: true,
      data: {
        class_id: classId,
        average_completion: Math.round(avgCompletion),
        total_xp: totalXP,
        active_students: studentProgress.length,
        student_progress: studentProgress
      }
    });
  } catch (error: any) {
    console.error('Error in getClassAnalytics:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Manually create a student and enroll them (for K-3 users without email)
 * POST /api/classes/:classId/manual-enroll
 */
export const manuallyCreateAndEnroll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { classId } = req.params;
    const { firstName, lastName } = req.body;

    if (!firstName || !lastName) {
      res.status(400).json({ success: false, message: 'First name and last name are required' });
      return;
    }

    // Security Check: IDOR Protection
    const { data: cls } = await supabase.from('classes').select('teacher_id, school_id').eq('id', classId).single();
    if (!cls || (cls.teacher_id !== req.user?.userId && !['super_admin', 'school_admin'].includes(req.user?.role || ''))) {
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    // 1. Create a placeholder email
    const placeholderEmail = `student_${Date.now()}_${Math.floor(Math.random() * 1000)}@codesrock.internal`;
    const tempPassword = Math.random().toString(36).slice(-12);

    // 2. Create the auth user (using admin privileges)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: placeholderEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName, role: 'student' }
    });

    if (authError) {
      console.error('Error creating student auth:', authError);
      throw authError;
    }

    // 3. Update the profile to ensure role and school_id are correct
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ 
        first_name: firstName, 
        last_name: lastName, 
        role: 'student',
        school_id: cls.school_id 
      })
      .eq('id', authUser.user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Error updating student profile:', profileError);
    }

    // 4. Enroll in class
    const { data: enrollment, error: enrollError } = await supabase
      .from('class_students')
      .insert({
        class_id: classId,
        student_id: authUser.user.id
      })
      .select()
      .single();

    if (enrollError) throw enrollError;

    res.status(201).json({
      success: true,
      message: 'Student created and enrolled successfully',
      data: {
        student: profile || { first_name: firstName, last_name: lastName, id: authUser.user.id },
        enrollment
      }
    });
  } catch (error: any) {
    console.error('Error in manuallyCreateAndEnroll:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
