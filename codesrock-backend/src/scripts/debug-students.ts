import * as dotenv from 'dotenv';
dotenv.config();

import { supabase } from '../config/supabase';

async function debugStudents() {
  console.log('--- Querying Profiles ---');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, username, school_id');

  if (error) {
    console.error('Error querying profiles:', error);
    return;
  }

  console.log('Total Profiles:', profiles?.length);
  console.table(profiles);
}

debugStudents();
