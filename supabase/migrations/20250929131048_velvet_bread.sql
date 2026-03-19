/*
  # Create helper functions for account contact count management

  1. Functions
    - `increment_account_contact_count` - Increments contact count when contact is added
    - `decrement_account_contact_count` - Decrements contact count when contact is removed

  2. Security
    - Functions are security definer and check user permissions
*/

CREATE OR REPLACE FUNCTION increment_account_contact_count(account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE accounts 
  SET contact_count = contact_count + 1,
      updated_at = now()
  WHERE id = account_id 
    AND user_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION decrement_account_contact_count(account_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE accounts 
  SET contact_count = GREATEST(contact_count - 1, 0),
      updated_at = now()
  WHERE id = account_id 
    AND user_id = auth.uid();
END;
$$;