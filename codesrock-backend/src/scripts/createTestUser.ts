import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function createTestUsers() {
  console.log('Creating test users...\n');

  // Create super admin
  const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
    email: 'superadmin@codesrock.org',
    password: 'Codesrock2024!',
    email_confirm: true,
    user_metadata: {
      first_name: 'Super',
      last_name: 'Admin',
      role: 'super_admin',
    },
  });

  if (adminError) {
    console.error('Error creating admin:', adminError.message);
  } else {
    console.log('Created super admin:', adminUser.user?.email);

    // Create profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: adminUser.user!.id,
      email: adminUser.user!.email,
      first_name: 'Super',
      last_name: 'Admin',
      role: 'super_admin',
      is_active: true,
    });

    if (profileError) {
      console.error('Error creating admin profile:', profileError.message);
    }
  }

  // Create a test school
  const { data: schoolCode } = await supabase.rpc('generate_school_code');

  const { data: school, error: schoolError } = await supabase.from('schools').insert({
    name: 'Lincoln Elementary School',
    school_code: schoolCode || 'SCH-TEST01',
    address: '123 Main Street',
    region: 'Greater Accra',
    district: 'Accra Metro',
    teacher_count: 0,
    is_active: true,
  }).select().single();

  if (schoolError) {
    console.error('Error creating school:', schoolError.message);
  } else {
    console.log('Created school:', school.name, '- Code:', school.school_code);

    // Generate username for teacher
    const { data: username } = await supabase.rpc('generate_username', {
      p_first_name: 'John',
      p_last_name: 'Teacher',
      p_school_id: school.id,
    });

    // Create a test teacher
    const teacherEmail = `${username}@${school.school_code.toLowerCase()}.codesrock.local`;
    const { data: teacherUser, error: teacherError } = await supabase.auth.admin.createUser({
      email: teacherEmail,
      password: 'Teacher2024!',
      email_confirm: true,
      user_metadata: {
        first_name: 'John',
        last_name: 'Teacher',
        role: 'teacher',
        username: username,
        school_id: school.id,
      },
    });

    if (teacherError) {
      console.error('Error creating teacher:', teacherError.message);
    } else {
      console.log('Created teacher:', teacherEmail);

      // Create profile
      const { error: teacherProfileError } = await supabase.from('profiles').upsert({
        id: teacherUser.user!.id,
        email: teacherEmail,
        username: username,
        first_name: 'John',
        last_name: 'Teacher',
        role: 'teacher',
        school_id: school.id,
        is_active: true,
        is_online: false,
      });

      if (teacherProfileError) {
        console.error('Error creating teacher profile:', teacherProfileError.message);
      }

      // Update school teacher count
      await supabase.from('schools').update({ teacher_count: 1 }).eq('id', school.id);
    }

    console.log('\n=== Test Credentials ===');
    console.log('\nSuper Admin (Email Login):');
    console.log('  Email: superadmin@codesrock.org');
    console.log('  Password: Codesrock2024!');
    console.log('\nTeacher (School Login):');
    console.log(`  School ID: ${school.school_code}`);
    console.log(`  Username: ${username}`);
    console.log('  Password: Teacher2024!');
  }

  process.exit(0);
}

createTestUsers().catch(console.error);
