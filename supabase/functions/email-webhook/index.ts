import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailWebhookPayload {
  messageId: string;
  threadId?: string;
  from: string;
  to: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: string;
  inReplyTo?: string;
  references?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: EmailWebhookPayload = await req.json();

    // Find the email account that matches the recipient
    const { data: emailAccount, error: accountError } = await supabase
      .from('email_accounts')
      .select('id, user_id, email_address')
      .eq('email_address', payload.to)
      .eq('is_active', true)
      .maybeSingle();

    if (accountError || !emailAccount) {
      console.error('Email account not found:', accountError);
      return new Response(
        JSON.stringify({ error: 'Email account not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Find contact by email address
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, salesplay_ids')
      .eq('email', payload.from)
      .eq('user_id', emailAccount.user_id)
      .maybeSingle();

    // Determine if this is a reply to a previous email
    let isReply = false;
    let parentMessageId = null;
    let salesplayId = null;

    if (payload.inReplyTo || (payload.references && payload.references.length > 0)) {
      isReply = true;
      parentMessageId = payload.inReplyTo || payload.references?.[0] || null;

      // Find the original message
      const { data: parentEmail } = await supabase
        .from('email_sync_logs')
        .select('salesplay_id, contact_id')
        .eq('message_id', parentMessageId)
        .eq('user_id', emailAccount.user_id)
        .maybeSingle();

      if (parentEmail) {
        salesplayId = parentEmail.salesplay_id;
      }
    }

    // If we still don't have a salesplay_id, try to get it from contact
    if (!salesplayId && contact?.salesplay_ids && contact.salesplay_ids.length > 0) {
      salesplayId = contact.salesplay_ids[0];
    }

    const bodyPreview = (payload.bodyText || payload.bodyHtml || '')
      .replace(/<[^>]*>/g, '')
      .substring(0, 500);

    // Check if this message already exists
    const { data: existingMessage } = await supabase
      .from('email_sync_logs')
      .select('id')
      .eq('message_id', payload.messageId)
      .eq('email_account_id', emailAccount.id)
      .maybeSingle();

    if (existingMessage) {
      return new Response(
        JSON.stringify({ message: 'Email already synced', id: existingMessage.id }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Store the email in email_sync_logs
    const { data: syncLog, error: syncError } = await supabase
      .from('email_sync_logs')
      .insert({
        email_account_id: emailAccount.id,
        user_id: emailAccount.user_id,
        message_id: payload.messageId,
        thread_id: payload.threadId || null,
        contact_id: contact?.id || null,
        salesplay_id: salesplayId || null,
        direction: 'received',
        from_email: payload.from,
        to_email: payload.to,
        subject: payload.subject || '(No subject)',
        body_preview: bodyPreview,
        body_html: payload.bodyHtml || null,
        body_text: payload.bodyText || null,
        received_at: payload.receivedAt,
        is_reply: isReply,
        parent_message_id: parentMessageId,
      })
      .select()
      .single();

    if (syncError) {
      console.error('Error storing email:', syncError);
      throw syncError;
    }

    // If this is a reply and we have a contact, create a lead
    if (isReply && contact) {
      const { error: leadError } = await supabase
        .from('leads')
        .insert({
          contact_id: contact.id,
          salesplay_id: salesplayId || null,
          status: 'new',
          source: 'email_reply',
          response_preview: bodyPreview,
          user_id: emailAccount.user_id,
        });

      if (leadError) {
        console.error('Error creating lead:', leadError);
      }
    }

    // Update last_sync_at on email account
    await supabase
      .from('email_accounts')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', emailAccount.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        syncLogId: syncLog.id,
        isReply,
        contactId: contact?.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Email webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});