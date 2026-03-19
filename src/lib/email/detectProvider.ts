import { supabase } from '../supabase';

export interface EmailProviderDetection {
  provider: string;
  domain: string;
  authType: 'oauth' | 'smtp';
  source?: 'known' | 'cache' | 'dns' | 'error';
}

export async function detectEmailProvider(email: string): Promise<EmailProviderDetection> {
  try {
    if (!email || !email.includes('@')) {
      return {
        provider: 'unknown',
        domain: '',
        authType: 'smtp',
        source: 'error',
      };
    }

    const domain = email.split('@')[1].toLowerCase();

    const { data, error } = await supabase.functions.invoke('detect-email-provider', {
      body: { email },
    });

    if (error) {
      console.error('Error detecting email provider:', error);
      return {
        provider: 'unknown',
        domain,
        authType: 'smtp',
        source: 'error',
      };
    }

    return {
      provider: data.provider || 'unknown',
      domain: data.domain || domain,
      authType: data.authType || 'smtp',
      source: data.source,
    };
  } catch (error) {
    console.error('Error detecting email provider:', error);
    const domain = email.includes('@') ? email.split('@')[1].toLowerCase() : '';
    return {
      provider: 'unknown',
      domain,
      authType: 'smtp',
      source: 'error',
    };
  }
}
