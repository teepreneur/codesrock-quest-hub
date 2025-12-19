import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!');
  console.error('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Type definitions for database tables
export type Profile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'teacher' | 'admin' | 'school_admin' | 'content_admin' | 'super_admin';
  school_id?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  category: string;
  video_url: string;
  thumbnail: string;
  duration: number;
  difficulty: string;
  xp_reward: number;
  prerequisites: string[];
  is_active: boolean;
  is_published: boolean;
  view_count: number;
  completion_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  current_xp: number;
  total_xp: number;
  current_level: number;
  level_name: string;
  streak: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  xp_reward: number;
  requirement: any;
  is_active: boolean;
  created_at: string;
};

export type Resource = {
  id: string;
  title: string;
  description: string;
  file_type: string;
  file_url: string;
  thumbnail_url: string;
  category: string;
  tags: string[];
  grade_level: string;
  subject: string;
  file_size: number;
  xp_reward: number;
  download_count: number;
  average_rating: number;
  is_active: boolean;
  created_at: string;
};

// Helper function to get current user
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Helper function to get current session
export async function getCurrentSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// Helper function to sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
