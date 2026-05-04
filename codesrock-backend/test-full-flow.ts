import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Simulate the EXACT flow of getAllCourses controller
  console.log('=== Simulating getAllCourses controller ===');
  try {
    const { data: courses, error, count } = await supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(0, 49);

    if (error) throw error;

    const coursesWithStats = await Promise.all(
      (courses || []).map(async (course) => {
        const [
          { count: totalViews },
          { count: completions },
        ] = await Promise.all([
          supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('course_id', course.id),
          supabase.from('video_progress').select('*', { count: 'exact', head: true }).eq('course_id', course.id).eq('completed', true),
        ]);

        return {
          ...course,
          stats: {
            totalViews: totalViews || 0,
            completions: completions || 0,
            completionRate: totalViews && totalViews > 0 ? ((completions || 0) / totalViews) * 100 : 0,
          },
        };
      })
    );

    console.log('Total courses:', coursesWithStats.length);
    console.log('First course id:', coursesWithStats[0]?.id);
    console.log('First course stats:', coursesWithStats[0]?.stats);

    // Now simulate what apiService.request returns 
    // The backend sends: { success: true, data: { courses: coursesWithStats, pagination: {...} } }
    // apiService.request does: return data.data as T (line 151)
    // So what the frontend gets is: { courses: [...], pagination: {...} }
    
    // ContentManagement.tsx line 64:
    // const response = await adminService.getAllCourses(params);
    // setCourses(response.courses || response.data?.courses || []);
    const responseFromApi = { courses: coursesWithStats, pagination: { currentPage: 1, totalPages: 1, totalCourses: count || 0, limit: 50 } };
    const courses_parsed = responseFromApi.courses || (responseFromApi as any).data?.courses || [];
    console.log('\nFrontend courses array length:', courses_parsed.length);
    console.log('Frontend first course .id:', courses_parsed[0]?.id);
    console.log('Frontend first course ._id:', (courses_parsed[0] as any)?._id);
    
    // The courseId that gets passed to TopicFormDialog
    const selectedCourse = courses_parsed[0];
    const courseIdForTopic = selectedCourse?.id || selectedCourse?._id;
    console.log('\ncourseId passed to TopicFormDialog:', courseIdForTopic);
    console.log('Is valid UUID?', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseIdForTopic));

  } catch (err) {
    console.error('ERROR:', err);
  }
}

test().catch(console.error);
