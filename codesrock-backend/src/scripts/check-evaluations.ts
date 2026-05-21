import { supabase } from '../config/supabase';

async function checkEvaluations() {
  console.log('--- Checking Evaluations ---');
  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select('*, topic:topics(title, course:courses(title))');

  if (error) {
    console.error('Error fetching evaluations:', error);
    return;
  }

  console.log(`Found ${evaluations.length} evaluations:`);
  evaluations.forEach(e => {
    console.log(`- [${e.topic?.course?.title || 'No Course'}] ${e.title}: XP Reward = ${e.xp_reward}`);
  });

  console.log('\n--- Checking Missing XP for Passed Evaluations ---');
  const { data: passedMissingXP, error: pError } = await supabase
    .from('evaluation_progress')
    .select('*, user:profiles(email), evaluation:evaluations(title, xp_reward)')
    .eq('passed', true)
    .eq('xp_awarded', false);

  if (pError) {
    console.error('Error fetching passed evaluations:', pError);
    return;
  }

  console.log(`Found ${passedMissingXP.length} passed evaluations without XP awarded:`);
  passedMissingXP.forEach(p => {
    console.log(`- User: ${p.user?.email}, Eval: ${p.evaluation?.title}, XP to award: ${p.evaluation?.xp_reward}`);
  });
}

checkEvaluations();
