import { Request, Response } from 'express';
import { supabase } from '../../config/supabase';

const PASS_THRESHOLD = 80;
const CONTENT_ADMIN_ROLES = ['content_admin', 'super_admin'];

/**
 * Get evaluation for a topic
 * Correct answers are only included for content admins; everyone else gets
 * the questions without answers and is graded server-side on submit.
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

    if (evaluation && !CONTENT_ADMIN_ROLES.includes(req.user?.role || '')) {
      evaluation.evaluation_questions = (evaluation.evaluation_questions || []).map(
        ({ correct_answer: _omit, ...question }: any) => question
      );
    }

    res.status(200).json({
      success: true,
      data: evaluation || null
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
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
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

/**
 * Submit evaluation attempt
 * Body: { evaluationId, answers: { [questionId]: selectedOption } }
 * The score is calculated here from the stored correct answers, and the
 * attempt is always recorded for the authenticated user.
 */
export const submitEvaluation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { evaluationId, answers } = req.body as {
      evaluationId: string;
      answers: Record<string, string>;
    };

    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .select('id, title, xp_reward, evaluation_questions(id, correct_answer)')
      .eq('id', evaluationId)
      .single();

    if (evalError || !evaluation) {
      res.status(404).json({ success: false, message: 'Evaluation not found' });
      return;
    }

    const questions = (evaluation.evaluation_questions || []) as { id: string; correct_answer: string }[];
    if (questions.length === 0) {
      res.status(400).json({ success: false, message: 'This evaluation has no questions yet' });
      return;
    }

    const unanswered = questions.filter((q) => typeof answers?.[q.id] !== 'string');
    if (unanswered.length > 0) {
      res.status(400).json({ success: false, message: 'Please answer all questions before submitting' });
      return;
    }

    const correctCount = questions.filter((q) => answers[q.id] === q.correct_answer).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= PASS_THRESHOLD;
    const result = { passed, score, correctCount, totalQuestions: questions.length, xpReward: evaluation.xp_reward };

    const { data: existingProgress } = await supabase
      .from('evaluation_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('evaluation_id', evaluationId)
      .single();

    if (existingProgress?.passed) {
      res.status(200).json({
        success: true,
        message: 'Evaluation already passed',
        data: { ...result, passed: true, alreadyPassed: true },
      });
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

    res.status(200).json({
      success: true,
      message: passed ? 'Congratulations! You passed the evaluation.' : 'Evaluation submitted.',
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
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
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
