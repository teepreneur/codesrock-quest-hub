import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';
import logger from '../../utils/logger';

/**
 * @desc    Get all videos for a topic
 * @route   GET /api/admin/content/topics/:topicId/videos
 * @access  Private/ContentAdmin
 */
export const getVideosByTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topicId } = req.params;

    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('order_index');

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: videos?.length || 0,
      data: {
        videos: videos || []
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new video under a topic
 * @route   POST /api/admin/content/topics/:topicId/videos
 * @access  Private/ContentAdmin
 */
export const createVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topicId } = req.params;
    const { title, description, videoUrl, thumbnail, duration, xpReward, orderIndex } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    // Get the topic to find its course_id
    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, course_id')
      .eq('id', topicId)
      .single();

    if (topicError || !topic) {
      res.status(404).json({ success: false, message: 'Topic not found' });
      return;
    }

    // Get next order index if not provided
    let order = orderIndex;
    if (order === undefined || order === null) {
      const { data: lastVideo } = await supabase
        .from('videos')
        .select('order_index')
        .eq('topic_id', topicId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      order = (lastVideo?.order_index || 0) + 1;
    }

    // Build video URL from input
    let finalVideoUrl = videoUrl;
    if (videoUrl && !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
      // Assume it's just a video ID
      finalVideoUrl = `https://www.youtube.com/watch?v=${videoUrl.trim()}`;
    }

    const { data: video, error } = await supabase
      .from('videos')
      .insert({
        topic_id: topicId,
        course_id: topic.course_id,
        title,
        description: description || '',
        video_url: finalVideoUrl || null,
        thumbnail: thumbnail || null,
        duration: duration || 0,
        xp_reward: xpReward || 25,
        order_index: order,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info(`Video "${title}" created under topic ${topicId} by user ${req.user?.userId}`);

    res.status(201).json({
      success: true,
      message: 'Video created successfully',
      data: { video },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a video
 * @route   PUT /api/admin/content/videos/:videoId
 * @access  Private/ContentAdmin
 */
export const updateVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { title, description, videoUrl, thumbnail, duration, xpReward, orderIndex, isActive } = req.body;

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (duration !== undefined) updateData.duration = duration;
    if (xpReward !== undefined) updateData.xp_reward = xpReward;
    if (orderIndex !== undefined) updateData.order_index = orderIndex;
    if (isActive !== undefined) updateData.is_active = isActive;

    if (videoUrl !== undefined) {
      let finalVideoUrl = videoUrl;
      if (videoUrl && !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
        finalVideoUrl = `https://www.youtube.com/watch?v=${videoUrl.trim()}`;
      }
      updateData.video_url = finalVideoUrl;
    }

    const { data: video, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      data: { video },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete (soft) a video
 * @route   DELETE /api/admin/content/videos/:videoId
 * @access  Private/ContentAdmin
 */
export const deleteVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { videoId } = req.params;

    const { error } = await supabase
      .from('videos')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', videoId);

    if (error) throw error;

    logger.info(`Video ${videoId} soft-deleted by user ${req.user?.userId}`);

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
