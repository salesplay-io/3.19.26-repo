import { supabase } from '../lib/supabase';

export interface EmailAccount {
  id: string;
  userId: string;
  emailAddress: string;
  provider: 'gmail' | 'outlook' | 'smtp' | 'imap';
  providerAccountId?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  imapHost?: string;
  imapPort?: number;
  isActive: boolean;
  lastSyncAt?: string;
  syncEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSyncLog {
  id: string;
  emailAccountId: string;
  userId: string;
  messageId: string;
  threadId?: string;
  contactId?: string;
  salesplayId?: string;
  leadId?: string;
  direction: 'sent' | 'received';
  fromEmail: string;
  toEmail: string;
  subject?: string;
  bodyPreview?: string;
  bodyHtml?: string;
  bodyText?: string;
  receivedAt: string;
  syncedAt: string;
  isReply: boolean;
  parentMessageId?: string;
  metadata?: any;
  createdAt: string;
}

export const emailAccountsService = {
  async getAll(): Promise<EmailAccount[]> {
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(account => ({
      id: account.id,
      userId: account.user_id,
      emailAddress: account.email_address,
      provider: account.provider as EmailAccount['provider'],
      providerAccountId: account.provider_account_id || undefined,
      smtpHost: account.smtp_host || undefined,
      smtpPort: account.smtp_port || undefined,
      smtpUsername: account.smtp_username || undefined,
      imapHost: account.imap_host || undefined,
      imapPort: account.imap_port || undefined,
      isActive: account.is_active,
      lastSyncAt: account.last_sync_at || undefined,
      syncEnabled: account.sync_enabled,
      createdAt: account.created_at,
      updatedAt: account.updated_at
    }));
  },

  async getActive(): Promise<EmailAccount | null> {
    const { data, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      emailAddress: data.email_address,
      provider: data.provider as EmailAccount['provider'],
      providerAccountId: data.provider_account_id || undefined,
      smtpHost: data.smtp_host || undefined,
      smtpPort: data.smtp_port || undefined,
      smtpUsername: data.smtp_username || undefined,
      imapHost: data.imap_host || undefined,
      imapPort: data.imap_port || undefined,
      isActive: data.is_active,
      lastSyncAt: data.last_sync_at || undefined,
      syncEnabled: data.sync_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async create(account: Omit<EmailAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<EmailAccount> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: existingActive } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (existingActive && account.isActive) {
      await supabase
        .from('email_accounts')
        .update({ is_active: false })
        .eq('id', existingActive.id);
    }

    const { data, error } = await supabase
      .from('email_accounts')
      .insert({
        user_id: user.user.id,
        email_address: account.emailAddress,
        provider: account.provider,
        provider_account_id: account.providerAccountId || null,
        smtp_host: account.smtpHost || null,
        smtp_port: account.smtpPort || null,
        smtp_username: account.smtpUsername || null,
        imap_host: account.imapHost || null,
        imap_port: account.imapPort || null,
        is_active: account.isActive,
        sync_enabled: account.syncEnabled
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      userId: data.user_id,
      emailAddress: data.email_address,
      provider: data.provider as EmailAccount['provider'],
      providerAccountId: data.provider_account_id || undefined,
      smtpHost: data.smtp_host || undefined,
      smtpPort: data.smtp_port || undefined,
      smtpUsername: data.smtp_username || undefined,
      imapHost: data.imap_host || undefined,
      imapPort: data.imap_port || undefined,
      isActive: data.is_active,
      lastSyncAt: data.last_sync_at || undefined,
      syncEnabled: data.sync_enabled,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async setActive(id: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    await supabase
      .from('email_accounts')
      .update({ is_active: false })
      .eq('user_id', user.user.id)
      .eq('is_active', true);

    const { error } = await supabase
      .from('email_accounts')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getReceivedEmails(contactId?: string): Promise<EmailSyncLog[]> {
    let query = supabase
      .from('email_sync_logs')
      .select('*')
      .eq('direction', 'received')
      .order('received_at', { ascending: false });

    if (contactId) {
      query = query.eq('contact_id', contactId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data.map(log => ({
      id: log.id,
      emailAccountId: log.email_account_id,
      userId: log.user_id,
      messageId: log.message_id,
      threadId: log.thread_id || undefined,
      contactId: log.contact_id || undefined,
      salesplayId: log.salesplay_id || undefined,
      leadId: log.lead_id || undefined,
      direction: log.direction as 'sent' | 'received',
      fromEmail: log.from_email,
      toEmail: log.to_email,
      subject: log.subject || undefined,
      bodyPreview: log.body_preview || undefined,
      bodyHtml: log.body_html || undefined,
      bodyText: log.body_text || undefined,
      receivedAt: log.received_at,
      syncedAt: log.synced_at,
      isReply: log.is_reply,
      parentMessageId: log.parent_message_id || undefined,
      metadata: log.metadata || undefined,
      createdAt: log.created_at
    }));
  },

  async getReplies(): Promise<EmailSyncLog[]> {
    const { data, error } = await supabase
      .from('email_sync_logs')
      .select('*')
      .eq('direction', 'received')
      .eq('is_reply', true)
      .order('received_at', { ascending: false });

    if (error) throw error;

    return data.map(log => ({
      id: log.id,
      emailAccountId: log.email_account_id,
      userId: log.user_id,
      messageId: log.message_id,
      threadId: log.thread_id || undefined,
      contactId: log.contact_id || undefined,
      salesplayId: log.salesplay_id || undefined,
      leadId: log.lead_id || undefined,
      direction: log.direction as 'sent' | 'received',
      fromEmail: log.from_email,
      toEmail: log.to_email,
      subject: log.subject || undefined,
      bodyPreview: log.body_preview || undefined,
      bodyHtml: log.body_html || undefined,
      bodyText: log.body_text || undefined,
      receivedAt: log.received_at,
      syncedAt: log.synced_at,
      isReply: log.is_reply,
      parentMessageId: log.parent_message_id || undefined,
      metadata: log.metadata || undefined,
      createdAt: log.created_at
    }));
  }
};
