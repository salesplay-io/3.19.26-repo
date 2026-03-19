import { supabase } from '../lib/supabase';
import { CallLog } from '../types';
import { mockCallLogs } from '../data/mockData';
import { demoModeState } from '../utils/demoModeState';

const formatDateToDisplay = (dateStr: string): string => {
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[1]}-${parts[2]}-${parts[0]}`;
      }
      return dateStr;
    }
  }
  return dateStr;
};

export const callLogsService = {
  async getAll(): Promise<CallLog[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(mockCallLogs);
    }

    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(log => ({
      id: log.id,
      contactId: log.contact_id,
      salesPlayId: log.salesplay_id || undefined,
      callDate: formatDateToDisplay(log.call_date),
      callTime: log.call_time,
      outcome: log.outcome as CallLog['outcome'],
      duration: log.duration || undefined,
      notes: log.notes || undefined,
      createdAt: log.created_at.split('T')[0]
    }));
  },

  async getById(id: string): Promise<CallLog | null> {
    const { data, error } = await supabase
      .from('call_logs')
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
      callDate: formatDateToDisplay(data.call_date),
      callTime: data.call_time,
      outcome: data.outcome as CallLog['outcome'],
      duration: data.duration || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async getByContactId(contactId: string): Promise<CallLog[]> {
    if (demoModeState.isDemoMode) {
      const logs = mockCallLogs.filter(log => log.contactId === contactId);
      return Promise.resolve(logs);
    }

    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(log => ({
      id: log.id,
      contactId: log.contact_id,
      salesPlayId: log.salesplay_id || undefined,
      callDate: formatDateToDisplay(log.call_date),
      callTime: log.call_time,
      outcome: log.outcome as CallLog['outcome'],
      duration: log.duration || undefined,
      notes: log.notes || undefined,
      createdAt: log.created_at.split('T')[0]
    }));
  },

  async getBySalesPlayId(salesPlayId: string): Promise<CallLog[]> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('salesplay_id', salesPlayId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(log => ({
      id: log.id,
      contactId: log.contact_id,
      salesPlayId: log.salesplay_id || undefined,
      callDate: formatDateToDisplay(log.call_date),
      callTime: log.call_time,
      outcome: log.outcome as CallLog['outcome'],
      duration: log.duration || undefined,
      notes: log.notes || undefined,
      createdAt: log.created_at.split('T')[0]
    }));
  },

  async getCallConnects(salesPlayId: string): Promise<CallLog[]> {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('salesplay_id', salesPlayId)
      .eq('outcome', 'connected')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(log => ({
      id: log.id,
      contactId: log.contact_id,
      salesPlayId: log.salesplay_id || undefined,
      callDate: formatDateToDisplay(log.call_date),
      callTime: log.call_time,
      outcome: log.outcome as CallLog['outcome'],
      duration: log.duration || undefined,
      notes: log.notes || undefined,
      createdAt: log.created_at.split('T')[0]
    }));
  },

  async create(callLog: Omit<CallLog, 'id' | 'createdAt'>): Promise<CallLog> {
    if (demoModeState.isDemoMode) {
      const newCallLog: CallLog = {
        id: `demo-call-log-${Date.now()}`,
        contactId: callLog.contactId,
        salesPlayId: callLog.salesPlayId,
        callDate: callLog.callDate,
        callTime: callLog.callTime,
        outcome: callLog.outcome,
        duration: callLog.duration,
        notes: callLog.notes,
        createdAt: new Date().toISOString().split('T')[0]
      };
      return Promise.resolve(newCallLog);
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('call_logs')
      .insert({
        contact_id: callLog.contactId,
        salesplay_id: callLog.salesPlayId || null,
        call_date: callLog.callDate,
        call_time: callLog.callTime,
        outcome: callLog.outcome,
        duration: callLog.duration || null,
        notes: callLog.notes || null,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      contactId: data.contact_id,
      salesPlayId: data.salesplay_id || undefined,
      callDate: formatDateToDisplay(data.call_date),
      callTime: data.call_time,
      outcome: data.outcome as CallLog['outcome'],
      duration: data.duration || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async update(id: string, updates: Partial<CallLog>): Promise<CallLog> {
    const updateData: any = {};
    
    if (updates.contactId !== undefined) updateData.contact_id = updates.contactId;
    if (updates.salesPlayId !== undefined) updateData.salesplay_id = updates.salesPlayId;
    if (updates.callDate !== undefined) updateData.call_date = updates.callDate;
    if (updates.callTime !== undefined) updateData.call_time = updates.callTime;
    if (updates.outcome !== undefined) updateData.outcome = updates.outcome;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('call_logs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      contactId: data.contact_id,
      salesPlayId: data.salesplay_id || undefined,
      callDate: formatDateToDisplay(data.call_date),
      callTime: data.call_time,
      outcome: data.outcome as CallLog['outcome'],
      duration: data.duration || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at.split('T')[0]
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('call_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};