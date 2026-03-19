/*
  # Add Email Account to SalesPlays

  ## Summary
  Fixes critical bug where all emails from different salesplays were being sent from the same
  (active) email account instead of the email account selected when creating each salesplay.

  ## Problem
  - User creates Salesplay A with email1
  - User creates Salesplay B with email2
  - All emails sent from email2 (whichever is marked is_active = true)
  - Emails from Salesplay A incorrectly sent from email2 instead of email1

  ## Solution
  Add `email_account_id` column to `salesplays` table to store which email account should be
  used for sending emails for this specific salesplay.

  ## Changes
  1. Add `email_account_id` column to `salesplays` table
  2. Add foreign key constraint to `email_accounts` table
  3. For existing salesplays, set email_account_id to user's active email account as default
*/

-- Add email_account_id column to salesplays table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'salesplays' AND column_name = 'email_account_id'
  ) THEN
    ALTER TABLE salesplays ADD COLUMN email_account_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'salesplays_email_account_id_fkey'
  ) THEN
    ALTER TABLE salesplays 
    ADD CONSTRAINT salesplays_email_account_id_fkey 
    FOREIGN KEY (email_account_id) 
    REFERENCES email_accounts(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- For existing salesplays without email_account_id, set to user's active email account
UPDATE salesplays sp
SET email_account_id = (
  SELECT id 
  FROM email_accounts ea
  WHERE ea.user_id = sp.user_id 
    AND ea.is_active = true
  LIMIT 1
)
WHERE sp.email_account_id IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_salesplays_email_account_id 
ON salesplays(email_account_id);
