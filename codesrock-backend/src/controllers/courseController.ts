import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import logger from '../utils/logger';

/**
 * Get all courses with topic/video counts and user progress
 * GET /api/courses
 */
export const getAllCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;

    // Build query
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error getting courses:', error);
      res.status(500).json({ success: false, message: 'Failed to get courses', error: error.message });
      return;
    }

    // Enrich each course with topic count, video count, and user progress
    const enrichedCourses = await Promise.all(
      (courses || []).map(async (course) => {
        // Get topic and video counts
        const [
          { count: topicCount },
          { count: videoCount },
        ] = await Promise.all([
          supabase.from('topics').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('is_active', true),
          supabase.from('videos').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('is_active', true),
        ]);

        let userProgress = null;
        if (userId) {
          // Security Check: IDOR Protection
          if (userId !== req.user?.userId && !['super_admin', 'school_admin', 'content_admin'].includes(req.user?.role || '')) {
            logger.warn(`IDOR attempt: User ${req.user?.userId} tried to access course progress of ${userId}`);
            res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
            return;
          }

          // Calculate progress: completed videos / total videos in this course
          const { count: completedVideos } = await supabase
            .from('video_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId as string)
            .eq('course_id', course.id)
            .not('video_id', 'is', null)
            .eq('completed', true);

          const totalVideos = videoCount || 0;
          const progressPercentage = totalVideos > 0 ? Math.round(((completedVideos || 0) / totalVideos) * 100) : 0;

          userProgress = {
            completedVideos: completedVideos || 0,
            totalVideos,
            progressPercentage,
            isCompleted: progressPercentage >= 100,
          };
        }

        return {
          ...course,
          topicCount: topicCount || 0,
          videoCount: videoCount || 0,
          userProgress,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedCourses?.length || 0,
      data: enrichedCourses || [],
    });
  } catch (error: any) {
    console.error('Error getting courses:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get course by ID with full hierarchy (topics → videos) and user progress
 * GET /api/courses/:courseId
 */
export const getCourseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { userId } = req.query;

    // Security Check: IDOR Protection
    if (userId && userId !== req.user?.userId && !['super_admin', 'school_admin', 'content_admin'].includes(req.user?.role || '')) {
      logger.warn(`IDOR attempt: User ${req.user?.userId} tried to access course details with userId ${userId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error || !course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Get topics with their videos
    const { data: topics } = await supabase
      .from('topics')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('order_index');

    const topicsWithVideos = await Promise.all(
      (topics || []).map(async (topic) => {
        const { data: videos } = await supabase
          .from('videos')
          .select('*')
          .eq('topic_id', topic.id)
          .eq('is_active', true)
          .order('order_index');

        // Get per-video progress if userId provided
        let videosWithProgress = videos || [];
        if (userId) {
          const videoIds = (videos || []).map((v) => v.id);
          const { data: progressRecords } = await supabase
            .from('video_progress')
            .select('*')
            .eq('user_id', userId as string)
            .in('video_id', videoIds.length > 0 ? videoIds : ['__none__']);

          const progressMap = new Map(
            progressRecords?.map((p) => [p.video_id, p]) || []
          );

          videosWithProgress = (videos || []).map((video) => {
            const progress = progressMap.get(video.id);
            return {
              ...video,
              userProgress: progress
                ? {
                    completed: progress.completed,
                    watchPercentage: progress.watch_percentage || 0,
                    lastWatchedAt: progress.last_watched_at,
                  }
                : null,
            };
          });
        }

        return {
          ...topic,
          videos: videosWithProgress,
          videoCount: videosWithProgress.length,
        };
      })
    );

    // Calculate overall course progress
    let courseProgress = null;
    if (userId) {
      const totalVideos = topicsWithVideos.reduce((sum, t) => sum + t.videoCount, 0);
      const completedVideos = topicsWithVideos.reduce(
        (sum, t) => sum + t.videos.filter((v: any) => v.userProgress?.completed).length,
        0
      );
      const progressPercentage = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

      courseProgress = {
        completedVideos,
        totalVideos,
        progressPercentage,
        isCompleted: progressPercentage >= 100,
      };
    }

    // Increment view count
    await supabase
      .from('courses')
      .update({ view_count: (course.view_count || 0) + 1 })
      .eq('id', courseId);

    res.status(200).json({
      success: true,
      data: {
        course: {
          ...course,
          topics: topicsWithVideos,
          topicCount: topicsWithVideos.length,
          videoCount: topicsWithVideos.reduce((sum, t) => sum + t.videoCount, 0),
        },
        courseProgress,
      },
    });
  } catch (error: any) {
    console.error('Error getting course:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get courses by category
 * GET /api/courses/category/:category
 */
export const getCoursesByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category } = req.params;
    const { userId } = req.query;

    // Security Check: IDOR Protection
    if (userId && userId !== req.user?.userId && !['super_admin', 'school_admin', 'content_admin'].includes(req.user?.role || '')) {
      logger.warn(`IDOR attempt: User ${req.user?.userId} tried to access courses by category for ${userId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error getting courses by category:', error);
      res.status(500).json({ success: false, message: 'Failed to get courses', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      category,
      count: courses?.length || 0,
      data: courses || [],
    });
  } catch (error: any) {
    console.error('Error getting courses by category:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update video progress (awards XP at 80% completion)
 * POST /api/courses/progress
 */
export const updateVideoProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, videoId, courseId, watchedSeconds, totalSeconds } = req.body;

    // Security Check: IDOR Protection
    if (userId !== req.user?.userId && !['super_admin', 'content_admin'].includes(req.user?.role || '')) {
      logger.warn(`IDOR attempt: User ${req.user?.userId} tried to update video progress for ${userId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    // Validation
    if (!userId || !videoId || !courseId || watchedSeconds === undefined || !totalSeconds) {
      res.status(400).json({
        success: false,
        message: 'User ID, video ID, course ID, watched seconds, and total seconds are required',
      });
      return;
    }

    // Calculate progress percentage
    const progressPercentage = totalSeconds > 0 ? Math.round((watchedSeconds / totalSeconds) * 100) : 0;

    // Find or create video progress (keyed by video_id now)
    const { data: existingProgress } = await supabase
      .from('video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    let progress = existingProgress;

    if (!progress) {
      // Create new progress record
      const { data: newProgress, error: createError } = await supabase
        .from('video_progress')
        .insert({
          user_id: userId,
          course_id: courseId,
          video_id: videoId,
          watch_percentage: progressPercentage,
          completed: false,
          xp_awarded: false,
          last_watched_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating video progress:', createError);
        res.status(500).json({ success: false, message: 'Failed to create progress' });
        return;
      }

      progress = newProgress;

      // Create activity for starting video
      const { data: video } = await supabase
        .from('videos')
        .select('title')
        .eq('id', videoId)
        .single();

      if (video) {
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'video_started',
          description: `Started watching: ${video.title}`,
          xp_earned: 0,
          metadata: { videoId, courseId, videoTitle: video.title },
        });
      }
    }

    // Update progress
    const wasCompleted = progress.completed;
    const isNowCompleted = !wasCompleted && progressPercentage >= 80;

    const updateData: Record<string, any> = {
      watch_percentage: progressPercentage,
      last_watched_at: new Date().toISOString(),
    };

    if (isNowCompleted) {
      updateData.completed = true;
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedProgress, error: updateError } = await supabase
      .from('video_progress')
      .update(updateData)
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating progress:', updateError);
      res.status(500).json({ success: false, message: 'Failed to update progress' });
      return;
    }

    progress = updatedProgress;

    // Award XP if just completed and not already awarded
    if (isNowCompleted && !progress.xp_awarded) {
      const { data: video } = await supabase
        .from('videos')
        .select('title, xp_reward')
        .eq('id', videoId)
        .single();

      if (video) {
        // Award XP via RPC
        await supabase.rpc('award_xp', {
          p_user_id: userId,
          p_xp_amount: video.xp_reward,
          p_activity_type: 'video_completed',
          p_description: `Completed video: ${video.title}`,
          p_metadata: { videoId, courseId, videoTitle: video.title },
        });

        // Mark XP as awarded
        await supabase
          .from('video_progress')
          .update({ xp_awarded: true })
          .eq('user_id', userId)
          .eq('video_id', videoId);

        // Increment video completion count
        await supabase
          .from('videos')
          .update({ completion_count: (video as any).completion_count + 1 || 1 })
          .eq('id', videoId);
      }
    }

    res.status(200).json({
      success: true,
      message: isNowCompleted
        ? 'Video completed! XP awarded.'
        : 'Progress updated successfully',
      data: {
        progress: {
          completed: progress.completed,
          progressPercentage: progress.watch_percentage,
          xpAwarded: progress.xp_awarded,
        },
        justCompleted: isNowCompleted,
      },
    });
  } catch (error: any) {
    console.error('Error updating video progress:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get recommended courses based on user history
 * GET /api/courses/recommended/:userId
 */
export const getRecommendedCourses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Security Check: IDOR Protection
    if (userId !== req.user?.userId && !['super_admin', 'school_admin', 'content_admin'].includes(req.user?.role || '')) {
      logger.warn(`IDOR attempt: User ${req.user?.userId} tried to get recommendations for ${userId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }
    const limit = parseInt(req.query.limit as string) || 5;

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, thumbnail, category, difficulty, xp_reward')
      .eq('is_active', true)
      .order('view_count', { ascending: false })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: courses?.length || 0,
      data: courses || [],
    });
  } catch (error: any) {
    console.error('Error getting recommended courses:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add bookmark to video
 * POST /api/courses/bookmark
 */
export const bookmarkMoment = async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({
    success: false,
    message: 'Bookmark feature is not currently available',
  });
};

/**
 * Get user's course progress summary
 * GET /api/courses/progress/:userId
 */
export const getUserCourseProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Security Check: IDOR Protection
    if (userId !== req.user?.userId && !['super_admin', 'school_admin', 'content_admin'].includes(req.user?.role || '')) {
      logger.warn(`IDOR attempt: User ${req.user?.userId} tried to access course progress summary of ${userId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const [
      { count: inProgress },
      { count: completed },
      { count: total },
    ] = await Promise.all([
      supabase
        .from('video_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', false)
        .gt('watch_percentage', 0),
      supabase
        .from('video_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completed', true),
      supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),
    ]);

    // Get recent progress
    const { data: recentProgress } = await supabase
      .from('video_progress')
      .select('*, videos(title, thumbnail, duration, xp_reward), courses(title, category)')
      .eq('user_id', userId)
      .not('video_id', 'is', null)
      .order('last_watched_at', { ascending: false })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalVideos: total || 0,
          inProgress: inProgress || 0,
          completed: completed || 0,
          notStarted: (total || 0) - (inProgress || 0) - (completed || 0),
        },
        recentProgress,
      },
    });
  } catch (error: any) {
    console.error('Error getting user course progress:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
