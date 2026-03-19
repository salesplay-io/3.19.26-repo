import { createClient } from 'npm:@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SendEmailRequest {
  to: string;
  subject: string;
  content?: string; // Alias for bodyText/bodyHtml
  bodyText?: string;
  bodyHtml?: string;
  contactId?: string;
  contactName?: string;
  salesplayId?: string;
  threadId?: string;
  inReplyTo?: string;
  userId?: string; // For service role authentication
  emailAccountId?: string; // Optional specific email account
}

async function refreshGoogleToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

async function refreshMicrosoftToken(refreshToken: string, clientId: string, clientSecret: string): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://graph.microsoft.com/Mail.Send offline_access',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

async function sendViaGmailAPI(
  emailAccount: any,
  to: string,
  subject: string,
  bodyText: string | undefined,
  bodyHtml: string | undefined,
  headers: Record<string, string>,
  supabase: any
) {
  let accessToken = emailAccount.oauth_access_token;

  if (emailAccount.oauth_token_expires_at && new Date(emailAccount.oauth_token_expires_at) < new Date()) {
    console.log('Access token expired, refreshing...');

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret || !emailAccount.oauth_refresh_token) {
      throw new Error('Missing OAuth credentials for token refresh');
    }

    const tokenData = await refreshGoogleToken(emailAccount.oauth_refresh_token, clientId, clientSecret);
    accessToken = tokenData.access_token;

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    await supabase
      .from('email_accounts')
      .update({
        oauth_access_token: accessToken,
        oauth_token_expires_at: expiresAt,
      })
      .eq('id', emailAccount.id);

    console.log('Token refreshed successfully');
  }

  const raw = createMimeMessage(emailAccount.email_address, to, subject, bodyText, bodyHtml, headers);
  const utf8Bytes = new TextEncoder().encode(raw);
  let binaryStr = '';
  for (const byte of utf8Bytes) {
    binaryStr += String.fromCharCode(byte);
  }
  const encodedMessage = btoa(binaryStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gmail API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

async function sendViaOutlookAPI(
  emailAccount: any,
  to: string,
  subject: string,
  bodyText: string | undefined,
  bodyHtml: string | undefined,
  headers: Record<string, string>,
  supabase: any
) {
  let accessToken = emailAccount.oauth_access_token;

  if (emailAccount.oauth_token_expires_at && new Date(emailAccount.oauth_token_expires_at) < new Date()) {
    console.log('Access token expired, refreshing...');

    const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
    const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');

    if (!clientId || !clientSecret || !emailAccount.oauth_refresh_token) {
      throw new Error('Missing OAuth credentials for token refresh');
    }

    const tokenData = await refreshMicrosoftToken(emailAccount.oauth_refresh_token, clientId, clientSecret);
    accessToken = tokenData.access_token;

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    await supabase
      .from('email_accounts')
      .update({
        oauth_access_token: accessToken,
        oauth_token_expires_at: expiresAt,
      })
      .eq('id', emailAccount.id);

    console.log('Token refreshed successfully');
  }

  const message: Record<string, any> = {
    subject: subject,
    body: {
      contentType: bodyHtml ? 'HTML' : 'Text',
      content: bodyHtml || bodyText || ''
    },
    toRecipients: [
      {
        emailAddress: {
          address: to
        }
      }
    ],
  };

  if (headers['In-Reply-To']) {
    message.conversationId = headers['In-Reply-To'];
  }

  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Outlook API error: ${error}`);
  }

  return { success: true };
}

async function sendViaSMTP2Go(
  emailAccount: any,
  to: string,
  subject: string,
  bodyText: string | undefined,
  bodyHtml: string | undefined,
  headers: Record<string, string>
) {
  const response = await fetch(`https://api.smtp2go.com/v3/email/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: emailAccount.smtp_password,
      to: [to],
      sender: emailAccount.email_address,
      subject: subject,
      text_body: bodyText,
      html_body: bodyHtml,
      custom_headers: Object.entries(headers)
        .filter(([key]) => ['Message-ID', 'In-Reply-To', 'References'].includes(key))
        .map(([key, value]) => ({ header: key, value }))
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(`SMTP2Go error: ${result.error || JSON.stringify(result)}`);
  }

  return result;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function createMimeMessage(
  from: string,
  to: string,
  subject: string,
  bodyText: string | undefined,
  bodyHtml: string | undefined,
  headers: Record<string, string>
): string {
  const boundary = `boundary_${Date.now()}`;
  const parts: string[] = [];

  parts.push(`From: ${from}`);
  parts.push(`To: ${to}`);
  parts.push(`Subject: ${subject}`);

  Object.entries(headers).forEach(([key, value]) => {
    if (!['From', 'To', 'Subject'].includes(key)) {
      parts.push(`${key}: ${value}`);
    }
  });

  if (bodyText && bodyHtml) {
    parts.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    parts.push('');
    parts.push(`--${boundary}`);
    parts.push('Content-Type: text/plain; charset=UTF-8');
    parts.push('');
    parts.push(bodyText);
    parts.push('');
    parts.push(`--${boundary}`);
    parts.push('Content-Type: text/html; charset=UTF-8');
    parts.push('');
    parts.push(bodyHtml);
    parts.push('');
    parts.push(`--${boundary}--`);
  } else if (bodyHtml) {
    parts.push('Content-Type: text/html; charset=UTF-8');
    parts.push('');
    parts.push(bodyHtml);
  } else {
    parts.push('Content-Type: text/plain; charset=UTF-8');
    parts.push('');
    parts.push(bodyText || '');
  }

  return parts.join('\r\n');
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Try to authenticate as user first
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    const payload: SendEmailRequest = await req.json();

    // If user authentication failed, check if this is a service role call with userId in payload
    let userId: string;
    if (userError || !user) {
      // For service role calls (from cron jobs), userId must be in payload
      if (!payload.userId) {
        throw new Error('Invalid authentication');
      }
      userId = payload.userId;
    } else {
      userId = user.id;
    }

    if (!payload.to || !payload.subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if the salesplay is paused for this contact
    if (payload.contactId && payload.salesplayId) {
      const { data: salesplayContact, error: spError } = await supabase
        .from('salesplay_contacts')
        .select('status')
        .eq('salesplay_id', payload.salesplayId)
        .eq('contact_id', payload.contactId)
        .eq('user_id', userId)
        .maybeSingle();

      if (spError) {
        console.error('Error checking salesplay contact status:', spError);
      }

      if (salesplayContact && salesplayContact.status === 'paused') {
        return new Response(
          JSON.stringify({
            error: 'Cannot send email: SalesPlay is paused for this contact',
            code: 'SALESPLAY_PAUSED'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Get email account - use emailAccountId if provided, otherwise get active one
    let emailAccount;
    let accountError;

    if (payload.emailAccountId) {
      const result = await supabase
        .from('email_accounts')
        .select('*')
        .eq('id', payload.emailAccountId)
        .eq('user_id', userId)
        .maybeSingle();
      emailAccount = result.data;
      accountError = result.error;
    } else {
      const result = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();
      emailAccount = result.data;
      accountError = result.error;
    }

    if (accountError || !emailAccount) {
      return new Response(
        JSON.stringify({ 
          error: 'No active email account found. Please connect an email account in Settings.',
          code: 'NO_EMAIL_ACCOUNT'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const messageId = `<${crypto.randomUUID()}@${emailAccount.email_address.split('@')[1]}>`;

    let emailHeaders: Record<string, string> = {
      'Message-ID': messageId,
      'Date': new Date().toUTCString(),
      'From': emailAccount.email_address,
      'To': payload.to,
      'Subject': payload.subject,
    };

    if (payload.threadId) {
      emailHeaders['References'] = payload.threadId;
    }

    if (payload.inReplyTo) {
      emailHeaders['In-Reply-To'] = payload.inReplyTo;
      if (!payload.threadId) {
        emailHeaders['References'] = payload.inReplyTo;
      }
    }

    const rawContent = payload.bodyHtml || payload.content || null;
    const htmlContent = rawContent
      ? rawContent.replace(/\n/g, '<br>')
      : null;
    const bodyHtml = htmlContent
      ? `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#222;">${htmlContent}</div>`
      : undefined;
    const bodyText = payload.bodyText || (rawContent ? stripHtml(rawContent) : undefined);

    console.log('Attempting to send email:', {
      provider: emailAccount.provider,
      from: emailAccount.email_address,
      to: payload.to,
      hasOAuthToken: !!emailAccount.oauth_access_token,
      hasSmtpPassword: !!emailAccount.smtp_password,
    });

    let sendResult;

    if (emailAccount.provider === 'gmail' && emailAccount.oauth_access_token) {
      sendResult = await sendViaGmailAPI(emailAccount, payload.to, payload.subject, bodyText, bodyHtml, emailHeaders, supabase);
    } else if (emailAccount.provider === 'outlook' && emailAccount.oauth_access_token) {
      sendResult = await sendViaOutlookAPI(emailAccount, payload.to, payload.subject, bodyText, bodyHtml, emailHeaders, supabase);
    } else if (emailAccount.smtp_password) {
      sendResult = await sendViaSMTP2Go(emailAccount, payload.to, payload.subject, bodyText, bodyHtml, emailHeaders);
    } else {
      throw new Error(`No valid authentication method found for provider: ${emailAccount.provider}`);
    }

    console.log('Email sent successfully:', sendResult);

    const { data: syncLog, error: syncError } = await supabase
      .from('email_sync_logs')
      .insert({
        email_account_id: emailAccount.id,
        user_id: userId,
        message_id: messageId,
        thread_id: payload.threadId || null,
        contact_id: payload.contactId || null,
        salesplay_id: payload.salesplayId || null,
        direction: 'sent',
        from_email: emailAccount.email_address,
        to_email: payload.to,
        subject: payload.subject,
        body_preview: (bodyText || bodyHtml || '').replace(/<[^>]*>/g, '').substring(0, 500),
        body_html: bodyHtml || null,
        body_text: bodyText || null,
        received_at: new Date().toISOString(),
        is_reply: !!payload.inReplyTo,
        parent_message_id: payload.inReplyTo || null,
      })
      .select()
      .single();

    if (syncError) {
      console.error('Error logging sent email:', syncError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId,
        syncLogId: syncLog?.id,
        message: 'Email sent successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Send email error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send email' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});