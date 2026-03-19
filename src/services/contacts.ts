import { supabase } from '../lib/supabase';
import { Contact } from '../types';
import { mockContacts } from '../data/mockData';
import { demoModeState } from '../utils/demoModeState';

export const contactsService = {
  async getAll(): Promise<Contact[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(mockContacts);
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(contact => ({
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone || undefined,
      title: contact.title || undefined,
      accountId: contact.account_id,
      lastContacted: contact.last_contacted || undefined,
      activeSalesPlayId: contact.active_salesplay_id || undefined,
      completedSalesPlays: contact.completed_salesplays || [],
      linkedinUrl: contact.linkedin_url || undefined,
      contactGroups: contact.contact_groups || [],
      createdAt: contact.created_at.split('T')[0]
    }));
  },

  async getById(id: string): Promise<Contact | null> {
    if (demoModeState.isDemoMode) {
      const contact = mockContacts.find(c => c.id === id);
      return Promise.resolve(contact || null);
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone || undefined,
      title: data.title || undefined,
      accountId: data.account_id,
      lastContacted: data.last_contacted || undefined,
      activeSalesPlayId: data.active_salesplay_id || undefined,
      completedSalesPlays: data.completed_salesplays || [],
      linkedinUrl: data.linkedin_url || undefined,
      contactGroups: data.contact_groups || [],
      createdAt: data.created_at.split('T')[0]
    };
  },

  async getByAccountId(accountId: string): Promise<Contact[]> {
    if (demoModeState.isDemoMode) {
      const accountContacts = mockContacts.filter(c => c.accountId === accountId);
      return Promise.resolve(accountContacts);
    }

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(contact => ({
      id: contact.id,
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone || undefined,
      title: contact.title || undefined,
      accountId: contact.account_id,
      lastContacted: contact.last_contacted || undefined,
      activeSalesPlayId: contact.active_salesplay_id || undefined,
      completedSalesPlays: contact.completed_salesplays || [],
      linkedinUrl: contact.linkedin_url || undefined,
      contactGroups: contact.contact_groups || [],
      createdAt: contact.created_at.split('T')[0]
    }));
  },

  async create(contact: Omit<Contact, 'id' | 'createdAt'>): Promise<Contact> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        first_name: contact.firstName,
        last_name: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        title: contact.title,
        account_id: contact.accountId,
        last_contacted: contact.lastContacted || null,
        active_salesplay_id: contact.activeSalesPlayId || null,
        completed_salesplays: contact.completedSalesPlays,
        linkedin_url: contact.linkedinUrl,
        contact_groups: contact.contactGroups,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Update account contact count
    await supabase.rpc('increment_account_contact_count', { account_id: contact.accountId });

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone || undefined,
      title: data.title || undefined,
      accountId: data.account_id,
      lastContacted: data.last_contacted || undefined,
      activeSalesPlayId: data.active_salesplay_id || undefined,
      completedSalesPlays: data.completed_salesplays || [],
      linkedinUrl: data.linkedin_url || undefined,
      contactGroups: data.contact_groups || [],
      createdAt: data.created_at.split('T')[0]
    };
  },

  async update(id: string, updates: Partial<Contact>): Promise<Contact> {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        email: updates.email,
        phone: updates.phone,
        title: updates.title,
        account_id: updates.accountId,
        last_contacted: updates.lastContacted || null,
        active_salesplay_id: updates.activeSalesPlayId || null,
        completed_salesplays: updates.completedSalesPlays,
        linkedin_url: updates.linkedinUrl,
        contact_groups: updates.contactGroups
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone || undefined,
      title: data.title || undefined,
      accountId: data.account_id,
      lastContacted: data.last_contacted || undefined,
      activeSalesPlayId: data.active_salesplay_id || undefined,
      completedSalesPlays: data.completed_salesplays || [],
      linkedinUrl: data.linkedin_url || undefined,
      contactGroups: data.contact_groups || [],
      createdAt: data.created_at.split('T')[0]
    };
  },

  async delete(id: string): Promise<void> {
    // Get contact to update account count
    const contact = await this.getById(id);
    
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Update account contact count
    if (contact) {
      await supabase.rpc('decrement_account_contact_count', { account_id: contact.accountId });
    }
  }
};