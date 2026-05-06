import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

/**
 * @desc    Unified search across topics and resources
 * @route   GET /api/search
 * @access  Private
 */
export const searchUnified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ success: false, message: 'Search query is required' });
      return;
    }

    const searchTerm = `%${q}%`;

    // 1. Search Topics (including course info)
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*, courses(title, thumbnail, category)')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .eq('is_active', true)
      .limit(10);

    // 2. Search Resources
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .eq('is_active', true)
      .limit(10);

    if (topicsError) throw topicsError;
    if (resourcesError) throw resourcesError;

    res.status(200).json({
      success: true,
      data: {
        topics: topics || [],
        resources: resources || [],
        query: q
      }
    });
  } catch (error) {
    next(error);
  }
};
