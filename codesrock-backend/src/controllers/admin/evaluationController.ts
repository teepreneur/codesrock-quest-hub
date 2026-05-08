import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';

/**
 * Get evaluation for a topic
 */
export const getEvaluationByTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topicId } = req.params;

    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .select('*, evaluation_questions(*)')
      .eq('topic_id', topicId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.status(200).json({
      success: true,
      data: evaluation || null
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error });
  }
};

/**
 * Create or update evaluation
 */
export const saveEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { topicId, title, description, xpReward, questions } = req.body;

    // 1. Save Evaluation metadata
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .upsert({
        topic_id: topicId,
        title,
        description,
        xp_reward: xpReward || 500,
        updated_at: new Date().toISOString()
      }, { onConflict: 'topic_id' })
      .select()
      .single();

    if (evalError) throw evalError;

    // 2. Clear old questions and add new ones
    await supabase.from('evaluation_questions').delete().eq('evaluation_id', evaluation.id);

    if (questions && questions.length > 0) {
      const questionsWithId = questions.map((q: any, index: number) => ({
        evaluation_id: evaluation.id,
        question_text: q.questionText,
        question_type: q.questionType || 'multiple_choice',
        options: q.options,
        correct_answer: q.correctAnswer,
        order_index: index
      }));

      const { error: qError } = await supabase.from('evaluation_questions').insert(questionsWithId);
      if (qError) throw qError;
    }

    res.status(200).json({
      success: true,
      message: 'Evaluation saved successfully',
      data: evaluation
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error });
  }
};

/**
 * Submit evaluation attempt
 */
export const submitEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, evaluationId, score, passed } = req.body;

    const { data: existingProgress } = await supabase
      .from('evaluation_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('evaluation_id', evaluationId)
      .single();

    if (existingProgress?.passed) {
      res.status(200).json({ success: true, message: 'Evaluation already passed' });
      return;
    }

    const { data: progress, error: pError } = await supabase
      .from('evaluation_progress')
      .upsert({
        user_id: userId,
        evaluation_id: evaluationId,
        score,
        passed,
        completed_at: new Date().toISOString()
      }, { onConflict: 'user_id,evaluation_id' })
      .select()
      .single();

    if (pError) throw pError;

    // Award XP if passed
    if (passed) {
      const { data: evaluation } = await supabase
        .from('evaluations')
        .select('title, xp_reward')
        .eq('id', evaluationId)
        .single();

      if (evaluation) {
        await supabase.rpc('award_xp', {
          p_user_id: userId,
          p_xp_amount: evaluation.xp_reward,
          p_activity_type: 'evaluation_completed',
          p_description: `Passed evaluation: ${evaluation.title}`,
          p_metadata: { evaluationId, score }
        });

        await supabase
          .from('evaluation_progress')
          .update({ xp_awarded: true })
          .eq('id', progress.id);
      }
    }

    res.status(200).json({
      success: true,
      message: passed ? 'Congratulations! You passed the evaluation.' : 'Evaluation submitted.',
      data: { passed, score }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error });
  }
};

/**
 * Delete an evaluation
 */
export const deleteEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { evaluationId } = req.params;

    const { error } = await supabase
      .from('evaluations')
      .delete()
      .eq('id', evaluationId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Evaluation deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error', error: error });
  }
};
