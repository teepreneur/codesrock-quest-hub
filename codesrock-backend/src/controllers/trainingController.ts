import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import logger from '../utils/logger';

/**
 * Get upcoming training sessions
 * GET /api/training/upcoming
 */
export const getUpcomingSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: sessions, error } = await supabase
      .from('training_sessions')
      .select('*')
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error getting upcoming sessions:', error);
      res.status(500).json({ success: false, message: 'Failed to get sessions', error: error.message });
      return;
    }

    // Check RSVPs for the current user
    const { data: rsvps } = await supabase
      .from('session_registrations')
      .select('session_id')
      .eq('user_id', req.user?.userId);

    const rsvpSet = new Set(rsvps?.map(r => r.session_id) || []);

    const enrichedSessions = sessions?.map(session => ({
      ...session,
      isRSVPed: rsvpSet.has(session.id),
      isLive: new Date(session.start_time) <= new Date() && new Date(session.end_time) >= new Date()
    }));

    res.status(200).json({
      success: true,
      data: enrichedSessions || [],
    });
  } catch (error: any) {
    console.error('Error in getUpcomingSessions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get past training sessions / recordings
 * GET /api/training/past
 */
export const getPastSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: sessions, error } = await supabase
      .from('training_sessions')
      .select('*')
      .lt('end_time', new Date().toISOString())
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error getting past sessions:', error);
      res.status(500).json({ success: false, message: 'Failed to get past sessions', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      data: sessions || [],
    });
  } catch (error: any) {
    console.error('Error in getPastSessions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * RSVP to a training session
 * POST /api/training/rsvp
 */
export const rsvpToSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body;
    const userId = req.user?.userId;

    if (!sessionId) {
      res.status(400).json({ success: false, message: 'Session ID is required' });
      return;
    }

    const { error } = await supabase
      .from('session_registrations')
      .upsert({
        user_id: userId,
        session_id: sessionId,
        registered_at: new Date().toISOString()
      }, { onConflict: 'user_id,session_id' });

    if (error) {
      console.error('Error RSVPing to session:', error);
      res.status(500).json({ success: false, message: 'Failed to RSVP', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Successfully registered for training session',
    });
  } catch (error: any) {
    console.error('Error in rsvpToSession:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
