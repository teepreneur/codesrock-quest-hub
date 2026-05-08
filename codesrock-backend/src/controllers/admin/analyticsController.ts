import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';

/**
 * @desc    Get admin dashboard overview
 * @route   GET /api/admin/analytics/overview
 * @access  Private/Admin
 */
export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get date for 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get yesterday for active today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [
      { count: totalTeachers },
      { count: totalStudents },
      { count: activeToday },
      { count: totalCourses },
      { count: newUsersThisMonth },
      { count: totalActivities },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').gte('last_login', yesterday.toISOString()).eq('is_active', true),
      supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher').gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('activities').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo.toISOString()),
    ]);

    // Calculate average teacher completion rate
    const { data: allProgress } = await supabase.from('video_progress').select('watched_seconds, total_seconds');
    const avgTeacherCompletion = allProgress && allProgress.length > 0
      ? allProgress.reduce((sum, p) => sum + (p.total_seconds > 0 ? (p.watched_seconds / p.total_seconds) * 100 : 0), 0) / allProgress.length
      : 0;

    // Calculate average student completion rate (manual topic mastery)
    const { data: studentMastery } = await supabase.from('student_topic_progress').select('id');
    const { count: totalPossibleMastery } = await supabase.from('topics').select('*', { count: 'exact', head: true }).eq('is_active', true);
    
    // Simplified: Percentage of students who have completed at least one topic
    const { data: studentsWithProgress } = await supabase.from('student_topic_progress').select('student_id', { count: 'exact', head: true });
    const studentCompletionRate = totalStudents && totalStudents > 0 
      ? (studentsWithProgress?.length || 0) / totalStudents * 100 
      : 0;

    // Get engagement trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentActivities } = await supabase
      .from('activities')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get evaluation success rate
    const { data: allAttempts } = await supabase.from('evaluation_progress').select('passed');
    const passedCount = (allAttempts || []).filter(a => a.passed).length;
    const totalAttempts = (allAttempts || []).length;
    const evaluationSuccessRate = totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTeachers: totalTeachers || 0,
          totalStudents: totalStudents || 0,
          activeToday: activeToday || 0,
          totalCourses: totalCourses || 0,
          avgTeacherCompletion: Math.round(avgTeacherCompletion),
          studentCompletionRate: Math.round(studentCompletionRate),
          evaluationSuccessRate: Math.round(evaluationSuccessRate),
        },
        trends: {
          newUsersThisMonth: newUsersThisMonth || 0,
          totalActivities: totalActivities || 0,
          engagementCount: recentActivities?.length || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get individual teacher analytics
 * @route   GET /api/admin/analytics/teachers/:id
 * @access  Private/Admin
 */
export const getTeacherAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id;

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*, schools(name)')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    const [
      { data: progress },
      { count: completedCourses },
      { count: totalActivities },
      { data: recentActivity },
    ] = await Promise.all([
      supabase.from('user_progress').select('*').eq('user_id', userId).single(),
      supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('completed', true),
      supabase.from('activities').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('activities').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          school: user.schools,
          lastLogin: user.last_login,
        },
        progress,
        stats: {
          completedCourses: completedCourses || 0,
          totalActivities: totalActivities || 0,
        },
        trends: {
          recentActivity: recentActivity || [],
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get course completion analytics
 * @route   GET /api/admin/analytics/courses
 * @access  Private/Admin
 */
export const getCourseAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data: courses } = await supabase.from('courses').select('*').eq('is_published', true);

    const courseStats = await Promise.all(
      (courses || []).map(async (course) => {
        const [
          { count: totalViews },
          { count: completions },
        ] = await Promise.all([
          supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('completed', true),
        ]);

        return {
          courseId: course.id,
          title: course.title,
          category: course.category,
          totalViews: totalViews || 0,
          completions: completions || 0,
          completionRate: totalViews && totalViews > 0 ? ((completions || 0) / totalViews) * 100 : 0,
        };
      })
    );

    // Sort by completion rate
    courseStats.sort((a, b) => b.completionRate - a.completionRate);

    res.status(200).json({
      success: true,
      data: {
        courses: courseStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get engagement metrics
 * @route   GET /api/admin/analytics/engagement
 * @access  Private/Admin
 */
export const getEngagementMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - Number(days));

    // Get activities for the period
    const { data: activities } = await supabase
      .from('activities')
      .select('user_id, type, timestamp')
      .gte('timestamp', daysAgo.toISOString());

    // Calculate unique users per day
    const dailyUsers = new Map<string, Set<string>>();
    const typeBreakdown = new Map<string, number>();

    (activities || []).forEach((activity) => {
      const date = activity.timestamp.split('T')[0];
      if (!dailyUsers.has(date)) {
        dailyUsers.set(date, new Set());
      }
      dailyUsers.get(date)!.add(activity.user_id);

      typeBreakdown.set(activity.type, (typeBreakdown.get(activity.type) || 0) + 1);
    });

    const dailyActiveUsers = Array.from(dailyUsers.entries()).map(([date, users]) => ({
      date,
      count: users.size,
    }));

    const activityBreakdown = Array.from(typeBreakdown.entries()).map(([type, count]) => ({
      _id: type,
      count,
    }));

    // Get top performers
    const { data: topPerformers } = await supabase
      .from('user_progress')
      .select('*, profiles(first_name, last_name, email)')
      .order('total_xp', { ascending: false })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        dailyActiveUsers,
        activityBreakdown,
        topPerformers: topPerformers || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get school performance analytics
 * @route   GET /api/admin/analytics/schools
 * @access  Private/Admin
 */
export const getSchoolAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get all schools with their teachers and students progress
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .select('id, name, school_code');

    if (schoolError) throw schoolError;

    const schoolStats = await Promise.all(
      (schools || []).map(async (school) => {
        // Get all profiles for this school
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('school_id', school.id);

        const profileIds = (profiles || []).map(p => p.id);
        const teacherCount = (profiles || []).filter(p => p.role === 'teacher').length;
        const studentCount = (profiles || []).filter(p => p.role === 'student').length;

        let totalXP = 0;
        let completions = 0;

        if (profileIds.length > 0) {
          // Get total XP for these profiles
          const { data: progress } = await supabase
            .from('user_progress')
            .select('total_xp')
            .in('user_id', profileIds);

          totalXP = (progress || []).reduce((sum, p) => sum + (p.total_xp || 0), 0);

          // Get completions
          const { count: completionCount } = await supabase
            .from('video_progress')
            .select('*', { count: 'exact', head: true })
            .in('user_id', profileIds)
            .eq('completed', true);
          
          completions = completionCount || 0;
        }

        return {
          id: school.id,
          name: school.name,
          schoolCode: school.school_code,
          teacherCount,
          studentCount,
          totalXP,
          completions,
        };
      })
    );

    // Sort by total XP
    schoolStats.sort((a, b) => b.totalXP - a.totalXP);

    res.status(200).json({
      success: true,
      data: {
        schools: schoolStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed school performance
 * @route   GET /api/admin/analytics/schools/:id/performance
 * @access  Private/Admin
 */
export const getSchoolPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const schoolId = req.params.id;

    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single();

    if (schoolError || !school) {
      res.status(404).json({ success: false, message: 'School not found' });
      return;
    }

    // Get all teachers in this school
    const { data: teachers } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, last_login')
      .eq('school_id', schoolId)
      .eq('role', 'teacher');

    const teacherStats = await Promise.all(
      (teachers || []).map(async (teacher) => {
        // Teacher's own progress
        const { data: progress } = await supabase
          .from('video_progress')
          .select('completed')
          .eq('user_id', teacher.id);
        
        const ownCompletions = (progress || []).filter(p => p.completed).length;

        // Students under this teacher (via classes)
        const { data: teacherClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', teacher.id);
        
        const classIds = (teacherClasses || []).map(c => c.id);
        
        let studentCount = 0;
        let avgStudentXP = 0;

        if (classIds.length > 0) {
          const { data: classStudents } = await supabase
            .from('class_students')
            .select('student_id')
            .in('class_id', classIds);
          
          const studentIds = (classStudents || []).map(cs => cs.student_id);
          studentCount = studentIds.length;

          if (studentCount > 0) {
            const { data: studentXP } = await supabase
              .from('user_progress')
              .select('total_xp')
              .in('user_id', studentIds);
            
            const totalXP = (studentXP || []).reduce((sum, p) => sum + (p.total_xp || 0), 0);
            avgStudentXP = totalXP / studentCount;
          }
        }

        return {
          id: teacher.id,
          name: `${teacher.first_name} ${teacher.last_name}`,
          email: teacher.email,
          ownCompletions,
          studentCount,
          avgStudentXP: Math.round(avgStudentXP),
          lastLogin: teacher.last_login
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        school,
        teachers: teacherStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed teacher performance & students
 * @route   GET /api/admin/analytics/teachers/:id/performance
 * @access  Private/Admin
 */
export const getTeacherDetailedPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const teacherId = req.params.id;

    const { data: teacher, error: teacherError } = await supabase
      .from('profiles')
      .select('*, schools(name)')
      .eq('id', teacherId)
      .single();

    if (teacherError || !teacher) {
      res.status(404).json({ success: false, message: 'Teacher not found' });
      return;
    }

    // Teacher's own progress details
    const { data: ownProgress } = await supabase
      .from('video_progress')
      .select('*, courses(title)')
      .eq('user_id', teacherId);

    // Get all students under this teacher
    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('id, name')
      .eq('teacher_id', teacherId);
    
    const classIds = (teacherClasses || []).map(c => c.id);
    
    let students = [];

    if (classIds.length > 0) {
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('student_id, classes(name)')
        .in('class_id', classIds);
      
      const studentIds = (classStudents || []).map(cs => cs.student_id);

      if (studentIds.length > 0) {
        const { data: studentProfiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email, last_login')
          .in('id', studentIds);
        
        const { data: studentXP } = await supabase
          .from('user_progress')
          .select('user_id, total_xp, current_level')
          .in('user_id', studentIds);

        const { data: studentMastery } = await supabase
          .from('student_topic_progress')
          .select('student_id')
          .in('student_id', studentIds);

        students = (studentProfiles || []).map(profile => {
          const xpData = (studentXP || []).find(x => x.user_id === profile.id);
          const masteryCount = (studentMastery || []).filter(m => m.student_id === profile.id).length;
          const classInfo = (classStudents || []).find(cs => cs.student_id === profile.id);

          return {
            id: profile.id,
            name: `${profile.first_name} ${profile.last_name}`,
            email: profile.email,
            xp: xpData?.total_xp || 0,
            level: xpData?.current_level || 1,
            masteryCount,
            className: classInfo?.classes?.name || 'Unknown',
            lastLogin: profile.last_login
          };
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          name: `${teacher.first_name} ${teacher.last_name}`,
          school: teacher.schools?.name || 'Independent',
        },
        ownProgress: ownProgress || [],
        students,
        classes: teacherClasses || []
      },
    });
  } catch (error) {
    next(error);
  }
};
