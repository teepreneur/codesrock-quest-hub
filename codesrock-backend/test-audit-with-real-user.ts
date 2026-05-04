import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // 1. Get a real user from auth.users via profiles
  console.log('=== 1. Get real user from profiles ===');
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, email, role')
    .in('role', ['content_admin', 'super_admin', 'admin'])
    .limit(3);
  console.log('Admin profiles:', JSON.stringify(profiles, null, 2));
  console.log('Profile error:', profErr);

  // 2. Check the users table vs profiles table
  console.log('\n=== 2. Check users table ===');
  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, email, role')
    .limit(3);
  console.log('Users table:', JSON.stringify(users, null, 2));
  console.log('Users error:', userErr);

  // 3. If we have a real user, test the audit insert
  if (profiles && profiles.length > 0) {
    const realUserId = profiles[0].id;
    console.log(`\n=== 3. Test audit insert with real user ${realUserId} ===`);
    
    // But first check if this user exists in the users table
    const { data: userExists, error: existErr } = await supabase
      .from('users')
      .select('id')
      .eq('id', realUserId)
      .maybeSingle();
    console.log('User exists in users table?', userExists);
    console.log('Exists error:', existErr);

    // Try the audit insert
    const { data: auditResult, error: auditError } = await supabase
      .from('activities')
      .insert({
        user_id: realUserId,
        type: 'login',
        description: 'Test audit from real user',
        xp_earned: 0,
        metadata: { action: 'POST /test', timestamp: new Date().toISOString() },
      })
      .select();
    console.log('Audit result:', auditResult);
    console.log('Audit error:', auditError);

    // Clean up
    if (auditResult) {
      await supabase.from('activities').delete().eq('description', 'Test audit from real user');
    }
  }
}

test().catch(console.error);
