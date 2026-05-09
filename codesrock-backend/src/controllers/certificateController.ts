import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import logger from '../utils/logger';

/**
 * Get all certificates for a user
 * GET /api/certificates/:userId
 */
export const getUserCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Security Check: IDOR Protection
    if (userId !== req.user?.userId && !['super_admin', 'school_admin', 'content_admin'].includes(req.user?.role || '')) {
      logger.warn(`IDOR attempt: User ${req.user?.userId} tried to access certificates of ${userId}`);
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    const { data: certificates, error } = await supabase
      .from('certificates')
      .select('*, courses(title, thumbnail, category)')
      .eq('user_id', userId)
      .order('date_earned', { ascending: false });

    if (error) {
      console.error('Error getting certificates:', error);
      res.status(500).json({ success: false, message: 'Failed to get certificates', error: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      count: certificates?.length || 0,
      data: certificates || [],
    });
  } catch (error: any) {
    console.error('Error in getUserCertificates:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get certificate by ID
 * GET /api/certificates/detail/:id
 */
export const getCertificateById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*, courses(*), profiles!inner(first_name, last_name)')
      .eq('id', id)
      .single();

    if (error || !certificate) {
      res.status(404).json({ success: false, message: 'Certificate not found' });
      return;
    }

    // Security Check
    if (certificate.user_id !== req.user?.userId && !['super_admin', 'content_admin'].includes(req.user?.role || '')) {
      res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error: any) {
    console.error('Error in getCertificateById:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
