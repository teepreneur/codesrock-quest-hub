import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Level definitions (from Level model)
export const LEVELS = [
  { level: 1, name: 'Code Cadet', minXP: 0, icon: '🎯' },
  { level: 2, name: 'Bug Hunter', minXP: 100, icon: '🔍' },
  { level: 3, name: 'Digital Creator', minXP: 225, icon: '🎨' },
  { level: 4, name: 'Code Wizard', minXP: 400, icon: '🧙' },
  { level: 5, name: 'Tech Mentor', minXP: 650, icon: '👨‍🏫' },
  { level: 6, name: 'Innovation Leader', minXP: 1000, icon: '💡' },
  { level: 7, name: 'Tech Architect', minXP: 1500, icon: '🏗️' },
  { level: 8, name: 'CodesRock Champion', minXP: 2250, icon: '🏆' },
];

function getLevelByXP(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

/**
 * Get user progress by user ID
 * GET /api/progress/:userId
 */
export const getUserProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Find user progress
    let { data: progress, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If progress doesn't exist, create it
    if (error || !progress) {
      // First, insert the new progress record
      const { error: createError } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          current_xp: 0,
          total_xp: 0,
          current_level: 1,
          level_name: 'Code Cadet',
          streak: 0,
        });

      if (createError) {
        console.error('Error creating user progress:', createError);
        res.status(500).json({ success: false, message: 'Failed to create user progress' });
        return;
      }

      // Then fetch the newly created record
      const { data: newProgress, error: fetchError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError || !newProgress) {
        console.error('Error fetching new user progress:', fetchError);
        res.status(500).json({ success: false, message: 'Failed to fetch user progress' });
        return;
      }

      progress = newProgress;
    }

    // Get user badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('*, badges(name, description, icon, category, rarity)')
      .eq('user_id', userId);

    // Get current level details
    const currentLevelData = getLevelByXP(progress.current_xp);
    const nextLevel = LEVELS.find((l) => l.level === progress.current_level + 1);

    // Calculate progress to next level
    let progressToNextLevel = 0;
    if (nextLevel) {
      const xpInCurrentLevel = progress.current_xp - currentLevelData.minXP;
      const xpNeededForNextLevel = nextLevel.minXP - currentLevelData.minXP;
      progressToNextLevel = Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100);
    }

    res.status(200).json({
      success: true,
      data: {
        progress: {
          ...progress,
          badges: userBadges || [],
        },
        levelDetails: {
          current: currentLevelData,
          next: nextLevel || null,
          progressToNextLevel,
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting user progress:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add XP to user
 * POST /api/progress/xp
 */
export const addXP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, amount, description, metadata } = req.body;

    // Validation
    if (!userId || !amount || !description) {
      res.status(400).json({
        success: false,
        message: 'User ID, amount, and description are required',
      });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ success: false, message: 'XP amount must be positive' });
      return;
    }

    // Use the award_xp function
    const { data: result, error } = await supabase.rpc('award_xp', {
      p_user_id: userId,
      p_xp_amount: amount,
      p_activity_type: 'xp_awarded',
      p_description: description,
      p_metadata: metadata || {},
    });

    if (error) {
      console.error('Error awarding XP:', error);
      res.status(500).json({ success: false, message: 'Failed to award XP', error: error.message });
      return;
    }

    // Get updated progress
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Check for badge eligibility
    await checkBadgeEligibility(userId);

    res.status(200).json({
      success: true,
      message: result?.leveled_up
        ? `Added ${amount} XP and leveled up to level ${result.new_level}!`
        : `Added ${amount} XP successfully`,
      data: {
        xpAdded: amount,
        currentXP: progress?.current_xp || 0,
        totalXP: progress?.total_xp || 0,
        currentLevel: progress?.current_level || 1,
        levelName: progress?.level_name || 'Code Cadet',
        leveledUp: result?.leveled_up || false,
        newLevel: result?.new_level || null,
      },
    });
  } catch (error: any) {
    console.error('Error adding XP:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get leaderboard (top users by total XP)
 * GET /api/leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Use the get_leaderboard function
    const { data: leaderboard, error } = await supabase.rpc('get_leaderboard', {
      p_limit: limit,
    });

    if (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({ success: false, message: 'Failed to get leaderboard', error: error.message });
      return;
    }

    const formattedLeaderboard = (leaderboard || []).map((entry: any, index: number) => ({
      rank: index + 1,
      user: {
        id: entry.user_id,
        firstName: entry.first_name,
        lastName: entry.last_name,
        email: entry.email,
        role: entry.role,
      },
      totalXP: entry.total_xp,
      currentLevel: entry.current_level,
      levelName: entry.level_name,
      badgeCount: entry.badge_count || 0,
      streak: entry.streak || 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedLeaderboard,
    });
  } catch (error: any) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update user streak
 * POST /api/progress/streak
 */
export const updateStreak = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ success: false, message: 'User ID is required' });
      return;
    }

    // Use the update_streak function
    const { data: result, error } = await supabase.rpc('update_streak', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error updating streak:', error);
      res.status(500).json({ success: false, message: 'Failed to update streak', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: result?.streak_broken
        ? 'Streak was broken and reset to 1'
        : result?.streak_updated
        ? 'Streak updated successfully'
        : 'Streak maintained',
      data: {
        currentStreak: result?.current_streak || 0,
        streakUpdated: result?.streak_updated || false,
        streakBroken: result?.streak_broken || false,
      },
    });
  } catch (error: any) {
    console.error('Error updating streak:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all badges
 * GET /api/badges
 */
export const getAllBadges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, isActive } = req.query;

    let query = supabase.from('badges').select('*');

    if (category) query = query.eq('category', category);
    if (isActive !== undefined) query = query.eq('is_active', isActive === 'true');

    const { data: badges, error } = await query.order('category').order('xp_reward');

    if (error) {
      console.error('Error getting badges:', error);
      res.status(500).json({ success: false, message: 'Failed to get badges', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      count: badges?.length || 0,
      data: badges || [],
    });
  } catch (error: any) {
    console.error('Error getting badges:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get user badges
 * GET /api/badges/user/:userId
 */
export const getUserBadges = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const { data: userBadges, error} = await supabase
      .from('user_badges')
      .select('*, badges(name, description, icon, category, rarity, xp_reward)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user badges:', error);
      res.status(500).json({ success: false, message: 'Failed to get user badges', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      count: userBadges?.length || 0,
      data: userBadges || [],
    });
  } catch (error: any) {
    console.error('Error getting user badges:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Award badge to user
 * POST /api/badges/award
 */
export const awardBadge = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, badgeId } = req.body;

    if (!userId || !badgeId) {
      res.status(400).json({
        success: false,
        message: 'User ID and Badge ID are required',
      });
      return;
    }

    // Find badge
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('*')
      .eq('id', badgeId)
      .single();

    if (badgeError || !badge) {
      res.status(404).json({ success: false, message: 'Badge not found' });
      return;
    }

    // Check if user already has this badge
    const { data: existingBadge } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId)
      .eq('badge_id', badgeId)
      .single();

    if (existingBadge) {
      res.status(400).json({
        success: false,
        message: 'Badge already awarded to this user',
      });
      return;
    }

    // Award badge
    const { error: insertError } = await supabase.from('user_badges').insert({
      user_id: userId,
      badge_id: badgeId,
      earned_at: new Date().toISOString(),
      category: badge.category,
    });

    if (insertError) {
      console.error('Error awarding badge:', insertError);
      res.status(500).json({ success: false, message: 'Failed to award badge' });
      return;
    }

    // Award XP for earning the badge
    if (badge.xp_reward > 0) {
      await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_xp_amount: badge.xp_reward,
        p_activity_type: 'badge_earned',
        p_description: `Earned badge: ${badge.name}`,
        p_metadata: { badgeId: badge.id, badgeName: badge.name },
      });
    }

    res.status(200).json({
      success: true,
      message: `Badge "${badge.name}" awarded successfully`,
      data: {
        badge,
        xpAwarded: badge.xp_reward,
      },
    });
  } catch (error: any) {
    console.error('Error awarding badge:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get user activity feed
 * GET /api/activities/:userId
 */
export const getActivityFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const type = req.query.type as string;

    let query = supabase
      .from('activities')
      .select('type, description, xp_earned, metadata, timestamp', { count: 'exact' })
      .eq('user_id', userId);

    if (type) query = query.eq('type', type);

    const skip = (page - 1) * limit;

    const { data: activities, error, count } = await query
      .order('timestamp', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Error getting activity feed:', error);
      res.status(500).json({ success: false, message: 'Failed to get activities', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        activities: activities || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting activity feed:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Helper function to check badge eligibility after XP changes
 */
const checkBadgeEligibility = async (userId: string): Promise<void> => {
  try {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!progress) return;

    // Get all active badges
    const { data: badges } = await supabase
      .from('badges')
      .select('*')
      .eq('is_active', true);

    if (!badges) return;

    // Get user's current badges
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const hasBadgeIds = new Set((userBadges || []).map((ub) => ub.badge_id));

    for (const badge of badges) {
      // Skip if user already has this badge
      if (hasBadgeIds.has(badge.id)) continue;

      let eligible = false;

      // Check requirements
      if (badge.requirement && typeof badge.requirement === 'object') {
        const req = badge.requirement as any;
        switch (req.type) {
          case 'xp':
            eligible = progress.total_xp >= req.value;
            break;
          case 'level':
            eligible = progress.current_level >= req.value;
            break;
          case 'streak':
            eligible = progress.streak >= req.value;
            break;
          case 'action':
            // Action-based badges are handled elsewhere
            break;
        }
      }

      if (eligible) {
        // Award badge
        await supabase.from('user_badges').insert({
          user_id: userId,
          badge_id: badge.id,
          earned_at: new Date().toISOString(),
          category: badge.category,
        });

        // Award XP
        if (badge.xp_reward > 0) {
          await supabase.rpc('award_xp', {
            p_user_id: userId,
            p_xp_amount: badge.xp_reward,
            p_activity_type: 'badge_earned',
            p_description: `Earned badge: ${badge.name}`,
            p_metadata: { badgeId: badge.id, badgeName: badge.name },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking badge eligibility:', error);
  }
};

/**
 * Get all levels information
 * GET /api/levels
 */
export const getAllLevels = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: LEVELS,
    });
  } catch (error: any) {
    console.error('Error getting levels:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
