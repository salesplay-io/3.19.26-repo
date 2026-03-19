import { supabase } from '../lib/supabase';
import { SalesPlay, SalesPlayStep } from '../types';
import { mockSalesPlays } from '../data/mockData';
import { demoModeState } from '../utils/demoModeState';

export const salesplaysService = {
  async getAll(): Promise<SalesPlay[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve(mockSalesPlays);
    }

    const { data, error } = await supabase
      .from('salesplays')
      .select(`
        *,
        salesplay_steps (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(salesplay => ({
      id: salesplay.id,
      name: salesplay.name,
      description: salesplay.description,
      notes: salesplay.notes,
      status: salesplay.status as SalesPlay['status'],
      emailCount: salesplay.email_count,
      contactCount: salesplay.contact_count,
      emailsSent: salesplay.emails_sent,
      emailsOpened: salesplay.emails_opened,
      replies: salesplay.replies,
      callAttempts: salesplay.call_attempts,
      callConnects: salesplay.call_connects,
      linkedinActivities: salesplay.linkedin_activities || 0,
      createdAt: salesplay.created_at.split('T')[0],
      completedAt: salesplay.completed_at?.split('T')[0],
      steps: (salesplay.salesplay_steps || [])
        .sort((a: any, b: any) => a.step_order - b.step_order)
        .map((step: any) => ({
          id: step.id,
          type: step.type,
          subject: step.subject,
          content: step.content,
          talkTrack: step.talk_track,
          delayDays: step.delay_days,
          scheduledDate: step.scheduled_date,
          scheduledTime: step.send_time,
          completed: step.completed,
          completedAt: step.completed_at?.split('T')[0]
        }))
    }));
  },

  async getById(id: string): Promise<SalesPlay | null> {
    if (demoModeState.isDemoMode) {
      const salesPlay = mockSalesPlays.find(sp => sp.id === id);
      return Promise.resolve(salesPlay || null);
    }

    const { data, error } = await supabase
      .from('salesplays')
      .select(`
        *,
        salesplay_steps (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    console.log('getById raw data:', data);
    console.log('getById steps:', data.salesplay_steps);

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      status: data.status as SalesPlay['status'],
      emailCount: data.email_count,
      contactCount: data.contact_count,
      emailsSent: data.emails_sent,
      emailsOpened: data.emails_opened,
      replies: data.replies,
      callAttempts: data.call_attempts,
      callConnects: data.call_connects,
      linkedinActivities: data.linkedin_activities || 0,
      createdAt: data.created_at.split('T')[0],
      completedAt: data.completed_at?.split('T')[0],
      steps: (data.salesplay_steps || [])
        .sort((a: any, b: any) => a.step_order - b.step_order)
        .map((step: any) => ({
          id: step.id,
          type: step.type,
          subject: step.subject,
          content: step.content,
          talkTrack: step.talk_track,
          title: step.title,
          message: step.message,
          delayDays: step.delay_days,
          scheduledDate: step.scheduled_date,
          scheduledTime: step.send_time,
          completed: step.completed,
          completedAt: step.completed_at?.split('T')[0]
        }))
    };
  },

  async create(salesplay: {
    name: string;
    description?: string;
    notes?: string;
    status?: 'draft' | 'active' | 'completed' | 'cancelled' | 'paused';
    emailAccountId?: string;
    steps: Array<{
      type: 'email' | 'call' | 'linkedin_connect' | 'linkedin_message' | 'custom';
      subject?: string;
      content?: string;
      talkTrack?: string;
      delayDays: number;
      scheduledDate?: string;
      startImmediately?: boolean;
      hasSpecificTime?: boolean;
      sendTime?: string;
      timezone?: string;
      inheritSendTime?: boolean;
      hasTimeGap?: boolean;
      timeGap?: string;
    }>;
  }): Promise<SalesPlay> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const salesplayToInsert = {
      name: salesplay.name,
      description: salesplay.description || salesplay.notes || null,
      email_count: salesplay.steps.filter(s => s.type === 'email').length,
      status: salesplay.status || 'active',
      user_id: user.user.id,
      email_account_id: salesplay.emailAccountId || null
    };

    console.log('Inserting salesplay:', salesplayToInsert);

    // Create salesplay
    const { data: salesplayData, error: salesplayError } = await supabase
      .from('salesplays')
      .insert(salesplayToInsert)
      .select()
      .single();

    if (salesplayError) {
      console.error('Salesplay insert error:', salesplayError);
      throw salesplayError;
    }

    // Create steps
    const stepsToInsert = salesplay.steps.map((step, index) => ({
      salesplay_id: salesplayData.id,
      step_order: index + 1,
      type: step.type,
      subject: step.subject || null,
      content: step.content || null,
      talk_track: step.talkTrack || null,
      delay_days: step.delayDays || 0,
      scheduled_date: step.scheduledDate || null,
      start_immediately: step.startImmediately || false,
      has_specific_time: step.hasSpecificTime || false,
      send_time: step.sendTime || null,
      timezone: step.timezone || 'PST',
      inherit_send_time: step.inheritSendTime || false,
      has_time_gap: step.hasTimeGap || false,
      time_gap: step.timeGap || '30s'
    }));

    console.log('Inserting steps:', stepsToInsert);

    const { error: stepsError } = await supabase
      .from('salesplay_steps')
      .insert(stepsToInsert);

    if (stepsError) {
      console.error('Steps insert error:', stepsError);
      throw stepsError;
    }

    return await this.getById(salesplayData.id) as SalesPlay;
  },

  async update(id: string, updates: Partial<SalesPlay>): Promise<SalesPlay> {
    const { data, error } = await supabase
      .from('salesplays')
      .update({
        name: updates.name,
        status: updates.status,
        contact_count: updates.contactCount,
        emails_sent: updates.emailsSent,
        emails_opened: updates.emailsOpened,
        replies: updates.replies,
        call_attempts: updates.callAttempts,
        call_connects: updates.callConnects,
        completed_at: updates.completedAt || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return await this.getById(id) as SalesPlay;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('salesplays')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async addContactsToSalesPlay(salesPlayId: string, contactIds: string[]): Promise<void> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve();
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const contactsToInsert = contactIds.map(contactId => ({
      salesplay_id: salesPlayId,
      contact_id: contactId,
      status: 'active',
      user_id: user.user.id
    }));

    const { error } = await supabase
      .from('salesplay_contacts')
      .insert(contactsToInsert);

    if (error) throw error;

    const { data: salesPlay } = await supabase
      .from('salesplays')
      .select('contact_count')
      .eq('id', salesPlayId)
      .single();

    const currentCount = salesPlay?.contact_count || 0;

    await supabase
      .from('salesplays')
      .update({ contact_count: currentCount + contactIds.length })
      .eq('id', salesPlayId);

    const { data: steps } = await supabase
      .from('salesplay_steps')
      .select('*')
      .eq('salesplay_id', salesPlayId)
      .order('step_order', { ascending: true });

    if (steps && steps.length > 0) {
      const today = new Date();
      const enrollmentHH = String(today.getUTCHours()).padStart(2, '0');
      const enrollmentMM = String(today.getUTCMinutes()).padStart(2, '0');
      const enrollmentTime = `${enrollmentHH}:${enrollmentMM}:00`;

      const step1 = steps[0];
      let step1ResolvedTime: string;
      let step1ResolvedTimezone: string;

      if (step1.start_immediately) {
        step1ResolvedTime = enrollmentTime;
        step1ResolvedTimezone = 'UTC';
      } else {
        step1ResolvedTime = step1.send_time ?? enrollmentTime;
        step1ResolvedTimezone = step1.timezone || 'UTC';
      }

      const tasksToCreate = [];

      for (const contactId of contactIds) {
        let cumulativeDays = 0;

        for (const step of steps) {
          let dueDate: Date;

          if (step.start_immediately && step.step_order === 1) {
            dueDate = new Date(today);
          } else if (step.scheduled_date) {
            dueDate = new Date(step.scheduled_date);
          } else {
            cumulativeDays += (step.delay_days || 0);
            dueDate = new Date(today);
            dueDate.setDate(today.getDate() + cumulativeDays);
          }

          const dueDateStr = dueDate.toISOString().split('T')[0];

          let taskDescription = '';
          let taskTitle = '';
          let taskMessage = '';

          if (step.type === 'email') {
            taskDescription = `Send email: ${step.subject || 'Untitled'}`;
            taskTitle = step.subject || undefined;
          } else if (step.type === 'call') {
            taskDescription = 'Make a call';
          } else if (step.type === 'linkedin_connect') {
            taskDescription = 'Send LinkedIn connection request';
            taskMessage = step.content || undefined;
          } else if (step.type === 'linkedin_message') {
            taskDescription = 'Send LinkedIn message';
            taskMessage = step.content || undefined;
          } else {
            taskDescription = step.content || 'Complete custom task';
          }

          let finalScheduledTime: string;
          let finalTimezone: string;

          if (step.step_order === 1 && step.start_immediately) {
            finalScheduledTime = enrollmentTime;
            finalTimezone = 'UTC';
          } else if (step.has_specific_time && step.send_time) {
            finalScheduledTime = step.send_time;
            finalTimezone = step.timezone || 'UTC';
          } else {
            finalScheduledTime = step1ResolvedTime;
            finalTimezone = step1ResolvedTimezone;
          }

          tasksToCreate.push({
            type: step.type,
            contact_id: contactId,
            salesplay_id: salesPlayId,
            step_id: step.id,
            description: taskDescription,
            title: taskTitle || null,
            message: taskMessage || null,
            due_date: dueDateStr,
            scheduled_time: finalScheduledTime,
            timezone: finalTimezone,
            completed: false,
            user_id: user.user.id
          });
        }
      }

      if (tasksToCreate.length > 0) {
        const { error: tasksError } = await supabase
          .from('tasks')
          .insert(tasksToCreate);

        if (tasksError) {
          console.error('Failed to create tasks:', tasksError);
          throw tasksError;
        }
      }
    }
  },

  async getContactsInSalesPlay(salesPlayId: string): Promise<any[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve([]);
    }

    const { data, error } = await supabase
      .from('salesplay_contacts')
      .select(`
        *,
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone,
          title,
          linkedin_url,
          accounts (
            id,
            name
          )
        )
      `)
      .eq('salesplay_id', salesPlayId)
      .order('added_at', { ascending: false });

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      status: item.status,
      addedAt: item.added_at,
      pausedAt: item.paused_at,
      contact: {
        id: item.contacts.id,
        firstName: item.contacts.first_name,
        lastName: item.contacts.last_name,
        email: item.contacts.email,
        phone: item.contacts.phone,
        title: item.contacts.title,
        linkedinUrl: item.contacts.linkedin_url,
        accountName: item.contacts.accounts?.name
      }
    }));
  },

  async removeContactFromSalesPlay(salesPlayContactId: string): Promise<void> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve();
    }

    const { error } = await supabase
      .from('salesplay_contacts')
      .delete()
      .eq('id', salesPlayContactId);

    if (error) throw error;
  },

  async pauseSalesPlayForContact(salesPlayContactId: string): Promise<void> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve();
    }

    const { error } = await supabase
      .from('salesplay_contacts')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString()
      })
      .eq('id', salesPlayContactId);

    if (error) throw error;
  },

  async resumeSalesPlayForContact(salesPlayContactId: string): Promise<void> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve();
    }

    const { error } = await supabase
      .from('salesplay_contacts')
      .update({
        status: 'active',
        paused_at: null
      })
      .eq('id', salesPlayContactId);

    if (error) throw error;
  },

  async getSalesPlayContacts(salesPlayId: string): Promise<any[]> {
    if (demoModeState.isDemoMode) {
      return [];
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('salesplay_contacts')
      .select('*')
      .eq('salesplay_id', salesPlayId)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(sc => ({
      id: sc.id,
      salesPlayId: sc.salesplay_id,
      contactId: sc.contact_id,
      status: sc.status,
      startedAt: sc.started_at,
      completedAt: sc.completed_at,
      pausedAt: sc.paused_at,
      createdAt: sc.created_at
    }));
  },

  async updateStatus(salesPlayId: string, status: 'active' | 'paused' | 'completed' | 'cancelled'): Promise<void> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve();
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('salesplays')
      .update({ status })
      .eq('id', salesPlayId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  },

  async getSalesPlaysByContactId(contactId: string): Promise<SalesPlay[]> {
    if (demoModeState.isDemoMode) {
      return Promise.resolve([]);
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('salesplay_contacts')
      .select(`
        salesplays (
          *,
          salesplay_steps (*)
        )
      `)
      .eq('contact_id', contactId)
      .eq('status', 'active')
      .eq('user_id', user.user.id);

    if (error) throw error;

    return data
      .filter(item => item.salesplays)
      .map(item => {
        const salesplay = item.salesplays as any;
        return {
          id: salesplay.id,
          name: salesplay.name,
          description: salesplay.description,
          status: salesplay.status as SalesPlay['status'],
          emailCount: salesplay.email_count,
          contactCount: salesplay.contact_count,
          emailsSent: salesplay.emails_sent,
          emailsOpened: salesplay.emails_opened,
          replies: salesplay.replies,
          callAttempts: salesplay.call_attempts,
          callConnects: salesplay.call_connects,
          linkedinActivities: salesplay.linkedin_activities || 0,
          createdAt: salesplay.created_at.split('T')[0],
          completedAt: salesplay.completed_at?.split('T')[0],
          steps: (salesplay.salesplay_steps || [])
            .sort((a: any, b: any) => a.step_order - b.step_order)
            .map((step: any) => ({
              id: step.id,
              type: step.type,
              subject: step.subject,
              content: step.content,
              delayDays: step.delay_days,
              scheduledTime: step.send_time,
              completed: step.completed,
              completedAt: step.completed_at?.split('T')[0]
            }))
        };
      });
  }
};