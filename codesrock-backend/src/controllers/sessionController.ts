import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Get all training sessions
 * GET /api/sessions
 */
export const getAllSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, upcoming } = req.query;

    let query = supabase.from('training_sessions').select('*').eq('is_active', true);

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    // Filter for upcoming sessions
    if (upcoming === 'true') {
      query = query.gte('start_time', new Date().toISOString()).in('status', ['scheduled', 'live']);
    }

    const { data: sessions, error } = await query.order('start_time');

    if (error) {
      console.error('Error getting sessions:', error);
      res.status(500).json({ success: false, message: 'Failed to get sessions', error: error.message });
      return;
    }

    // Add isLive status based on current time
    const now = new Date();
    const updatedSessions = (sessions || []).map((session) => {
      const startTime = new Date(session.start_time);
      const endTime = new Date(session.end_time);
      return {
        ...session,
        isLive: now >= startTime && now <= endTime,
      };
    });

    res.status(200).json({
      success: true,
      count: updatedSessions.length,
      data: updatedSessions,
    });
  } catch (error: any) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get session by ID
 * GET /api/sessions/:sessionId
 */
export const getSessionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    const { data: session, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // Check if user is registered
    let userRegistration = null;
    if (userId) {
      const { data: registration } = await supabase
        .from('session_registrations')
        .select('*')
        .eq('user_id', userId as string)
        .eq('session_id', sessionId)
        .single();

      if (registration) {
        userRegistration = {
          registered: true,
          attended: registration.attended,
          rating: registration.rating,
        };
      }
    }

    // Check if session is live
    const now = new Date();
    const startTime = new Date(session.start_time);
    const endTime = new Date(session.end_time);
    const isLive = now >= startTime && now <= endTime;

    // Check if can join
    const canJoin =
      session.is_active &&
      session.status !== 'cancelled' &&
      session.current_participants < session.max_participants;

    res.status(200).json({
      success: true,
      data: {
        session,
        isLive,
        canJoin,
        userRegistration,
      },
    });
  } catch (error: any) {
    console.error('Error getting session:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Register for session (RSVP)
 * POST /api/sessions/register
 */
export const registerForSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId } = req.body;

    if (!userId || !sessionId) {
      res.status(400).json({
        success: false,
        message: 'User ID and Session ID are required',
      });
      return;
    }

    // Find session
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // Check if session can be joined
    if (!session.is_active || session.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'Session is not available',
      });
      return;
    }

    if (session.current_participants >= session.max_participants) {
      res.status(400).json({
        success: false,
        message: 'Session is full',
      });
      return;
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('session_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single();

    if (existing) {
      res.status(400).json({
        success: false,
        message: 'Already registered for this session',
      });
      return;
    }

    // Create registration
    const { data: registration, error: regError } = await supabase
      .from('session_registrations')
      .insert({
        user_id: userId,
        session_id: sessionId,
        registered_at: new Date().toISOString(),
        attended: false,
        xp_awarded: false,
      })
      .select()
      .single();

    if (regError) {
      console.error('Error creating registration:', regError);
      res.status(500).json({ success: false, message: 'Failed to register for session' });
      return;
    }

    // Increment participant count
    await supabase
      .from('training_sessions')
      .update({ current_participants: session.current_participants + 1 })
      .eq('id', sessionId);

    // Create activity
    await supabase.from('activities').insert({
      user_id: userId,
      type: 'session_registered',
      description: `Registered for session: ${session.title}`,
      xp_earned: 0,
      metadata: { sessionId, sessionTitle: session.title, action: 'registered' },
    });

    res.status(201).json({
      success: true,
      message: 'Successfully registered for session',
      data: registration,
    });
  } catch (error: any) {
    console.error('Error registering for session:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Mark attendance
 * POST /api/sessions/attend
 */
export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId, duration } = req.body;

    if (!userId || !sessionId) {
      res.status(400).json({
        success: false,
        message: 'User ID and Session ID are required',
      });
      return;
    }

    // Find registration
    const { data: registration, error: regError } = await supabase
      .from('session_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single();

    if (regError || !registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found. Please register first.',
      });
      return;
    }

    // Find session
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      res.status(404).json({ success: false, message: 'Session not found' });
      return;
    }

    // Mark as attended
    if (!registration.attended) {
      const { error: updateError } = await supabase
        .from('session_registrations')
        .update({
          attended: true,
          attended_duration: duration || 0,
        })
        .eq('user_id', userId)
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error marking attendance:', updateError);
        res.status(500).json({ success: false, message: 'Failed to mark attendance' });
        return;
      }

      // Award XP if not already awarded
      if (!registration.xp_awarded) {
        await supabase.rpc('award_xp', {
          p_user_id: userId,
          p_xp_amount: session.xp_reward,
          p_activity_type: 'session_attended',
          p_description: `Attended session: ${session.title}`,
          p_metadata: { sessionId, sessionTitle: session.title, duration },
        });

        await supabase
          .from('session_registrations')
          .update({ xp_awarded: true })
          .eq('user_id', userId)
          .eq('session_id', sessionId);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully',
      data: {
        attended: true,
        xpAwarded: !registration.xp_awarded ? session.xp_reward : 0,
      },
    });
  } catch (error: any) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Submit session feedback
 * POST /api/sessions/feedback
 */
