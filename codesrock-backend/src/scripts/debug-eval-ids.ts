import { supabase } from '../config/supabase';

const USER_ID = 'e8001a9f-193e-498a-b87f-b98e79cd9006';

async function debugEvaluations() {
  console.log('--- Debugging Evaluations ---');

  const { data: evals } = await supabase
    .from('evaluations')
    .select('*');
  
  console.log('All Evaluations:', evals?.map(e => ({ id: e.id, title: e.title, topic_id: e.topic_id })));

  const { data: progress } = await supabase
    .from('evaluation_progress')
    .select('*, evaluations(title)')
    .eq('user_id', USER_ID);
  
  console.log('User Evaluation Progress:', progress?.map(p => ({ 
    id: p.id, 
    evaluation_id: p.evaluation_id, 
    passed: p.passed, 
    title: p.evaluations?.title 
  })));
}

debugEvaluations();
