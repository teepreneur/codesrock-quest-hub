import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import logger from '../utils/logger';
import { listTeacherClasses, teacherNames } from '../services/classAccess';

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

    // Every class in the teacher's school, so teachers who share a class all see it
    let classes: any[];
    try {
      classes = await listTeacherClasses<any>(teacherId as string, '*, courses(title, thumbnail), schools(name), class_learners(learner_id)');
    } catch (error: any) {
      console.error('Error getting teacher classes:', error);
      res.status(500).json({ success: false, message: 'Failed to get classes from database' });
      return;
    }
    const names = await teacherNames(classes.map((c) => c.teacher_id));

    // Compute student counts in memory from inline relations (resolves N+1 query)
    const classesWithCounts = classes
      .map((cls) => {
        const studentCount = (cls.class_learners as any)?.length || 0;
        const { class_learners, ...classData } = cls;
        return {
          ...classData,
          studentCount,
          createdBy: names.get(cls.teacher_id) || null,
          createdByMe: cls.teacher_id === teacherId,
        };
      })
      // Newest first, the teacher's own classes before colleagues'
      .sort((a, b) => Number(b.createdByMe) - Number(a.createdByMe) || String(b.created_at).localeCompare(String(a.created_at)));

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

    let resolvedSchoolId = schoolId;
    if (!resolvedSchoolId) {
      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', teacherId)
        .single();
      if (teacherProfile && teacherProfile.school_id) {
        resolvedSchoolId = teacherProfile.school_id;
      }
    }

    // New classes follow the CodesRock 1 activity book by default
    const { data: curriculum } = await supabase
      .from('curricula')
      .select('id')
      .eq('slug', 'codesrock-1-activity-book')
      .single();

    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        name,
        teacher_id: teacherId,
        course_id: courseId || null,
        school_id: resolvedSchoolId || null,
        curriculum_id: curriculum?.id || null
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
