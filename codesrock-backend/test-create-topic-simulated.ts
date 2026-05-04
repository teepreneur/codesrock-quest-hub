import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Get a valid course
  const { data: courses } = await supabase.from('courses').select('id, title').eq('is_active', true).limit(1);
  if (!courses || courses.length === 0) { console.log('No courses'); return; }
  const courseId = courses[0].id;

  // Simulate EXACTLY what the TopicFormDialog sends
  // formData = { title: "Intro to Codesrock", description: "test test", thumbnail: "https://example.com/image.jpg", orderIndex: 0 }
  // This gets sent as JSON body to POST /api/admin/content/courses/:courseId/topics
  const formData = { title: "Intro to Codesrock", description: "test test", thumbnail: "https://example.com/image.jpg", orderIndex: 0 };
  
  console.log('=== Simulating createTopic controller ===');
  console.log('courseId:', courseId);
  console.log('Body:', formData);

  // Step 1: Verify course exists (same as controller line 70-79)
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .single();
  console.log('\n1. Course verification:', course ? 'PASS' : 'FAIL');
  console.log('   Course error:', courseError);

  // Step 2: Calculate order index (same as controller line 82-93)
  let order = formData.orderIndex;
  if (order === undefined || order === null) {
    const { data: lastTopic } = await supabase
      .from('topics')
      .select('order_index')
      .eq('course_id', courseId)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();
    order = (lastTopic?.order_index || 0) + 1;
  }
  console.log('2. Order index:', order);

  // Step 3: Insert topic (same as controller line 95-106)
  const { data: topic, error } = await supabase
    .from('topics')
    .insert({
      course_id: courseId,
      title: formData.title,
      description: formData.description || '',
      thumbnail: formData.thumbnail || null,
      order_index: order,
      is_active: true,
    })
    .select()
    .single();

  console.log('3. Topic insert result:', topic ? 'SUCCESS' : 'FAIL');
  console.log('   Topic:', JSON.stringify(topic, null, 2));
  console.log('   Error:', error);

  // Clean up
  if (topic) {
    await supabase.from('topics').delete().eq('id', topic.id);
    console.log('\nCleaned up test topic');
  }
}

test().catch(console.error);
