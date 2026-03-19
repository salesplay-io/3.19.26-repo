/*
  # Create email provider cache table

  1. New Tables
    - `email_provider_cache`
      - `domain` (text, primary key) - The email domain (e.g., salesplay.io)
      - `provider` (text) - The detected provider (google, microsoft, yahoo, zoho, protonmail, unknown)
      - `auth_type` (text) - The authentication type (oauth, smtp)
      - `mx_records` (jsonb) - The MX records used for detection
      - `detected_at` (timestamptz) - When the detection occurred
      - `expires_at` (timestamptz) - Cache expiration (24 hours from detection)

  2. Security
    - Enable RLS on `email_provider_cache` table
    - Add service role only policy (this table is managed by edge functions)
*/

CREATE TABLE IF NOT EXISTS email_provider_cache (
  domain text PRIMARY KEY,
  provider text NOT NULL,
  auth_type text NOT NULL,
  mx_records jsonb,
  detected_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

ALTER TABLE email_provider_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" 
  ON email_provider_cache
  USING (auth.role() = 'service_role');
