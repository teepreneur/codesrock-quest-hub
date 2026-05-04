import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPolicies() {
  console.log('Applying RLS policies for topics and videos...\n');

  const statements = [
    // TOPICS
    `ALTER TABLE topics ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "Anyone can read active topics" ON topics`,
    `CREATE POLICY "Anyone can read active topics" ON topics FOR SELECT USING (is_active = true)`,
    `DROP POLICY IF EXISTS "Authenticated users can read all topics" ON topics`,
    `CREATE POLICY "Authenticated users can read all topics" ON topics FOR SELECT TO authenticated USING (true)`,
    `DROP POLICY IF EXISTS "Authenticated users can insert topics" ON topics`,
    `CREATE POLICY "Authenticated users can insert topics" ON topics FOR INSERT TO authenticated WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "Authenticated users can update topics" ON topics`,
    `CREATE POLICY "Authenticated users can update topics" ON topics FOR UPDATE TO authenticated USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "Authenticated users can delete topics" ON topics`,
    `CREATE POLICY "Authenticated users can delete topics" ON topics FOR DELETE TO authenticated USING (true)`,
    // VIDEOS
    `ALTER TABLE videos ENABLE ROW LEVEL SECURITY`,
    `DROP POLICY IF EXISTS "Anyone can read active videos" ON videos`,
    `CREATE POLICY "Anyone can read active videos" ON videos FOR SELECT USING (is_active = true)`,
    `DROP POLICY IF EXISTS "Authenticated users can read all videos" ON videos`,
    `CREATE POLICY "Authenticated users can read all videos" ON videos FOR SELECT TO authenticated USING (true)`,
    `DROP POLICY IF EXISTS "Authenticated users can insert videos" ON videos`,
    `CREATE POLICY "Authenticated users can insert videos" ON videos FOR INSERT TO authenticated WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "Authenticated users can update videos" ON videos`,
    `CREATE POLICY "Authenticated users can update videos" ON videos FOR UPDATE TO authenticated USING (true) WITH CHECK (true)`,
    `DROP POLICY IF EXISTS "Authenticated users can delete videos" ON videos`,
    `CREATE POLICY "Authenticated users can delete videos" ON videos FOR DELETE TO authenticated USING (true)`,
  ];

  for (const sql of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error) {
      // exec_sql may not exist — try alternative approach
      console.log('Cannot use exec_sql RPC. You must run rls_policies.sql manually in the Supabase SQL Editor.');
      console.log('Error:', error.message);
      return false;
    }
    console.log('✓', sql.substring(0, 60) + '...');
  }
  return true;
}

applyPolicies().then(success => {
  if (!success) {
    console.log('\n⚠️  Please copy the contents of migrations/rls_policies.sql');
    console.log('   and run them in your Supabase Dashboard → SQL Editor.');
  }
}).catch(console.error);
