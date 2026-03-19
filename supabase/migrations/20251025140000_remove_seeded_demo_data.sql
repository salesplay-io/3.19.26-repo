/*
  # Remove Seeded Demo Data from Database

  1. Purpose
    - Remove all seeded demo data (accounts, contacts, contact lists) from the database
    - This data was automatically seeded for all users by previous migrations
    - Demo data will still be available via frontend mock data when users toggle "Demo Mode"

  2. What Gets Removed
    - All contact list members
    - All contact lists
    - All contacts
    - All accounts

  3. Important Notes
    - This only removes data from the database
    - Mock data in the frontend (mockData.ts) remains available for demo mode
    - Users can still toggle Demo Mode to see sample data
    - This cleanup helps users start with a clean slate in production mode
*/

DO $$
BEGIN
  -- Delete all contact list members first (due to foreign key constraints)
  DELETE FROM contact_list_members;
  RAISE NOTICE 'Deleted all contact list members';

  -- Delete all contact lists
  DELETE FROM contact_lists;
  RAISE NOTICE 'Deleted all contact lists';

  -- Delete all contacts
  DELETE FROM contacts;
  RAISE NOTICE 'Deleted all contacts';

  -- Delete all accounts
  DELETE FROM accounts;
  RAISE NOTICE 'Deleted all accounts';

  RAISE NOTICE 'Successfully removed all seeded demo data from database';
END $$;
