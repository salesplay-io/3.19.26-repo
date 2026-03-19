import { supabase } from '../lib/supabase';
import { demoModeState } from '../utils/demoModeState';
import { mockContactLists, mockContactListMembers } from '../data/mockData';

// Legacy CallSheet type for backwards compatibility
interface CallSheet {
  id: string;
  name: string;
  contactIds: string[];
  status: 'active' | 'completed';
  completedCalls: number;
  totalCalls: number;
  createdAt: string;
  completedAt?: string;
}

// Mock data for demo mode - map from contact lists
const mockCallSheets: CallSheet[] = mockContactLists.map(list => ({
  id: list.id,
  name: list.name,
  contactIds: mockContactListMembers[list.id] || [],
  status: 'active' as const,
  completedCalls: 0,
  totalCalls: list.contactCount,
  createdAt: list.createdAt
}));

export const callSheetsService = {
  async getAll(): Promise<CallSheet[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(mockCallSheets);
    }

    const { data, error } = await supabase
      .from('call_sheets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(sheet => ({
      id: sheet.id,
      name: sheet.name,
      contactIds: sheet.contact_ids || [],
      status: sheet.status as CallSheet['status'],
      completedCalls: sheet.completed_calls,
      totalCalls: sheet.total_calls,
      createdAt: sheet.created_at.split('T')[0],
      completedAt: sheet.completed_at?.split('T')[0]
    }));
  },

  async getById(id: string): Promise<CallSheet | null> {
    if (demoModeState.isDemoMode) {
      const sheet = mockCallSheets.find(s => s.id === id);
      return Promise.resolve(sheet || null);
    }

    const { data, error } = await supabase
      .from('call_sheets')
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
      contactIds: data.contact_ids || [],
      status: data.status as CallSheet['status'],
      completedCalls: data.completed_calls,
      totalCalls: data.total_calls,
      createdAt: data.created_at.split('T')[0],
      completedAt: data.completed_at?.split('T')[0]
    };
  },

  async create(callSheet: Omit<CallSheet, 'id' | 'createdAt' | 'completedAt'>): Promise<CallSheet> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('call_sheets')
      .insert({
        name: callSheet.name,
        contact_ids: callSheet.contactIds,
        status: callSheet.status || 'active',
        completed_calls: callSheet.completedCalls || 0,
        total_calls: callSheet.totalCalls || callSheet.contactIds.length,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      contactIds: data.contact_ids || [],
      status: data.status as CallSheet['status'],
      completedCalls: data.completed_calls,
      totalCalls: data.total_calls,
      createdAt: data.created_at.split('T')[0],
      completedAt: data.completed_at?.split('T')[0]
    };
  },

  async update(id: string, updates: Partial<CallSheet>): Promise<CallSheet> {
    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.contactIds !== undefined) updateData.contact_ids = updates.contactIds;
    if (updates.status !== undefined) {
      updateData.status = updates.status;
      if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (updates.completedCalls !== undefined) updateData.completed_calls = updates.completedCalls;
    if (updates.totalCalls !== undefined) updateData.total_calls = updates.totalCalls;

    const { data, error } = await supabase
      .from('call_sheets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      contactIds: data.contact_ids || [],
      status: data.status as CallSheet['status'],
      completedCalls: data.completed_calls,
      totalCalls: data.total_calls,
      createdAt: data.created_at.split('T')[0],
      completedAt: data.completed_at?.split('T')[0]
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('call_sheets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addContacts(id: string, contactIds: string[]): Promise<CallSheet> {
    // Get current call sheet
    const callSheet = await this.getById(id);
    if (!callSheet) throw new Error('Call sheet not found');

    // Merge contact IDs (avoid duplicates)
    const updatedContactIds = [...new Set([...callSheet.contactIds, ...contactIds])];

    return this.update(id, {
      contactIds: updatedContactIds,
      totalCalls: updatedContactIds.length
    });
  },

  async removeContacts(id: string, contactIds: string[]): Promise<CallSheet> {
    // Get current call sheet
    const callSheet = await this.getById(id);
    if (!callSheet) throw new Error('Call sheet not found');

    // Remove specified contact IDs
    const updatedContactIds = callSheet.contactIds.filter(cId => !contactIds.includes(cId));

    return this.update(id, {
      contactIds: updatedContactIds,
      totalCalls: updatedContactIds.length
    });
  }
};