export const submitFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, sessionId, rating, feedback } = req.body;

    if (!userId || !sessionId || !rating) {
      res.status(400).json({
        success: false,
        message: 'User ID, Session ID, and rating are required',
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      return;
    }

    // Find registration
    const { data: registration, error: regError } = await supabase
      .from('session_registrations')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .single();

    if (regError || !registration) {
      res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
      return;
    }

    // Update feedback
    const { error: updateError } = await supabase
      .from('session_registrations')
      .update({
        rating,
        feedback: feedback || '',
      })
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (updateError) {
      console.error('Error submitting feedback:', updateError);
      res.status(500).json({ success: false, message: 'Failed to submit feedback' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        rating,
        feedback: feedback || '',
      },
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get user sessions (registered, attended, upcoming)
 * GET /api/sessions/user/:userId
 */
export const getUserSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const { data: registrations, error } = await supabase
      .from('session_registrations')
      .select('*, training_sessions(*)')
      .eq('user_id', userId)
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('Error getting user sessions:', error);
      res.status(500).json({ success: false, message: 'Failed to get user sessions' });
      return;
    }

    // Separate into categories
    const now = new Date();
    const upcoming: any[] = [];
    const attended: any[] = [];
    const missed: any[] = [];

    (registrations || []).forEach((reg: any) => {
      const session = reg.training_sessions;
      if (!session) return;

      const sessionData = {
        ...reg,
        session,
      };

      if (reg.attended) {
        attended.push(sessionData);
      } else if (new Date(session.start_time) > now) {
        upcoming.push(sessionData);
      } else {
        missed.push(sessionData);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        upcoming,
        attended,
        missed,
        summary: {
          totalRegistrations: registrations?.length || 0,
          totalAttended: attended.length,
          totalUpcoming: upcoming.length,
          totalMissed: missed.length,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get calendar view (upcoming sessions)
 * GET /api/sessions/calendar
 */
export const getCalendarView = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('training_sessions')
      .select('*')
      .eq('is_active', true)
      .in('status', ['scheduled', 'live']);

    if (startDate && endDate) {
      query = query.gte('start_time', startDate as string).lte('start_time', endDate as string);
    } else {
      // Default to next 30 days
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + 30);
      query = query.gte('start_time', now.toISOString()).lte('start_time', future.toISOString());
    }

    const { data: sessions, error } = await query.order('start_time');

    if (error) {
      console.error('Error getting calendar view:', error);
      res.status(500).json({ success: false, message: 'Failed to get calendar view' });
      return;
    }

    res.status(200).json({
      success: true,
      count: sessions?.length || 0,
      data: sessions || [],
    });
  } catch (error: any) {
    console.error('Error getting calendar view:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
