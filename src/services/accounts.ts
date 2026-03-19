import { supabase } from '../lib/supabase';
import { Account } from '../types';
import { mockAccounts } from '../data/mockData';
import { demoModeState } from '../utils/demoModeState';

export const accountsService = {
  async getAll(): Promise<Account[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(mockAccounts);
    }

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(account => ({
      id: account.id,
      name: account.name,
      website: account.website || undefined,
      industry: account.industry || undefined,
      location: account.location || undefined,
      description: account.description || undefined,
      owner: account.owner,
      lastActivity: account.last_activity || '',
      linkedinUrl: account.linkedin_url || undefined,
      contactCount: account.contact_count,
      phone: account.phone || undefined,
      companySize: account.company_size || undefined,
      createdAt: account.created_at.split('T')[0]
    }));
  },

  async getById(id: string): Promise<Account | null> {
    if (demoModeState.isDemoMode) {
      const account = mockAccounts.find(a => a.id === id);
      return Promise.resolve(account || null);
    }

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      website: data.website || undefined,
      industry: data.industry || undefined,
      location: data.location || undefined,
      description: data.description || undefined,
      owner: data.owner,
      lastActivity: data.last_activity || '',
      linkedinUrl: data.linkedin_url || undefined,
      contactCount: data.contact_count,
      phone: data.phone || undefined,
      companySize: data.company_size || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async create(account: Omit<Account, 'id' | 'createdAt' | 'contactCount'>): Promise<Account> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name: account.name,
        website: account.website || null,
        industry: account.industry || null,
        location: account.location || null,
        description: account.description || null,
        owner: account.owner || user.user.email || 'Unknown',
        last_activity: account.lastActivity || null,
        linkedin_url: account.linkedinUrl || null,
        company_size: account.companySize || null,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      website: data.website || undefined,
      industry: data.industry || undefined,
      location: data.location || undefined,
      description: data.description || undefined,
      owner: data.owner,
      lastActivity: data.last_activity || '',
      linkedinUrl: data.linkedin_url || undefined,
      contactCount: data.contact_count || 0,
      phone: data.phone || undefined,
      companySize: data.company_size || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async update(id: string, updates: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update({
        name: updates.name,
        website: updates.website,
        industry: updates.industry,
        location: updates.location,
        description: updates.description,
        owner: updates.owner,
        last_activity: updates.lastActivity || null,
        linkedin_url: updates.linkedinUrl,
        phone: updates.phone,
        company_size: updates.companySize
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      website: data.website || undefined,
      industry: data.industry || undefined,
      location: data.location || undefined,
      description: data.description || undefined,
      owner: data.owner,
      lastActivity: data.last_activity || '',
      linkedinUrl: data.linkedin_url || undefined,
      contactCount: data.contact_count,
      phone: data.phone || undefined,
      companySize: data.company_size || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};