import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  console.log('🌱 Starting Supabase database seed...\n');

  try {
    // 1. Create Super Admin
    console.log('Creating super admin...');
    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: 'admin@codesrock.org',
      password: 'Admin2024!CodesRock',
      email_confirm: true,
      user_metadata: {
        first_name: 'Super',
        last_name: 'Admin'
      }
    });

    if (adminAuthError) {
      console.error('Admin creation error:', adminAuthError);
    } else if (adminAuth.user) {
      // Update role to super_admin
      await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', adminAuth.user.id);

      // Give admin some XP
      await supabase
        .from('user_progress')
        .update({
          current_xp: 1500,
          total_xp: 1500,
          current_level: 7,
          level_name: 'Innovation Leader',
          streak: 15
        })
        .eq('user_id', adminAuth.user.id);

      console.log('✅ Super Admin created: admin@codesrock.org / Admin2024!CodesRock');
    }

    // 2. Create Sample Teachers
    console.log('\nCreating sample teachers...');
    const teachers = [
      { email: 'sarah@codesrock.org', password: 'Teacher2024!', firstName: 'Sarah', lastName: 'Johnson', xp: 850, level: 5, streak: 7 },
      { email: 'john@codesrock.org', password: 'Teacher2024!', firstName: 'John', lastName: 'Smith', xp: 380, level: 3, streak: 3 },
      { email: 'maria@codesrock.org', password: 'Teacher2024!', firstName: 'Maria', lastName: 'Garcia', xp: 1520, level: 7, streak: 21 }
    ];

    for (const teacher of teachers) {
      const { data: auth, error } = await supabase.auth.admin.createUser({
        email: teacher.email,
        password: teacher.password,
        email_confirm: true,
        user_metadata: {
          first_name: teacher.firstName,
          last_name: teacher.lastName
        }
      });

      if (error) {
        console.error(`Error creating ${teacher.email}:`, error.message);
      } else if (auth.user) {
        // Update progress
        await supabase
          .from('user_progress')
          .update({
            current_xp: teacher.xp,
            total_xp: teacher.xp,
            current_level: teacher.level,
            streak: teacher.streak
          })
          .eq('user_id', auth.user.id);

        console.log(`✅ Teacher created: ${teacher.email} / Teacher2024!`);
      }
    }

    // 3. Create Badges
    console.log('\nCreating badges...');
    const badges = [
      { name: 'First Steps', description: 'Complete your first course', category: 'Achievement', icon: '🚀', points: 10 },
      { name: 'Knowledge Seeker', description: 'Complete 5 courses', category: 'Course', icon: '📚', points: 50 },
      { name: 'Course Master', description: 'Complete 10 courses', category: 'Course', icon: '🎓', points: 100 },
      { name: 'Resource Hunter', description: 'Download 10 resources', category: 'Achievement', icon: '📦', points: 25 },
      { name: 'Week Warrior', description: '7-day streak', category: 'Milestone', icon: '🔥', points: 30 },
      { name: 'Month Champion', description: '30-day streak', category: 'Milestone', icon: '💪', points: 100 },
      { name: 'Level Up!', description: 'Reach Level 2', category: 'Milestone', icon: '⬆️', points: 20 },
      { name: 'HTML Master', description: 'Complete all HTML courses', category: 'Course', icon: '🏆', points: 100 },
      { name: 'JavaScript Ninja', description: 'Complete all JS courses', category: 'Course', icon: '⚡', points: 100 },
      { name: 'Top Performer', description: 'Reach top 3 in leaderboard', category: 'Special', icon: '👑', points: 75 },
      { name: 'Early Bird', description: 'Login before 7 AM', category: 'Special', icon: '🌅', points: 15 },
      { name: 'CodesRock Champion', description: 'Reach Level 8', category: 'Special', icon: '🏅', points: 200 }
    ];

    const { error: badgesError } = await supabase
      .from('badges')
      .insert(badges);

    if (badgesError) {
      console.error('Badges creation error:', badgesError);
    } else {
      console.log(`✅ ${badges.length} badges created`);
    }

    // 4. Create Courses
    console.log('\nCreating courses...');
    const courses = [
      // HTML/CSS
      { title: 'HTML Basics', description: 'Learn the fundamentals of HTML and create your first web page', category: 'HTML/CSS', difficulty: 'Beginner', duration: 30, xp_reward: 50, order_index: 1 },
      { title: 'CSS Fundamentals', description: 'Master CSS styling and make beautiful websites', category: 'HTML/CSS', difficulty: 'Beginner', duration: 45, xp_reward: 50, order_index: 2 },
      { title: 'Flexbox Layout', description: 'Learn modern CSS Flexbox for responsive layouts', category: 'HTML/CSS', difficulty: 'Intermediate', duration: 40, xp_reward: 75, order_index: 3 },
      { title: 'CSS Grid', description: 'Master CSS Grid for complex page layouts', category: 'HTML/CSS', difficulty: 'Intermediate', duration: 45, xp_reward: 75, order_index: 4 },
      { title: 'Responsive Design', description: 'Build mobile-friendly, responsive websites', category: 'HTML/CSS', difficulty: 'Advanced', duration: 60, xp_reward: 100, order_index: 5 },

      // JavaScript
      { title: 'JavaScript Introduction', description: 'Start your journey with JavaScript programming', category: 'JavaScript', difficulty: 'Beginner', duration: 40, xp_reward: 50, order_index: 6 },
      { title: 'Variables and Data Types', description: 'Understand JavaScript variables and data types', category: 'JavaScript', difficulty: 'Beginner', duration: 35, xp_reward: 50, order_index: 7 },
      { title: 'Functions in JavaScript', description: 'Master functions and code reusability', category: 'JavaScript', difficulty: 'Beginner', duration: 45, xp_reward: 50, order_index: 8 },
      { title: 'Arrays and Objects', description: 'Work with arrays and objects in JavaScript', category: 'JavaScript', difficulty: 'Intermediate', duration: 50, xp_reward: 75, order_index: 9 },
      { title: 'DOM Manipulation', description: 'Create interactive web pages with DOM', category: 'JavaScript', difficulty: 'Intermediate', duration: 60, xp_reward: 75, order_index: 10 },
      { title: 'Events and Event Listeners', description: 'Handle user interactions with events', category: 'JavaScript', difficulty: 'Intermediate', duration: 50, xp_reward: 75, order_index: 11 },
      { title: 'Async JavaScript', description: 'Master promises and async/await', category: 'JavaScript', difficulty: 'Advanced', duration: 70, xp_reward: 100, order_index: 12 },

      // Computer Science
      { title: 'How Computers Think', description: 'Introduction to computer science fundamentals', category: 'Computer Science', difficulty: 'Beginner', duration: 35, xp_reward: 50, order_index: 13 },
      { title: 'Binary and Number Systems', description: 'Understand how computers represent data', category: 'Computer Science', difficulty: 'Beginner', duration: 40, xp_reward: 50, order_index: 14 },
      { title: 'Algorithm Basics', description: 'Learn problem-solving with algorithms', category: 'Computer Science', difficulty: 'Intermediate', duration: 55, xp_reward: 75, order_index: 15 },
      { title: 'Data Structures', description: 'Organize data efficiently with data structures', category: 'Computer Science', difficulty: 'Intermediate', duration: 65, xp_reward: 75, order_index: 16 },
      { title: 'Introduction to AI', description: 'Explore the world of artificial intelligence', category: 'Computer Science', difficulty: 'Advanced', duration: 80, xp_reward: 100, order_index: 17 },

      // Creative Coding
      { title: 'Digital Art with Code', description: 'Create beautiful visual art using code', category: 'Creative Coding', difficulty: 'Beginner', duration: 45, xp_reward: 50, order_index: 18 },
      { title: 'Music with Code', description: 'Generate sounds and music programmatically', category: 'Creative Coding', difficulty: 'Intermediate', duration: 50, xp_reward: 75, order_index: 19 },
      { title: 'Game Development Basics', description: 'Build your first simple games', category: 'Creative Coding', difficulty: 'Intermediate', duration: 70, xp_reward: 75, order_index: 20 },
      { title: 'Animation Magic', description: 'Bring your code to life with animations', category: 'Creative Coding', difficulty: 'Advanced', duration: 60, xp_reward: 100, order_index: 21 }
    ];

    const { error: coursesError } = await supabase
      .from('courses')
      .insert(courses);

    if (coursesError) {
      console.error('Courses creation error:', coursesError);
    } else {
      console.log(`✅ ${courses.length} courses created`);
    }

    // 5. Create Resources
    console.log('\nCreating resources...');
    const resources = [
      { title: 'HTML Cheat Sheet', description: 'Quick reference for all HTML tags', category: 'Reference', file_type: 'PDF', grade_level: 'All Levels', subject: 'HTML', xp_reward: 10 },
      { title: 'CSS Properties Guide', description: 'Complete CSS properties reference', category: 'Reference', file_type: 'PDF', grade_level: 'All Levels', subject: 'CSS', xp_reward: 10 },
      { title: 'JavaScript ES6+ Features', description: 'Modern JavaScript features explained', category: 'Tutorial', file_type: 'PDF', grade_level: 'Intermediate', subject: 'JavaScript', xp_reward: 15 },
      { title: 'Web Accessibility Guide', description: 'Make your websites accessible to everyone', category: 'Guide', file_type: 'PDF', grade_level: 'Intermediate', subject: 'Web Development', xp_reward: 15 },
      { title: 'Teaching Code to Kids', description: 'Pedagogy guide for teaching programming', category: 'Teaching', file_type: 'PDF', grade_level: 'Teachers', subject: 'Pedagogy', xp_reward: 20 },
      { title: 'Lesson Plan Template', description: 'Ready-to-use coding lesson template', category: 'Teaching', file_type: 'DOCX', grade_level: 'Teachers', subject: 'Planning', xp_reward: 10 },
      { title: 'Code Review Checklist', description: 'Best practices for reviewing student code', category: 'Teaching', file_type: 'PDF', grade_level: 'Teachers', subject: 'Assessment', xp_reward: 15 },
      { title: 'Debugging Tips and Tricks', description: 'Common bugs and how to fix them', category: 'Tutorial', file_type: 'PDF', grade_level: 'All Levels', subject: 'Programming', xp_reward: 15 }
    ];

    const { error: resourcesError } = await supabase
      .from('resources')
      .insert(resources);

    if (resourcesError) {
      console.error('Resources creation error:', resourcesError);
    } else {
      console.log(`✅ ${resources.length} resources created`);
    }

    console.log('\n✅ Database seeding complete!\n');
    console.log('═══════════════════════════════════════');
    console.log('📝 Test Accounts Created:');
    console.log('═══════════════════════════════════════');
    console.log('Super Admin:');
    console.log('  Email: admin@codesrock.org');
    console.log('  Password: Admin2024!CodesRock\n');
    console.log('Teachers:');
    console.log('  Email: sarah@codesrock.org');
    console.log('  Password: Teacher2024!\n');
    console.log('  Email: john@codesrock.org');
    console.log('  Password: Teacher2024!\n');
    console.log('  Email: maria@codesrock.org');
    console.log('  Password: Teacher2024!');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
