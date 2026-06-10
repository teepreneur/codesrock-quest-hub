import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';
import logger from '../../utils/logger';

/**
 * Create a new training session (Admin only)
 * POST /api/admin/training
 */
export const createTrainingSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, instructor, startTime, endTime, type, meetingLink, recordingUrl, maxParticipants, tags, xpReward, isActive, status } = req.body;

    if (!title || !startTime || !endTime) {
      res.status(400).json({ success: false, message: 'Title, start time, and end time are required' });
      return;
    }

    const { data: session, error } = await supabase
      .from('training_sessions')
      .insert({
        title,
        description,
        instructor,
        start_time: startTime,
        end_time: endTime,
        type: type || 'live',
        meeting_link: meetingLink,
        recording_url: recordingUrl,
        max_participants: maxParticipants,
        tags,
        xp_reward: xpReward || 25,
        is_active: isActive !== undefined ? isActive : true,
        status: status || 'scheduled'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating training session:', error);
      res.status(500).json({ success: false, message: 'Failed to create training session', error: error.message });
      return;
    }

    // Log the action
    logger.info(`Admin ${req.user?.userId} created training session: ${title}`);

    res.status(201).json({
      success: true,
      message: 'Training session created and broadcasted to all teachers',
      data: session
    });
  } catch (error: any) {
    console.error('Error in createTrainingSession:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all training sessions (Admin only, includes inactive/drafts)
 * GET /api/admin/training
 */
export const getAdminTrainingSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: sessions, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error getting admin sessions:', error);
      res.status(500).json({ success: false, message: 'Failed to get training sessions', error: error.message });
      return;
    }

    // Get registration counts for sessions
    const { data: regCounts } = await supabase
      .from('session_registrations')
      .select('session_id');

    const countMap: Record<string, number> = {};
    if (regCounts) {
      regCounts.forEach((r) => {
        countMap[r.session_id] = (countMap[r.session_id] || 0) + 1;
      });
    }

    const sessionsWithCounts = (sessions || []).map((session) => ({
      ...session,
      current_participants: countMap[session.id] || 0,
    }));

    res.status(200).json({
      success: true,
      data: sessionsWithCounts,
    });
  } catch (error: any) {
    console.error('Error in getAdminTrainingSessions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update an existing training session (Admin only)
 * PUT /api/admin/training/:id
 */
export const updateTrainingSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, instructor, startTime, endTime, type, meetingLink, recordingUrl, maxParticipants, tags, xpReward, isActive, status } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (instructor !== undefined) updateData.instructor = instructor;
    if (startTime !== undefined) updateData.start_time = startTime;
    if (endTime !== undefined) updateData.end_time = endTime;
    if (type !== undefined) updateData.type = type;
    if (meetingLink !== undefined) updateData.meeting_link = meetingLink;
    if (recordingUrl !== undefined) updateData.recording_url = recordingUrl;
    if (maxParticipants !== undefined) updateData.max_participants = maxParticipants;
    if (tags !== undefined) updateData.tags = tags;
    if (xpReward !== undefined) updateData.xp_reward = xpReward;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (status !== undefined) updateData.status = status;

    const { data: session, error } = await supabase
      .from('training_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating training session:', error);
      res.status(500).json({ success: false, message: 'Failed to update training session', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Training session updated successfully',
      data: session
    });
  } catch (error: any) {
    console.error('Error in updateTrainingSession:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Delete a training session (Admin only)
 * DELETE /api/admin/training/:id
 */
export const deleteTrainingSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('training_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting training session:', error);
      res.status(500).json({ success: false, message: 'Failed to delete training session', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Training session deleted'
    });
  } catch (error: any) {
    console.error('Error in deleteTrainingSession:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
