import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: 'citizen' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role?: 'citizen' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: 'citizen' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
        };
      };
      complaint_categories: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          department_id: string | null;
          ai_keywords: string[] | null;
          created_at: string;
        };
      };
      complaints: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          department_id: string | null;
          title: string;
          description: string;
          location: string;
          latitude: number | null;
          longitude: number | null;
          image_url: string | null;
          status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
          priority: number;
          ai_category_confidence: number | null;
          ai_detected_category: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          department_id?: string | null;
          title: string;
          description: string;
          location: string;
          latitude?: number | null;
          longitude?: number | null;
          image_url?: string | null;
          status?: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
          priority?: number;
          ai_category_confidence?: number | null;
          ai_detected_category?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          department_id?: string | null;
          title?: string;
          description?: string;
          location?: string;
          latitude?: number | null;
          longitude?: number | null;
          image_url?: string | null;
          status?: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'rejected';
          priority?: number;
          ai_category_confidence?: number | null;
          ai_detected_category?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
      complaint_history: {
        Row: {
          id: string;
          complaint_id: string;
          action: string;
          old_value: string | null;
          new_value: string | null;
          notes: string | null;
          actor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          complaint_id: string;
          action: string;
          old_value?: string | null;
          new_value?: string | null;
          notes?: string | null;
          actor_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
