import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Check if RLS is enabled on topics table
  console.log('=== Check RLS on topics ===');
  const { data: rlsData, error: rlsErr } = await supabase.rpc('exec_sql', {
    sql: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('topics', 'videos', 'courses', 'activities')"
  });
  console.log('RLS data:', rlsData);
  console.log('RLS error:', rlsErr);

  // Alternative: directly query the information
  console.log('\n=== Check topics table columns ===');
  const { data: topicInfo, error: topicErr } = await supabase
    .from('topics')
    .select('*')
    .limit(0);
  console.log('Topics query:', topicInfo);
  console.log('Topics error:', topicErr);

  // Check what the getAllCourses response looks like
  console.log('\n=== Full course response structure ===');
  const { data: courses, error: courseErr } = await supabase
    .from('courses')
    .select('*')
    .eq('is_active', true)
    .limit(1);
  if (courses && courses.length > 0) {
    console.log('Course keys:', Object.keys(courses[0]));
    console.log('Course sample:', JSON.stringify(courses[0], null, 2));
  }
  console.log('Course error:', courseErr);

  // Now simulate what the contentController.getAllCourses returns
  console.log('\n=== Simulated getAllCourses response ===');
  const { data: allCourses, error: allErr, count } = await supabase
    .from('courses')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(0, 49);
  console.log('Number of courses:', count);
  if (allCourses && allCourses.length > 0) {
    console.log('First course ID:', allCourses[0].id);
    console.log('First course ID type:', typeof allCourses[0].id);
  }

  // Key check: what does the response wrapper look like?
  // The backend wraps in { success: true, data: { courses: [...] } }
  // The frontend's apiService returns data.data (line 151)
  // So frontend gets { courses: [...] }
  // ContentManagement.tsx line 64: setCourses(response.courses || response.data?.courses || [])
  // Since apiService returns data.data, response IS { courses: [...] }
  // So response.courses should work.
  console.log('\n=== Response shape analysis ===');
  const wrappedResponse = {
    success: true,
    data: {
      courses: allCourses || [],
      pagination: { currentPage: 1, totalPages: 1, totalCourses: count || 0, limit: 50 },
    },
  };
  // apiService.request returns data.data (line 151 of api.service.ts: return data.data as T)
  const whatFrontendGets = wrappedResponse.data;
  console.log('Frontend receives:', Object.keys(whatFrontendGets));
  console.log('Has .courses?', !!whatFrontendGets.courses);
  if (whatFrontendGets.courses.length > 0) {
    console.log('First course has .id?', !!whatFrontendGets.courses[0].id);
    console.log('First course .id value:', whatFrontendGets.courses[0].id);
  }
}

test().catch(console.error);
