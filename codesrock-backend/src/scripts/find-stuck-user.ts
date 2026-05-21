import { supabase } from '../config/supabase';

async function findStuckUser() {
  console.log('--- Searching for stuck teacher ---');
  const { data: stuck, error } = await supabase
    .from('evaluation_progress')
    .select('*, user:profiles(email, first_name, last_name), evaluation:evaluations(title)')
    .eq('passed', true)
    .eq('xp_awarded', false)
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (stuck && stuck.length > 0) {
    const s = stuck[0];
    console.log(`STUCK_USER_FOUND`);
    console.log(`User: ${s.user?.first_name} ${s.user?.last_name} (${s.user?.email})`);
    console.log(`User ID: ${s.user_id}`);
    console.log(`Evaluation: ${s.evaluation?.title}`);
    console.log(`Evaluation ID: ${s.evaluation_id}`);
  } else {
    console.log('No stuck users found with passed=true and xp_awarded=false.');
  }
}

findStuckUser();
