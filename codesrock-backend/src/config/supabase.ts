import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: 'teacher' | 'school_admin' | 'content_admin' | 'super_admin';
          school_id?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          last_login?: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          current_xp: number;
          total_xp: number;
          current_level: number;
          level_name: string;
          streak: number;
          last_activity_date?: string;
          created_at: string;
          updated_at: string;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description?: string;
          thumbnail?: string;
          category: 'HTML/CSS' | 'JavaScript' | 'Computer Science' | 'Creative Coding';
          difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
          duration?: number;
          video_url?: string;
          xp_reward: number;
          required_xp: number;
          order_index?: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      resources: {
        Row: {
          id: string;
          title: string;
          description?: string;
          category?: string;
          file_type?: string;
          file_url?: string;
          file_size?: number;
          grade_level?: string;
          subject?: string;
          download_count: number;
          xp_reward: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      activities: {
        Row: {
          id: string;
          user_id: string;
          type: 'video_completed' | 'resource_downloaded' | 'badge_earned' | 'level_up' | 'streak_milestone' | 'login';
          description?: string;
          xp_earned: number;
          metadata?: any;
          created_at: string;
        };
      };
      video_progress: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          completed: boolean;
          completed_at?: string;
          xp_awarded: boolean;
          last_watched_at: string;
          watch_percentage: number;
        };
      };
      resource_downloads: {
        Row: {
          id: string;
          user_id: string;
          resource_id: string;
          downloaded_at: string;
          xp_awarded: boolean;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description?: string;
          icon?: string;
          category: 'Achievement' | 'Course' | 'Milestone' | 'Special';
          required_xp?: number;
          points: number;
          created_at: string;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
      };
      schools: {
        Row: {
          id: string;
          name: string;
          address?: string;
          region?: string;
          district?: string;
          contact_email?: string;
          teacher_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      training_sessions: {
        Row: {
          id: string;
          title: string;
          description?: string;
          instructor?: string;
          start_time?: string;
          end_time?: string;
          type: 'live' | 'recorded';
          meeting_link?: string;
          recording_url?: string;
          max_participants?: number;
          tags?: string[];
          xp_reward: number;
          created_at: string;
        };
      };
      session_registrations: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          registered_at: string;
          attended: boolean;
          xp_awarded: boolean;
        };
      };
    };
    Functions: {
      award_xp: {
        Args: {
          p_user_id: string;
          p_xp_amount: number;
          p_activity_type: string;
          p_description: string;
        };
        Returns: {
          success: boolean;
          new_xp: number;
          xp_awarded: number;
          level_up: boolean;
          old_level: number;
          new_level: number;
          level_name: string;
        };
      };
      update_streak: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          success: boolean;
          streak: number;
          streak_maintained: boolean;
          previous_streak: number;
        };
      };
      complete_course: {
        Args: {
          p_course_id: string;
          p_user_id: string;
        };
        Returns: {
          success: boolean;
          course_title: string;
          xp_awarded: number;
          level_info: any;
        };
      };
      download_resource: {
        Args: {
          p_resource_id: string;
          p_user_id: string;
        };
        Returns: {
          success: boolean;
          resource_title: string;
          xp_awarded: number;
          level_info: any;
        };
      };
      get_analytics_overview: {
        Args: Record<string, never>;
        Returns: {
          total_users: number;
          active_users: number;
          total_courses: number;
          completed_courses: number;
          total_resources: number;
          total_downloads: number;
          average_xp: number;
        };
      };
      get_leaderboard: {
        Args: {
          p_limit?: number;
        };
        Returns: Array<{
          user_id: string;
          first_name: string;
          last_name: string;
          current_xp: number;
          current_level: number;
          level_name: string;
          rank: number;
        }>;
      };
    };
  };
}

// Helper type for Supabase client
export type SupabaseClient = typeof supabase;
