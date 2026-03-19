import { supabase } from '../lib/supabase';
import { Lead } from '../types';
import { mockLeads } from '../data/mockData';
import { demoModeState } from '../utils/demoModeState';

export const leadsService = {
  async getAll(): Promise<Lead[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(mockLeads);
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(lead => ({
      id: lead.id,
      contactId: lead.contact_id,
      salesPlayId: lead.salesplay_id || undefined,
      status: lead.status as Lead['status'],
      source: lead.source as Lead['source'],
      notes: lead.notes || undefined,
      responsePreview: lead.response_preview || undefined,
      createdAt: lead.created_at.split('T')[0]
    }));
  },

  async getById(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return {
      id: data.id,
      contactId: data.contact_id,
      salesPlayId: data.salesplay_id || undefined,
      status: data.status as Lead['status'],
      source: data.source as Lead['source'],
      notes: data.notes || undefined,
      responsePreview: data.response_preview || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async getEmailReplies(): Promise<Lead[]> {
    if (demoModeState.isDemoMode) {
      const emailReplies = mockLeads
        .filter(lead => lead.source === 'email_reply')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return Promise.resolve(emailReplies);
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('source', 'email_reply')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(lead => ({
      id: lead.id,
      contactId: lead.contact_id,
      salesPlayId: lead.salesplay_id || undefined,
      status: lead.status as Lead['status'],
      source: lead.source as Lead['source'],
      notes: lead.notes || undefined,
      responsePreview: lead.response_preview || undefined,
      createdAt: lead.created_at.split('T')[0]
    }));
  },

  async getByContactId(contactId: string): Promise<Lead[]> {
    if (demoModeState.isDemoMode) {
      const leads = mockLeads.filter(lead => lead.contactId === contactId);
      return Promise.resolve(leads);
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(lead => ({
      id: lead.id,
      contactId: lead.contact_id,
      salesPlayId: lead.salesplay_id || undefined,
      status: lead.status as Lead['status'],
      source: lead.source as Lead['source'],
      notes: lead.notes || undefined,
      responsePreview: lead.response_preview || undefined,
      createdAt: lead.created_at.split('T')[0]
    }));
  },

  async create(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .insert({
        contact_id: lead.contactId,
        salesplay_id: lead.salesPlayId || null,
        status: lead.status || 'new',
        source: lead.source,
        notes: lead.notes || null,
        response_preview: lead.responsePreview || null,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      contactId: data.contact_id,
      salesPlayId: data.salesplay_id || undefined,
      status: data.status as Lead['status'],
      source: data.source as Lead['source'],
      notes: data.notes || undefined,
      responsePreview: data.response_preview || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async update(id: string, updates: Partial<Lead>): Promise<Lead> {
    const updateData: any = {};

    if (updates.contactId !== undefined) updateData.contact_id = updates.contactId;
    if (updates.salesPlayId !== undefined) updateData.salesplay_id = updates.salesPlayId;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.source !== undefined) updateData.source = updates.source;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.responsePreview !== undefined) updateData.response_preview = updates.responsePreview;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      contactId: data.contact_id,
      salesPlayId: data.salesplay_id || undefined,
      status: data.status as Lead['status'],
      source: data.source as Lead['source'],
      notes: data.notes || undefined,
      responsePreview: data.response_preview || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCountBySalesPlayId(salesPlayId: string): Promise<number> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(0);
    }

    const { count, error } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('salesplay_id', salesPlayId);

    if (error) throw error;

    return count || 0;
  },

  async getBySalesPlayId(salesPlayId: string): Promise<Lead[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve([]);
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('salesplay_id', salesPlayId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(lead => ({
      id: lead.id,
      contactId: lead.contact_id,
      salesPlayId: lead.salesplay_id || undefined,
      status: lead.status as Lead['status'],
      source: lead.source as Lead['source'],
      notes: lead.notes || undefined,
      responsePreview: lead.response_preview || undefined,
      createdAt: lead.created_at.split('T')[0]
    }));
  }
};