import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
  const { data: topics, error } = await supabase.from('topics').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent topics:', JSON.stringify(topics, null, 2));
  if (error) console.error('Error:', error);
}

test();
