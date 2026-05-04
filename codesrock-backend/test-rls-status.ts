import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Check RLS status using pg_tables
  const { data, error } = await supabase
    .from('topics')
    .select('id')
    .limit(1);
  console.log('Service role can read topics:', data !== null);
  console.log('Read error:', error);

  // Try an insert with service role
  const courseRes = await supabase.from('courses').select('id').eq('is_active', true).limit(1).single();
  if (!courseRes.data) { console.log('No course found'); return; }

  const { data: topic, error: insertErr } = await supabase
    .from('topics')
    .insert({
      course_id: courseRes.data.id,
      title: 'RLS Test',
      description: '',
      order_index: 999,
      is_active: true,
    })
    .select()
    .single();
  console.log('\nService role can INSERT topics:', topic !== null);
  console.log('Insert error:', insertErr);

  // Now try with anon key
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (anonKey) {
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: anonTopic, error: anonErr } = await anonClient
      .from('topics')
      .insert({
        course_id: courseRes.data.id,
        title: 'Anon RLS Test',
        description: '',
        order_index: 998,
        is_active: true,
      })
      .select()
      .single();
    console.log('\nAnon key can INSERT topics:', anonTopic !== null);
    console.log('Anon insert error:', anonErr);

    // cleanup
    if (anonTopic) await supabase.from('topics').delete().eq('id', anonTopic.id);
  } else {
    console.log('\nNo SUPABASE_ANON_KEY in .env - skipping anon test');
  }

  // Cleanup
  if (topic) {
    await supabase.from('topics').delete().eq('id', topic.id);
    console.log('Cleaned up');
  }
}

test().catch(console.error);
