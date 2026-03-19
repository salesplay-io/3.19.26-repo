import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

class UserProfilesService {
  async getAll(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('first_name', { ascending: true });

    if (error) throw error;

    return (data || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      isAdmin: profile.is_admin,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }));
  }

  async getById(id: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      isAdmin: data.is_admin,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}

export const userProfilesService = new UserProfilesService();
