import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import crypto from 'crypto';

/**
 * Get all evaluations
 * GET /api/evaluations
 */
export const getAllEvaluations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;

    let query = supabase.from('evaluations').select('*').eq('is_active', true);

    if (type) query = query.eq('type', type);

    const { data: evaluations, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting evaluations:', error);
      res.status(500).json({ success: false, message: 'Failed to get evaluations' });
      return;
    }

    res.status(200).json({
      success: true,
      count: evaluations?.length || 0,
      data: evaluations || [],
    });
  } catch (error: any) {
    console.error('Error getting evaluations:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get evaluation by ID
 * GET /api/evaluations/:evaluationId
 */
export const getEvaluationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { evaluationId } = req.params;

    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .single();

    if (error || !evaluation) {
      res.status(404).json({ success: false, message: 'Evaluation not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: evaluation,
    });
  } catch (error: any) {
    console.error('Error getting evaluation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Start evaluation for user
 * POST /api/evaluations/start
 */
export const startEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, evaluationId } = req.body;

    if (!userId || !evaluationId) {
      res.status(400).json({
        success: false,
        message: 'User ID and Evaluation ID are required',
      });
      return;
    }

    // Check if evaluation exists
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .single();

    if (evalError || !evaluation) {
      res.status(404).json({ success: false, message: 'Evaluation not found' });
      return;
    }

    // Check if user already has an evaluation in progress
    const { data: existing } = await supabase
      .from('user_evaluations')
      .select('*')
      .eq('user_id', userId)
      .eq('evaluation_id', evaluationId)
      .single();

    if (existing) {
      res.status(200).json({
        success: true,
        message: 'Evaluation already started',
        data: existing,
      });
      return;
    }

    // Create new user evaluation
    const { data: userEvaluation, error: createError } = await supabase
      .from('user_evaluations')
      .insert({
        user_id: userId,
        evaluation_id: evaluationId,
        completed_items: [],
        score: 0,
        percentage: 0,
        status: 'in-progress',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error starting evaluation:', createError);
      res.status(500).json({ success: false, message: 'Failed to start evaluation' });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Evaluation started successfully',
      data: userEvaluation,
    });
  } catch (error: any) {
    console.error('Error starting evaluation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update evaluation progress
 * PUT /api/evaluations/progress
 */
export const updateEvaluationProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, evaluationId, completedItems } = req.body;

    if (!userId || !evaluationId || !completedItems) {
      res.status(400).json({
        success: false,
        message: 'User ID, Evaluation ID, and completed items are required',
      });
      return;
    }

    // Find user evaluation
    const { data: userEvaluation, error: userError } = await supabase
      .from('user_evaluations')
      .select('*')
      .eq('user_id', userId)
      .eq('evaluation_id', evaluationId)
      .single();

    if (userError || !userEvaluation) {
      res.status(404).json({ success: false, message: 'User evaluation not found' });
      return;
    }

    // Get evaluation details
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', evaluationId)
      .single();

    if (evalError || !evaluation) {
      res.status(404).json({ success: false, message: 'Evaluation not found' });
      return;
    }

    // Calculate score
    let earnedPoints = 0;
    completedItems.forEach((itemId: string) => {
      const item = evaluation.checklist_items.find((i: any) => i.id === itemId);
      if (item) {
        earnedPoints += item.points;
      }
    });

    const percentage = Math.round((earnedPoints / evaluation.total_points) * 100);

    // Update user evaluation
    const { data: updated, error: updateError } = await supabase
      .from('user_evaluations')
      .update({
        completed_items: completedItems,
        score: earnedPoints,
        percentage,
      })
      .eq('user_id', userId)
      .eq('evaluation_id', evaluationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating evaluation progress:', updateError);
      res.status(500).json({ success: false, message: 'Failed to update progress' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        completedItems: updated.completed_items,
        score: updated.score,
        percentage: updated.percentage,
      },
    });
  } catch (error: any) {
    console.error('Error updating evaluation progress:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Submit evaluation
 * POST /api/evaluations/submit
 */
export const submitEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, evaluationId } = req.body;

    if (!userId || !evaluationId) {
      res.status(400).json({
        success: false,
        message: 'User ID and Evaluation ID are required',
      });
      return;
    }

    // Find user evaluation
    const { data: userEvaluation, error: userError } = await supabase
      .from('user_evaluations')
      .select('*')
      .eq('user_id', userId)
      .eq('evaluation_id', evaluationId)
      .single();

    if (userError || !userEvaluation) {
      res.status(404).json({ success: false, message: 'User evaluation not found' });
      return;
    }

    if (userEvaluation.status !== 'in-progress') {
      res.status(400).json({
        success: false,
        message: 'Evaluation has already been submitted',
      });
      return;
    }

    // Mark as submitted
    const { error: updateError } = await supabase
      .from('user_evaluations')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('evaluation_id', evaluationId);

    if (updateError) {
      console.error('Error submitting evaluation:', updateError);
      res.status(500).json({ success: false, message: 'Failed to submit evaluation' });
      return;
    }

    // Create activity
    const { data: evaluation } = await supabase
      .from('evaluations')
      .select('title')
      .eq('id', evaluationId)
      .single();

    if (evaluation) {
      await supabase.from('activities').insert({
        user_id: userId,
        type: 'evaluation_submitted',
        description: `Submitted evaluation: ${evaluation.title}`,
        xp_earned: 0,
        metadata: {
          evaluationId,
          evaluationTitle: evaluation.title,
          score: userEvaluation.score,
          percentage: userEvaluation.percentage,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation submitted successfully',
      data: { ...userEvaluation, status: 'submitted', submitted_at: new Date().toISOString() },
    });
  } catch (error: any) {
    console.error('Error submitting evaluation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Review evaluation (approve/reject)
 * POST /api/evaluations/review
 */
export const reviewEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userEvaluationId, reviewerId, status, feedback } = req.body;

    if (!userEvaluationId || !reviewerId || !status) {
      res.status(400).json({
        success: false,
        message: 'User evaluation ID, reviewer ID, and status are required',
      });
      return;
    }

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status must be either "approved" or "rejected"',
      });
      return;
    }

    // Find user evaluation
    const { data: userEvaluation, error: userError } = await supabase
      .from('user_evaluations')
      .select('*')
      .eq('id', userEvaluationId)
      .single();

    if (userError || !userEvaluation) {
      res.status(404).json({ success: false, message: 'User evaluation not found' });
      return;
    }

    if (userEvaluation.status !== 'submitted') {
      res.status(400).json({
        success: false,
        message: 'Evaluation must be submitted before review',
      });
      return;
    }

    // Get evaluation details
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('*')
      .eq('id', userEvaluation.evaluation_id)
      .single();

    if (evalError || !evaluation) {
      res.status(404).json({ success: false, message: 'Evaluation not found' });
      return;
    }

    let certificateId = null;

    // If approved and passed, generate certificate
    if (status === 'approved' && userEvaluation.percentage >= evaluation.passing_score) {
      const certificate = await generateCertificate(
        userEvaluation.user_id,
        userEvaluation.evaluation_id,
        evaluation.title
      );

      certificateId = certificate.id;

      // Award XP for passing evaluation
      const xpReward = 150; // Base XP for passing evaluation
      await supabase.rpc('award_xp', {
        p_user_id: userEvaluation.user_id,
        p_xp_amount: xpReward,
        p_activity_type: 'evaluation_passed',
        p_description: `Passed evaluation: ${evaluation.title}`,
        p_metadata: {
          evaluationId: evaluation.id,
          evaluationTitle: evaluation.title,
          certificateId: certificate.id,
        },
      });
    }

    // Update review
    const { data: updated, error: updateError } = await supabase
      .from('user_evaluations')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewerId,
        feedback: feedback || '',
        certificate_id: certificateId,
      })
      .eq('id', userEvaluationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error reviewing evaluation:', updateError);
      res.status(500).json({ success: false, message: 'Failed to review evaluation' });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Evaluation ${status} successfully`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error reviewing evaluation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get user evaluations
 * GET /api/evaluations/user/:userId
 */
export const getUserEvaluations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const { data: userEvaluations, error } = await supabase
      .from('user_evaluations')
      .select('*, evaluations(title, description), certificates(certificate_number, issued_date)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user evaluations:', error);
      res.status(500).json({ success: false, message: 'Failed to get user evaluations' });
      return;
    }

    res.status(200).json({
      success: true,
      count: userEvaluations?.length || 0,
      data: userEvaluations || [],
    });
  } catch (error: any) {
    console.error('Error getting user evaluations:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get certificate by number
 * GET /api/certificates/verify/:certificateNumber
 */
export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { certificateNumber } = req.params;

    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*, profiles(first_name, last_name, email), evaluations(title, description)')
      .eq('certificate_number', certificateNumber)
      .single();

    if (error || !certificate) {
      res.status(404).json({ success: false, message: 'Certificate not found' });
      return;
    }

    const isValid =
      certificate.is_valid &&
      (!certificate.expiry_date || new Date(certificate.expiry_date) > new Date());

    res.status(200).json({
      success: true,
      data: {
        certificate,
        isValid,
      },
    });
  } catch (error: any) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get user certificates
 * GET /api/certificates/user/:userId
 */
export const getUserCertificates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const { data: certificates, error } = await supabase
      .from('certificates')
      .select('*, evaluations(title, description)')
      .eq('user_id', userId)
      .eq('is_valid', true)
      .order('issued_date', { ascending: false });

    if (error) {
      console.error('Error getting user certificates:', error);
      res.status(500).json({ success: false, message: 'Failed to get user certificates' });
      return;
    }

    res.status(200).json({
      success: true,
      count: certificates?.length || 0,
      data: certificates || [],
    });
  } catch (error: any) {
    console.error('Error getting user certificates:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Helper function to generate certificate
 */
async function generateCertificate(
  userId: string,
  evaluationId: string,
  evaluationTitle: string
): Promise<any> {
  // Get user details
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  // Generate unique certificate number
  const certificateNumber = `CR-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  // Create certificate
  const { data: certificate, error: certError } = await supabase
    .from('certificates')
    .insert({
      user_id: userId,
      evaluation_id: evaluationId,
      certificate_number: certificateNumber,
      issued_date: new Date().toISOString(),
      title: evaluationTitle,
      recipient_name: `${user.first_name} ${user.last_name}`,
      issuer_name: 'CodesRock Education',
      verification_url: `https://codesrock.org/verify/${certificateNumber}`,
      template_type: 'Standard',
      is_valid: true,
    })
    .select()
    .single();

  if (certError) {
    throw new Error('Failed to create certificate');
  }

  return certificate;
}
