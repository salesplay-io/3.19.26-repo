export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          name: string
          website: string | null
          industry: string | null
          location: string | null
          description: string | null
          owner: string
          last_activity: string | null
          linkedin_url: string | null
          contact_count: number
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          website?: string | null
          industry?: string | null
          location?: string | null
          description?: string | null
          owner: string
          last_activity?: string | null
          linkedin_url?: string | null
          contact_count?: number
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          website?: string | null
          industry?: string | null
          location?: string | null
          description?: string | null
          owner?: string
          last_activity?: string | null
          linkedin_url?: string | null
          contact_count?: number
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      contacts: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          title: string | null
          account_id: string
          last_contacted: string | null
          active_salesplay_id: string | null
          completed_salesplays: string[]
          linkedin_url: string | null
          contact_groups: string[]
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          title?: string | null
          account_id: string
          last_contacted?: string | null
          active_salesplay_id?: string | null
          completed_salesplays?: string[]
          linkedin_url?: string | null
          contact_groups?: string[]
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          title?: string | null
          account_id?: string
          last_contacted?: string | null
          active_salesplay_id?: string | null
          completed_salesplays?: string[]
          linkedin_url?: string | null
          contact_groups?: string[]
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      salesplays: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'draft' | 'active' | 'completed' | 'cancelled' | 'paused'
          email_count: number
          contact_count: number
          emails_sent: number
          emails_opened: number
          replies: number
          call_attempts: number
          call_connects: number
          created_at: string
          completed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'draft' | 'active' | 'completed' | 'cancelled' | 'paused'
          email_count?: number
          contact_count?: number
          emails_sent?: number
          emails_opened?: number
          replies?: number
          call_attempts?: number
          call_connects?: number
          created_at?: string
          completed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'draft' | 'active' | 'completed' | 'cancelled' | 'paused'
          email_count?: number
          contact_count?: number
          emails_sent?: number
          emails_opened?: number
          replies?: number
          call_attempts?: number
          call_connects?: number
          created_at?: string
          completed_at?: string | null
          updated_at?: string
          user_id?: string
        }
      }
      salesplay_steps: {
        Row: {
          id: string
          salesplay_id: string
          step_order: number
          type: 'email' | 'call' | 'linkedin_connect' | 'linkedin_message' | 'custom'
          subject: string | null
          content: string | null
          talk_track: string | null
          delay_days: number
          scheduled_date: string | null
          start_immediately: boolean
          has_specific_time: boolean
          send_time: string | null
          timezone: string
          has_time_gap: boolean
          time_gap: string
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          salesplay_id: string
          step_order: number
          type: 'email' | 'call' | 'linkedin_connect' | 'linkedin_message' | 'custom'
          subject?: string | null
          content?: string | null
          talk_track?: string | null
          delay_days?: number
          scheduled_date?: string | null
          start_immediately?: boolean
          has_specific_time?: boolean
          send_time?: string | null
          timezone?: string
          has_time_gap?: boolean
          time_gap?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          salesplay_id?: string
          step_order?: number
          type?: 'email' | 'call' | 'linkedin_connect' | 'linkedin_message' | 'custom'
          subject?: string | null
          content?: string | null
          talk_track?: string | null
          delay_days?: number
          scheduled_date?: string | null
          start_immediately?: boolean
          has_specific_time?: boolean
          send_time?: string | null
          timezone?: string
          has_time_gap?: boolean
          time_gap?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          type: 'call' | 'linkedin_connect' | 'linkedin_message' | 'email' | 'custom'
          contact_id: string
          salesplay_id: string | null
          description: string
          due_date: string
          completed: boolean
          completed_at: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          type: 'call' | 'linkedin_connect' | 'linkedin_message' | 'email' | 'custom'
          contact_id: string
          salesplay_id?: string | null
          description: string
          due_date: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          type?: 'call' | 'linkedin_connect' | 'linkedin_message' | 'email' | 'custom'
          contact_id?: string
          salesplay_id?: string | null
          description?: string
          due_date?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          user_id?: string
        }
      }
      call_logs: {
        Row: {
          id: string
          contact_id: string
          salesplay_id: string
          call_date: string
          call_time: string
          outcome: 'connected' | 'voicemail' | 'not_connected' | 'bad_number' | 'not_interested'
          duration: string | null
          notes: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          contact_id: string
          salesplay_id: string
          call_date: string
          call_time: string
          outcome: 'connected' | 'voicemail' | 'not_connected' | 'bad_number' | 'not_interested'
          duration?: string | null
          notes?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          contact_id?: string
          salesplay_id?: string
          call_date?: string
          call_time?: string
          outcome?: 'connected' | 'voicemail' | 'not_connected' | 'bad_number' | 'not_interested'
          duration?: string | null
          notes?: string | null
          created_at?: string
          user_id?: string
        }
      }
      leads: {
        Row: {
          id: string
          contact_id: string
          salesplay_id: string | null
          status: 'new' | 'qualified' | 'dead'
          source: 'manual' | 'email_reply'
          notes: string | null
          response_preview: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          contact_id: string
          salesplay_id?: string | null
          status?: 'new' | 'qualified' | 'dead'
          source: 'manual' | 'email_reply'
          notes?: string | null
          response_preview?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          contact_id?: string
          salesplay_id?: string | null
          status?: 'new' | 'qualified' | 'dead'
          source?: 'manual' | 'email_reply'
          notes?: string | null
          response_preview?: string | null
          created_at?: string
          user_id?: string
        }
      }
      call_sheets: {
        Row: {
          id: string
          name: string
          contact_ids: string[]
          status: 'active' | 'completed'
          completed_calls: number
          total_calls: number
          created_at: string
          completed_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          contact_ids?: string[]
          status?: 'active' | 'completed'
          completed_calls?: number
          total_calls?: number
          created_at?: string
          completed_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          contact_ids?: string[]
          status?: 'active' | 'completed'
          completed_calls?: number
          total_calls?: number
          created_at?: string
          completed_at?: string | null
          user_id?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      salesplay_status: 'draft' | 'active' | 'completed' | 'cancelled' | 'paused'
      step_type: 'email' | 'call' | 'linkedin_connect' | 'linkedin_message' | 'custom'
      task_type: 'call' | 'linkedin_connect' | 'linkedin_message' | 'email' | 'custom'
      call_outcome: 'connected' | 'voicemail' | 'not_connected' | 'bad_number' | 'not_interested'
      lead_status: 'new' | 'qualified' | 'dead'
      lead_source: 'manual' | 'email_reply'
      call_sheet_status: 'active' | 'completed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}