import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';

async function test() {
  // Get a valid course ID using service key
  const admin = createClient(supabaseUrl, serviceKey);
  const { data: courses } = await admin.from('courses').select('id').eq('is_active', true).limit(1);
  if (!courses?.[0]) { console.log('No courses found'); return; }
  const courseId = courses[0].id;

  // Test with ANON key (simulates what Render might be doing)
  console.log('=== Testing with ANON key after RLS fix ===');
  const anon = createClient(supabaseUrl, anonKey);
  const { data: topic, error } = await anon
    .from('topics')
    .insert({ course_id: courseId, title: 'RLS Fix Verify', description: 'test', order_index: 999, is_active: true })
    .select()
    .single();

  if (error) {
    console.log('❌ STILL FAILING:', error.message);
    console.log('   Code:', error.code);
  } else {
    console.log('✅ SUCCESS! Topic created:', topic.id);
    // Clean up
    await admin.from('topics').delete().eq('id', topic.id);
    console.log('   Cleaned up test topic');
  }
}

test().catch(console.error);
