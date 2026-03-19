/*
  # Create Email Sync Logs Table

  1. New Tables
    - `email_sync_logs`
      - `id` (uuid, primary key)
      - `email_account_id` (uuid, references email_accounts)
      - `user_id` (uuid, references auth.users)
      - `message_id` (text, unique email message ID)
      - `thread_id` (text, email thread ID)
      - `contact_id` (uuid, references contacts)
      - `salesplay_id` (uuid, references salesplays)
      - `lead_id` (uuid, references leads)
      - `direction` (text, 'sent' or 'received')
      - `from_email` (text, sender email)
      - `to_email` (text, recipient email)
      - `subject` (text, email subject)
      - `body_preview` (text, first 500 chars of email)
      - `body_html` (text, full HTML body)
      - `body_text` (text, plain text body)
      - `received_at` (timestamptz, when email was received/sent)
      - `synced_at` (timestamptz, when it was synced to our system)
      - `is_reply` (boolean, is this a reply to our email)
      - `parent_message_id` (text, ID of message being replied to)
      - `metadata` (jsonb, additional email metadata)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `email_sync_logs` table
    - Add policy for users to view their own email sync logs

  3. Important Notes
    - Track both sent and received emails
    - Link emails to contacts, salesplays, and leads
    - Store email content for reference
    - Use message_id for deduplication
*/

CREATE TABLE IF NOT EXISTS email_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id uuid REFERENCES email_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_id text NOT NULL,
  thread_id text,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  salesplay_id uuid REFERENCES salesplays(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  direction text NOT NULL CHECK (direction IN ('sent', 'received')),
  from_email text NOT NULL,
  to_email text NOT NULL,
  subject text,
  body_preview text,
  body_html text,
  body_text text,
  received_at timestamptz NOT NULL,
  synced_at timestamptz DEFAULT now(),
  is_reply boolean DEFAULT false,
  parent_message_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email sync logs"
  ON email_sync_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email sync logs"
  ON email_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email sync logs"
  ON email_sync_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_sync_logs_user_id ON email_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_logs_message_id ON email_sync_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_logs_contact_id ON email_sync_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_logs_salesplay_id ON email_sync_logs(salesplay_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_logs_direction ON email_sync_logs(user_id, direction);
CREATE INDEX IF NOT EXISTS idx_email_sync_logs_is_reply ON email_sync_logs(user_id, is_reply);
CREATE INDEX IF NOT EXISTS idx_email_sync_logs_received_at ON email_sync_logs(received_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_sync_logs_unique_message 
  ON email_sync_logs(email_account_id, message_id);
