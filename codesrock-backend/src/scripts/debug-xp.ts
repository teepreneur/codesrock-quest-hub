import { supabase } from '../config/supabase';

const USER_ID = 'e8001a9f-193e-498a-b87f-b98e79cd9006';

async function debugXP() {
  console.log('--- Debugging XP for User:', USER_ID, '---');

  // 1. Check user progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', USER_ID)
    .single();
  
  console.log('User Progress:', progress);

  // 2. Check evaluation progress
  const { data: evProgress } = await supabase
    .from('evaluation_progress')
    .select('*, evaluations(title, xp_reward)')
    .eq('user_id', USER_ID);
  
  console.log('Evaluation Progress:', evProgress);

  // 3. Check activities
  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', USER_ID)
    .order('timestamp', { ascending: false });
  
  console.log('Recent Activities:', activities);
}

debugXP();
