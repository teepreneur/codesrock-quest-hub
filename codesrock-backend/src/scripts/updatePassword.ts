import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function updatePassword() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const admin = users.find((u: any) => u.email === 'superadmin@codesrock.org');
  if (admin) {
    await supabase.auth.admin.updateUserById(admin.id, { password: 'Codesrock2024' });
    console.log('Updated admin password to: Codesrock2024');
  }

  const teacher = users.find((u: any) => u.email?.includes('jteacher01'));
  if (teacher) {
    await supabase.auth.admin.updateUserById(teacher.id, { password: 'Teacher2024' });
    console.log('Updated teacher password to: Teacher2024');
  }
}

updatePassword().then(() => process.exit(0));
