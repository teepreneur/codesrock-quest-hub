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
    console.log(`[Search] Querying for: ${q} (Search term: ${searchTerm})`);

    // 1. Search Topics (including course info)
    console.log(`[Search] Querying topics...`);
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('*, courses:course_id(title, thumbnail, category)')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .eq('is_active', true)
      .limit(10);

    if (topicsError) {
      console.error('[Search] Topics error:', topicsError);
    }

    // 2. Search Resources
    console.log(`[Search] Querying resources...`);
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('*')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`)
      .eq('is_active', true)
      .limit(10);

    if (resourcesError) {
      console.error('[Search] Resources error:', resourcesError);
    }

    console.log(`[Search] Results found - Topics: ${topics?.length || 0}, Resources: ${resources?.length || 0}`);

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
