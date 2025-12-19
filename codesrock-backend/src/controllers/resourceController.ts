import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Get resources with filters
 * GET /api/resources
 */
export const getResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, gradeLevel, fileType, subject, userId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build query
    let query = supabase.from('resources').select('*', { count: 'exact' }).eq('is_active', true);

    if (category) query = query.eq('category', category);
    if (gradeLevel) query = query.eq('grade_level', gradeLevel);
    if (fileType) query = query.eq('file_type', fileType);
    if (subject) query = query.eq('subject', subject);

    // Get resources
    const { data: resources, error, count } = await query
      .order('download_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Error getting resources:', error);
      res.status(500).json({ success: false, message: 'Failed to get resources', error: error.message });
      return;
    }

    // If userId provided, get user's downloads
    let resourcesWithInteraction: any = resources;
    if (userId && resources) {
      const resourceIds = resources.map((r) => r.id);
      const { data: downloads } = await supabase
        .from('resource_downloads')
        .select('*')
        .eq('user_id', userId as string)
        .in('resource_id', resourceIds);

      const downloadMap = new Map(downloads?.map((d) => [d.resource_id, d]) || []);

      resourcesWithInteraction = resources.map((resource) => {
        const download = downloadMap.get(resource.id);
        return {
          ...resource,
          userInteraction: download
            ? {
                downloaded: download.downloaded,
                downloadedAt: download.downloaded_at,
                rating: download.rating,
                review: download.review,
              }
            : null,
        };
      });
    }

    res.status(200).json({
      success: true,
      data: {
        resources: resourcesWithInteraction || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting resources:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Download resource (tracks and awards XP once)
 * POST /api/resources/download
 */
export const downloadResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, resourceId } = req.body;

    // Validation
    if (!userId || !resourceId) {
      res.status(400).json({
        success: false,
        message: 'User ID and Resource ID are required',
      });
      return;
    }

    // Find resource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    // Find existing download
    const { data: existingDownload } = await supabase
      .from('resource_downloads')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .single();

    if (!existingDownload) {
      // First download - use download_resource function
      const { error: downloadError } = await supabase.rpc('download_resource', {
        p_user_id: userId,
        p_resource_id: resourceId,
      });

      if (downloadError) {
        console.error('Error downloading resource:', downloadError);
        res.status(500).json({ success: false, message: 'Failed to download resource' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Resource downloaded successfully! XP awarded.',
        data: {
          resource,
          xpAwarded: resource.xp_reward,
        },
      });
    } else {
      // Already downloaded - just update timestamp
      await supabase
        .from('resource_downloads')
        .update({
          downloaded: true,
          downloaded_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('resource_id', resourceId);

      res.status(200).json({
        success: true,
        message: 'Resource downloaded successfully!',
        data: {
          resource,
          xpAwarded: 0,
        },
      });
    }
  } catch (error: any) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Rate resource
 * POST /api/resources/rate
 */
export const rateResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, resourceId, rating, review } = req.body;

    // Validation
    if (!userId || !resourceId || !rating) {
      res.status(400).json({
        success: false,
        message: 'User ID, Resource ID, and rating are required',
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
      return;
    }

    // Find or create download record
    const { data: existingDownload } = await supabase
      .from('resource_downloads')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_id', resourceId)
      .single();

    if (!existingDownload) {
      // Create new download record with rating
      const { error: insertError } = await supabase.from('resource_downloads').insert({
        user_id: userId,
        resource_id: resourceId,
        downloaded: false,
        rating,
        review: review || '',
        xp_awarded: false,
      });

      if (insertError) {
        console.error('Error creating rating:', insertError);
        res.status(500).json({ success: false, message: 'Failed to submit rating' });
        return;
      }
    } else {
      // Update existing record
      const { error: updateError } = await supabase
        .from('resource_downloads')
        .update({
          rating,
          review: review || existingDownload.review,
        })
        .eq('user_id', userId)
        .eq('resource_id', resourceId);

      if (updateError) {
        console.error('Error updating rating:', updateError);
        res.status(500).json({ success: false, message: 'Failed to update rating' });
        return;
      }
    }

    // Recalculate average rating
    const { data: allRatings } = await supabase
      .from('resource_downloads')
      .select('rating')
      .eq('resource_id', resourceId)
      .not('rating', 'is', null);

    if (allRatings && allRatings.length > 0) {
      const totalRating = allRatings.reduce((sum, r) => sum + (r.rating || 0), 0);
      const avgRating = Math.round((totalRating / allRatings.length) * 10) / 10;

      await supabase
        .from('resources')
        .update({
          average_rating: avgRating,
          rating_count: allRatings.length,
        })
        .eq('id', resourceId);
    }

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: {
        rating,
        review: review || '',
      },
    });
  } catch (error: any) {
    console.error('Error rating resource:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get popular resources
 * GET /api/resources/popular
 */
export const getPopularResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const { data: popularResources, error } = await supabase
      .from('resources')
      .select('*')
      .eq('is_active', true)
      .order('download_count', { ascending: false })
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting popular resources:', error);
      res.status(500).json({ success: false, message: 'Failed to get popular resources' });
      return;
    }

    res.status(200).json({
      success: true,
      count: popularResources?.length || 0,
      data: popularResources || [],
    });
  } catch (error: any) {
    console.error('Error getting popular resources:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get user downloads
 * GET /api/resources/downloads/:userId
 */
export const getUserDownloads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const { data: downloads, error, count } = await supabase
      .from('resource_downloads')
      .select('*, resources(*)', { count: 'exact' })
      .eq('user_id', userId)
      .eq('downloaded', true)
      .order('downloaded_at', { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) {
      console.error('Error getting user downloads:', error);
      res.status(500).json({ success: false, message: 'Failed to get user downloads' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        downloads: downloads || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          pages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Error getting user downloads:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get resource by ID
 * GET /api/resources/:resourceId
 */
export const getResourceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { resourceId } = req.params;
    const { userId } = req.query;

    const { data: resource, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single();

    if (error || !resource) {
      res.status(404).json({ success: false, message: 'Resource not found' });
      return;
    }

    // Get user interaction if userId provided
    let userInteraction = null;
    if (userId) {
      const { data: download } = await supabase
        .from('resource_downloads')
        .select('*')
        .eq('user_id', userId as string)
        .eq('resource_id', resourceId)
        .single();

      if (download) {
        userInteraction = {
          downloaded: download.downloaded,
          downloadedAt: download.downloaded_at,
          rating: download.rating,
          review: download.review,
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        resource,
        userInteraction,
      },
    });
  } catch (error: any) {
    console.error('Error getting resource:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
