import { supabase } from '../lib/supabase';
import { demoModeState } from '../utils/demoModeState';
import { mockOutboundActivities } from '../data/mockData';

export interface OutboundActivity {
  id: string;
  contactId: string;
  salesPlayId?: string;
  salesPlayStepId?: string;
  stepOrder?: number;
  activityType: 'email_sent' | 'email_received' | 'call' | 'linkedin_connect' | 'linkedin_message' | 'meeting';
  activityDate: string;
  activityTime: string;
  outcome?: string;
  subject?: string;
  content?: string;
  duration?: string;
  notes?: string;
  createdAt: string;
  userId: string;
  userFirstName?: string;
  userLastName?: string;
}

export const outboundActivitiesService = {
  async getAll(): Promise<OutboundActivity[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(
        mockOutboundActivities.sort((a, b) => {
          const dateCompare = new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime();
          if (dateCompare !== 0) return dateCompare;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
      );
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('outbound_activities')
      .select('*')
      .eq('user_id', user.user.id)
      .order('activity_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch user profiles separately
    const userIds = [...new Set(data.map(a => a.user_id))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return data.map(activity => {
      const profile = profileMap.get(activity.user_id);
      return {
        id: activity.id,
        contactId: activity.contact_id,
        salesPlayId: activity.salesplay_id || undefined,
        salesPlayStepId: activity.salesplay_step_id || undefined,
        stepOrder: activity.step_order || undefined,
        activityType: activity.activity_type as OutboundActivity['activityType'],
        activityDate: activity.activity_date,
        activityTime: activity.activity_time,
        outcome: activity.outcome || undefined,
        subject: activity.subject || undefined,
        content: activity.content || undefined,
        duration: activity.duration || undefined,
        notes: activity.notes || undefined,
        createdAt: activity.created_at,
        userId: activity.user_id,
        userFirstName: profile?.first_name || undefined,
        userLastName: profile?.last_name || undefined
      };
    });
  },

  async getByContactId(contactId: string): Promise<OutboundActivity[]> {
    if (demoModeState.isDemoMode) {
      const filtered = mockOutboundActivities.filter(activity => activity.contactId === contactId);
      return Promise.resolve(
        filtered.sort((a, b) => {
          const dateCompare = new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime();
          if (dateCompare !== 0) return dateCompare;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
      );
    }

    const { data, error } = await supabase
      .from('outbound_activities')
      .select('*')
      .eq('contact_id', contactId)
      .order('activity_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch user profiles separately
    const userIds = [...new Set(data.map(a => a.user_id))];

    if (userIds.length === 0) {
      return [];
    }

    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching user profiles:', profileError);
    }

    console.log('User IDs:', userIds);
    console.log('Fetched profiles:', profiles);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return data.map(activity => {
      const profile = profileMap.get(activity.user_id);
      return {
        id: activity.id,
        contactId: activity.contact_id,
        salesPlayId: activity.salesplay_id || undefined,
        salesPlayStepId: activity.salesplay_step_id || undefined,
        stepOrder: activity.step_order || undefined,
        activityType: activity.activity_type as OutboundActivity['activityType'],
        activityDate: activity.activity_date,
        activityTime: activity.activity_time,
        outcome: activity.outcome || undefined,
        subject: activity.subject || undefined,
        content: activity.content || undefined,
        duration: activity.duration || undefined,
        notes: activity.notes || undefined,
        createdAt: activity.created_at,
        userId: activity.user_id,
        userFirstName: profile?.first_name || undefined,
        userLastName: profile?.last_name || undefined
      };
    });
  },

  async getByAccountId(accountId: string, contactIds: string[]): Promise<OutboundActivity[]> {
    if (demoModeState.isDemoMode) {
      const filtered = mockOutboundActivities.filter(activity => contactIds.includes(activity.contactId));
      return Promise.resolve(
        filtered.sort((a, b) => {
          const dateCompare = new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime();
          if (dateCompare !== 0) return dateCompare;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
      );
    }

    if (contactIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('outbound_activities')
      .select('*')
      .in('contact_id', contactIds)
      .order('activity_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch user profiles separately
    const userIds = [...new Set(data.map(a => a.user_id))];
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return data.map(activity => {
      const profile = profileMap.get(activity.user_id);
      return {
        id: activity.id,
        contactId: activity.contact_id,
        salesPlayId: activity.salesplay_id || undefined,
        salesPlayStepId: activity.salesplay_step_id || undefined,
        stepOrder: activity.step_order || undefined,
        activityType: activity.activity_type as OutboundActivity['activityType'],
        activityDate: activity.activity_date,
        activityTime: activity.activity_time,
        outcome: activity.outcome || undefined,
        subject: activity.subject || undefined,
        content: activity.content || undefined,
        duration: activity.duration || undefined,
        notes: activity.notes || undefined,
        createdAt: activity.created_at,
        userId: activity.user_id,
        userFirstName: profile?.first_name || undefined,
        userLastName: profile?.last_name || undefined
      };
    });
  },

  async create(activity: Omit<OutboundActivity, 'id' | 'createdAt' | 'userId' | 'userFirstName' | 'userLastName'>): Promise<OutboundActivity> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('outbound_activities')
      .insert({
        contact_id: activity.contactId,
        salesplay_id: activity.salesPlayId || null,
        salesplay_step_id: activity.salesPlayStepId || null,
        step_order: activity.stepOrder || null,
        activity_type: activity.activityType,
        activity_date: activity.activityDate,
        activity_time: activity.activityTime,
        outcome: activity.outcome || null,
        subject: activity.subject || null,
        content: activity.content || null,
        duration: activity.duration || null,
        notes: activity.notes || null,
        user_id: user.user.id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      contactId: data.contact_id,
      salesPlayId: data.salesplay_id || undefined,
      salesPlayStepId: data.salesplay_step_id || undefined,
      stepOrder: data.step_order || undefined,
      activityType: data.activity_type as OutboundActivity['activityType'],
      activityDate: data.activity_date,
      activityTime: data.activity_time,
      outcome: data.outcome || undefined,
      subject: data.subject || undefined,
      content: data.content || undefined,
      duration: data.duration || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      userId: data.user_id,
      userFirstName: undefined,
      userLastName: undefined
    };
  },

  async update(id: string, updates: Partial<OutboundActivity>): Promise<OutboundActivity> {
    const updateData: any = {};

    if (updates.contactId !== undefined) updateData.contact_id = updates.contactId;
    if (updates.salesPlayId !== undefined) updateData.salesplay_id = updates.salesPlayId;
    if (updates.salesPlayStepId !== undefined) updateData.salesplay_step_id = updates.salesPlayStepId;
    if (updates.stepOrder !== undefined) updateData.step_order = updates.stepOrder;
    if (updates.activityType !== undefined) updateData.activity_type = updates.activityType;
    if (updates.activityDate !== undefined) updateData.activity_date = updates.activityDate;
    if (updates.activityTime !== undefined) updateData.activity_time = updates.activityTime;
    if (updates.outcome !== undefined) updateData.outcome = updates.outcome;
    if (updates.subject !== undefined) updateData.subject = updates.subject;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('outbound_activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      contactId: data.contact_id,
      salesPlayId: data.salesplay_id || undefined,
      salesPlayStepId: data.salesplay_step_id || undefined,
      stepOrder: data.step_order || undefined,
      activityType: data.activity_type as OutboundActivity['activityType'],
      activityDate: data.activity_date,
      activityTime: data.activity_time,
      outcome: data.outcome || undefined,
      subject: data.subject || undefined,
      content: data.content || undefined,
      duration: data.duration || undefined,
      notes: data.notes || undefined,
      createdAt: data.created_at,
      userId: data.user_id,
      userFirstName: undefined,
      userLastName: undefined
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('outbound_activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
