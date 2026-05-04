import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('=== 1. Check activities table schema ===');
  const { data: activityCols, error: activityErr } = await supabase.rpc('to_regclass', { schema_name: 'public.activities' }).maybeSingle();
  // Instead, just try inserting a test audit log to see if it would fail
  const testAudit = {
    user_id: '00000000-0000-0000-0000-000000000000', // fake UUID
    type: 'login',
    description: 'Test audit log',
    xp_earned: 0,
    metadata: { action: 'POST /test', timestamp: new Date().toISOString() },
  };
  const { data: auditResult, error: auditError } = await supabase.from('activities').insert(testAudit).select();
  console.log('Audit insert result:', auditResult);
  console.log('Audit insert error:', auditError);

  console.log('\n=== 2. List a course to get a valid UUID ===');
  const { data: courses, error: courseErr } = await supabase.from('courses').select('id, title').eq('is_active', true).limit(1);
  console.log('Course:', JSON.stringify(courses, null, 2));
  console.log('Course error:', courseErr);

  if (courses && courses.length > 0) {
    const courseId = courses[0].id;
    console.log(`\n=== 3. Try inserting a topic under course ${courseId} ===`);
    const { data: topic, error: topicErr } = await supabase
      .from('topics')
      .insert({
        course_id: courseId,
        title: 'Debug Test Topic',
        description: 'Testing direct insert',
        thumbnail: null,
        order_index: 99,
        is_active: true,
      })
      .select()
      .single();
    console.log('Topic insert result:', JSON.stringify(topic, null, 2));
    console.log('Topic insert error:', topicErr);

    // Clean up
    if (topic) {
      await supabase.from('topics').delete().eq('id', topic.id);
      console.log('Cleaned up test topic');
    }
  }

  // Clean up audit
  await supabase.from('activities').delete().eq('description', 'Test audit log');
  console.log('\n=== 4. Check if activities table has type constraint ===');
  const { data: actTypes, error: typeErr } = await supabase.from('activities').select('type').limit(5);
  console.log('Activity types sample:', actTypes);
  console.log('Type query error:', typeErr);
}

test().catch(console.error);
