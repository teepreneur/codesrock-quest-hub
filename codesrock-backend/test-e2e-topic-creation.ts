import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const BACKEND_URL = 'https://codesrock-quest-hub.onrender.com';

async function test() {
  // Step 1: Get admin user credentials and sign in via Supabase Auth
  console.log('=== Step 1: Sign in as admin ===');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'hello@codesrock.com',
    password: process.env.ADMIN_PASSWORD || 'placeholder',
  });
  
  if (authError) {
    console.log('Auth error (expected if no ADMIN_PASSWORD):', authError.message);
    console.log('Cannot test with real auth token. Checking backend code instead...');
    
    // Instead, let's check what the backend actually does with the logger import
    // The error might be in the logger itself
    return;
  }

  const token = authData.session?.access_token;
  if (!token) {
    console.log('No token obtained');
    return;
  }
  console.log('Got token:', token.substring(0, 20) + '...');

  // Step 2: Get courses
  console.log('\n=== Step 2: Get courses ===');
  const coursesRes = await fetch(`${BACKEND_URL}/api/admin/content/courses`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const coursesData = await coursesRes.json();
  console.log('Courses status:', coursesRes.status);
  console.log('Courses response keys:', Object.keys(coursesData));
  if (coursesData.data?.courses?.[0]) {
    console.log('First course id:', coursesData.data.courses[0].id);
  }

  // Step 3: Create topic
  if (coursesData.data?.courses?.[0]) {
    const courseId = coursesData.data.courses[0].id;
    console.log('\n=== Step 3: Create topic under course', courseId, '===');
    
    const topicRes = await fetch(`${BACKEND_URL}/api/admin/content/courses/${courseId}/topics`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'E2E Test Topic',
        description: 'Testing from script',
        thumbnail: '',
        orderIndex: 0,
      }),
    });
    
    const topicData = await topicRes.json();
    console.log('Topic creation status:', topicRes.status);
    console.log('Topic response:', JSON.stringify(topicData, null, 2));
    
    // Clean up
    if (topicData.data?.topic?.id) {
      console.log('\n=== Cleaning up ===');
      await supabase.from('topics').delete().eq('id', topicData.data.topic.id);
      console.log('Deleted test topic');
    }
  }
}

test().catch(console.error);
