import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import logger from '../utils/logger';

/**
 * Update teacher onboarding status
 * POST /api/onboarding/status
 */
export const updateOnboardingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { status } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { error } = await supabase
      .from('user_progress')
      .update({ onboarding_status: status })
      .eq('user_id', userId);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Onboarding status updated' });
  } catch (error: any) {
    logger.error('Error updating onboarding status:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Activate teacher and award Pioneer badge
 * POST /api/onboarding/activate
 */
export const activateTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // 1. Check if already activated to prevent double reward
    const { data: progress } = await supabase
      .from('user_progress')
      .select('is_activated')
      .eq('user_id', userId)
      .single();

    if (progress?.is_activated) {
      res.status(200).json({ success: true, message: 'Teacher already activated' });
      return;
    }

    // 2. Perform activation update
    const { error: updateError } = await supabase
      .from('user_progress')
      .update({ 
        is_activated: true,
        onboarding_status: { phase: 2, step: 0, completed: false }
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // 3. Award the "Pioneer Teacher" badge
    const { data: badge } = await supabase
      .from('badges')
      .select('id')
      .eq('name', 'Pioneer Teacher')
      .single();

    if (badge) {
      await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badge.id,
        earned_at: new Date().toISOString()
      });
      
      // Award XP using the standard project RPC
      await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_xp_amount: 100,
        p_activity_type: 'achievement',
        p_description: 'Earned the Pioneer Teacher badge for completing initial training!',
        p_metadata: { badge_id: badge.id }
      });
    }

    res.status(200).json({ success: true, message: 'Teacher activated successfully' });
  } catch (error: any) {
    logger.error('Error activating teacher:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
