/*
  # Create Email Accounts Table

  1. New Tables
    - `email_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email_address` (text, user's email)
      - `provider` (text, e.g., 'gmail', 'outlook', 'smtp')
      - `provider_account_id` (text, external account ID)
      - `access_token` (text, encrypted OAuth token)
      - `refresh_token` (text, encrypted OAuth refresh token)
      - `token_expires_at` (timestamptz, token expiration)
      - `smtp_host` (text, for SMTP connections)
      - `smtp_port` (integer, for SMTP connections)
      - `smtp_username` (text, for SMTP connections)
      - `smtp_password` (text, encrypted for SMTP)
      - `imap_host` (text, for IMAP connections)
      - `imap_port` (integer, for IMAP connections)
      - `is_active` (boolean, currently active account)
      - `last_sync_at` (timestamptz, last email sync time)
      - `sync_enabled` (boolean, auto-sync replies)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `email_accounts` table
    - Add policy for users to manage their own email accounts
    - Add policy for users to read their own email accounts

  3. Important Notes
    - Tokens and passwords should be encrypted at the application layer
    - Only one active email account per user at a time
    - Support for multiple providers (Gmail, Outlook, SMTP)
*/

CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_address text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('gmail', 'outlook', 'smtp', 'imap')),
  provider_account_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  smtp_host text,
  smtp_port integer,
  smtp_username text,
  smtp_password text,
  imap_host text,
  imap_port integer,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  sync_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email accounts"
  ON email_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email accounts"
  ON email_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email accounts"
  ON email_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own email accounts"
  ON email_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_is_active ON email_accounts(user_id, is_active);
