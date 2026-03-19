import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailProviderResult {
  provider: string;
  domain: string;
  authType: string;
  source: 'known' | 'cache' | 'dns' | 'error';
}

interface MXRecord {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface CloudflareDNSResponse {
  Status: number;
  Answer?: MXRecord[];
}

const KNOWN_DOMAINS: Record<string, { provider: string; authType: string }> = {
  'gmail.com': { provider: 'google', authType: 'oauth' },
  'googlemail.com': { provider: 'google', authType: 'oauth' },
  'outlook.com': { provider: 'microsoft', authType: 'oauth' },
  'hotmail.com': { provider: 'microsoft', authType: 'oauth' },
  'live.com': { provider: 'microsoft', authType: 'oauth' },
  'msn.com': { provider: 'microsoft', authType: 'oauth' },
  'outlook.co.uk': { provider: 'microsoft', authType: 'oauth' },
  'hotmail.co.uk': { provider: 'microsoft', authType: 'oauth' },
  'yahoo.com': { provider: 'yahoo', authType: 'oauth' },
  'yahoo.co.uk': { provider: 'yahoo', authType: 'oauth' },
  'ymail.com': { provider: 'yahoo', authType: 'oauth' },
};

const MX_PATTERNS = [
  { pattern: /google\.com$/i, provider: 'google', authType: 'oauth' },
  { pattern: /googlemail\.com$/i, provider: 'google', authType: 'oauth' },
  { pattern: /outlook\.com$/i, provider: 'microsoft', authType: 'oauth' },
  { pattern: /protection\.outlook\.com$/i, provider: 'microsoft', authType: 'oauth' },
  { pattern: /yahoo\.com$/i, provider: 'yahoo', authType: 'oauth' },
  { pattern: /yahoodns\.net$/i, provider: 'yahoo', authType: 'oauth' },
  { pattern: /zoho\.com$/i, provider: 'zoho', authType: 'smtp' },
  { pattern: /zohomail\.com$/i, provider: 'zoho', authType: 'smtp' },
  { pattern: /protonmail\.ch$/i, provider: 'protonmail', authType: 'smtp' },
  { pattern: /proton\.me$/i, provider: 'protonmail', authType: 'smtp' },
];

async function queryMXRecords(domain: string): Promise<string[]> {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/dns-json',
      },
    });

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.status}`);
    }

    const data: CloudflareDNSResponse = await response.json();

    if (data.Status !== 0 || !data.Answer || data.Answer.length === 0) {
      return [];
    }

    return data.Answer.map(record => {
      const parts = record.data.split(' ');
      return parts[parts.length - 1].toLowerCase().replace(/\.$/, '');
    });
  } catch (error) {
    console.error('MX query error:', error);
    return [];
  }
}

function detectProviderFromMX(mxRecords: string[]): { provider: string; authType: string } {
  for (const mx of mxRecords) {
    for (const { pattern, provider, authType } of MX_PATTERNS) {
      if (pattern.test(mx)) {
        return { provider, authType };
      }
    }
  }

  return { provider: 'unknown', authType: 'smtp' };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({
          provider: 'unknown',
          domain: '',
          authType: 'smtp',
          source: 'error',
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const domain = email.split('@')[1].toLowerCase();

    if (KNOWN_DOMAINS[domain]) {
      const result: EmailProviderResult = {
        provider: KNOWN_DOMAINS[domain].provider,
        domain,
        authType: KNOWN_DOMAINS[domain].authType,
        source: 'known',
      };

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: cached } = await supabase
      .from('email_provider_cache')
      .select('*')
      .eq('domain', domain)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached) {
      const result: EmailProviderResult = {
        provider: cached.provider,
        domain,
        authType: cached.auth_type,
        source: 'cache',
      };

      return new Response(
        JSON.stringify(result),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const mxRecords = await queryMXRecords(domain);
    console.log(`MX records for ${domain}:`, mxRecords);

    const { provider, authType } = detectProviderFromMX(mxRecords);
    console.log(`Detected provider for ${domain}: ${provider} (${authType})`);

    await supabase
      .from('email_provider_cache')
      .upsert({
        domain,
        provider,
        auth_type: authType,
        mx_records: mxRecords,
        detected_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    const result: EmailProviderResult = {
      provider,
      domain,
      authType,
      source: 'dns',
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error detecting email provider:', error);

    return new Response(
      JSON.stringify({
        provider: 'unknown',
        domain: '',
        authType: 'smtp',
        source: 'error',
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
