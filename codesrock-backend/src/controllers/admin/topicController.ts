import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';
import logger from '../../utils/logger';

/**
 * @desc    Get all topics across all courses (for Evaluations tab)
 * @route   GET /api/admin/content/topics
 * @access  Private/ContentAdmin
 */
export const getAllTopics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*, courses(title), evaluations(id, title, is_active)')
      .eq('is_active', true)
      .order('course_id');

    if (error) throw error;

    // Filter out topics where course is inactive (if any)
    const validTopics = (topics || []).filter(t => t.courses);

    res.status(200).json({
      success: true,
      count: validTopics.length,
      data: {
        topics: validTopics.map(t => ({
          ...t,
          courseTitle: t.courses?.title,
          evaluationStatus: t.evaluations?.length > 0 ? (t.evaluations[0].is_active ? 'active' : 'inactive') : 'none',
          evaluationId: t.evaluations?.length > 0 ? t.evaluations[0].id : null
        }))
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all topics for a course
 * @route   GET /api/admin/content/courses/:courseId/topics
 * @access  Private/ContentAdmin
 */
export const getTopicsByCourse = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;

    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('order_index');

    if (error) throw error;

    // Get video counts for each topic
    const topicsWithCounts = await Promise.all(
      (topics || []).map(async (topic) => {
        const { count } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('topic_id', topic.id)
          .eq('is_active', true);

        return { ...topic, videoCount: count || 0 };
      })
    );

    res.status(200).json({
      success: true,
      count: topicsWithCounts.length,
      data: {
        topics: topicsWithCounts
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new topic under a course
 * @route   POST /api/admin/content/courses/:courseId/topics
 * @access  Private/ContentAdmin
 */
export const createTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { title, description, thumbnail, orderIndex } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Title is required' });
      return;
    }

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      res.status(404).json({ success: false, message: 'Course not found' });
      return;
    }

    // Get next order index if not provided
    let order = orderIndex;
    if (order === undefined || order === null) {
      const { data: lastTopic } = await supabase
        .from('topics')
        .select('order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      order = (lastTopic?.order_index || 0) + 1;
    }

    const { data: topic, error } = await supabase
      .from('topics')
      .insert({
        course_id: courseId,
        title,
        description: description || '',
        thumbnail: thumbnail || null,
        order_index: order,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info(`Topic "${title}" created under course ${courseId} by user ${req.user?.userId}`);

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: { topic },
    });
  } catch (error: any) {
    console.error('[CREATE_TOPIC ERROR]', {
      courseId: req.params.courseId,
      body: req.body,
      error: error?.message || error,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    next(error);
  }
};

/**
 * @desc    Update a topic
 * @route   PUT /api/admin/content/topics/:topicId
 * @access  Private/ContentAdmin
 */
export const updateTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topicId } = req.params;
    const { title, description, thumbnail, orderIndex, isActive } = req.body;

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (orderIndex !== undefined) updateData.order_index = orderIndex;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data: topic, error } = await supabase
      .from('topics')
      .update(updateData)
      .eq('id', topicId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Topic updated successfully',
      data: { topic },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete (soft) a topic
 * @route   DELETE /api/admin/content/topics/:topicId
 * @access  Private/ContentAdmin
 */
export const deleteTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topicId } = req.params;

    // Soft delete the topic
    const { error } = await supabase
      .from('topics')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', topicId);

    if (error) throw error;

    // Also soft delete all videos under this topic
    await supabase
      .from('videos')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('topic_id', topicId);

    logger.info(`Topic ${topicId} soft-deleted by user ${req.user?.userId}`);

    res.status(200).json({
      success: true,
      message: 'Topic deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
