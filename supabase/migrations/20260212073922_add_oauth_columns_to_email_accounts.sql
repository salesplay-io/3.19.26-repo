/*
  # Add OAuth columns to email_accounts table
  
  1. Changes
    - Rename existing OAuth columns to match standard naming
    - access_token → oauth_access_token
    - refresh_token → oauth_refresh_token
    - token_expiry → oauth_token_expires_at
    
  2. Notes
    - These columns are used for OAuth-based email integrations (Gmail, Microsoft)
    - Columns are nullable to support both OAuth and SMTP/IMAP authentication
*/

DO $$ 
BEGIN
  -- Rename access_token to oauth_access_token
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_accounts' AND column_name = 'access_token'
  ) THEN
    ALTER TABLE email_accounts RENAME COLUMN access_token TO oauth_access_token;
  END IF;

  -- Rename refresh_token to oauth_refresh_token
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_accounts' AND column_name = 'refresh_token'
  ) THEN
    ALTER TABLE email_accounts RENAME COLUMN refresh_token TO oauth_refresh_token;
  END IF;

  -- Rename token_expiry to oauth_token_expires_at
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_accounts' AND column_name = 'token_expiry'
  ) THEN
    ALTER TABLE email_accounts RENAME COLUMN token_expiry TO oauth_token_expires_at;
  END IF;
END $$;
