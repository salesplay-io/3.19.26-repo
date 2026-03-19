/*
  # Remove All Seeded Demo Data from Database

  1. Purpose
    - Remove all seeded demo data from the database
    - Users start with a completely clean slate
    - Demo data remains available via frontend mock data when Demo Mode is enabled

  2. What Gets Removed
    - All outbound activities
    - All tasks
    - All call logs
    - All salesplay contacts
    - All contact list members
    - All contact lists
    - All call sheets
    - All salesplay steps
    - All salesplays
    - All contacts
    - All accounts

  3. Important Notes
    - This only removes data from the database tables
    - Mock data in mockData.ts remains available for demo mode
    - Users start with empty tables and add their own data
*/

DO $$
BEGIN
  -- Delete all outbound activities
  DELETE FROM outbound_activities;
  RAISE NOTICE 'Deleted all outbound activities';

  -- Delete all tasks
  DELETE FROM tasks;
  RAISE NOTICE 'Deleted all tasks';

  -- Delete all call logs
  DELETE FROM call_logs;
  RAISE NOTICE 'Deleted all call logs';

  -- Delete all salesplay contacts
  DELETE FROM salesplay_contacts;
  RAISE NOTICE 'Deleted all salesplay contacts';

  -- Delete all contact list members
  DELETE FROM contact_list_members;
  RAISE NOTICE 'Deleted all contact list members';

  -- Delete all contact lists
  DELETE FROM contact_lists;
  RAISE NOTICE 'Deleted all contact lists';

  -- Delete all call sheets
  DELETE FROM call_sheets;
  RAISE NOTICE 'Deleted all call sheets';

  -- Delete all salesplay steps
  DELETE FROM salesplay_steps;
  RAISE NOTICE 'Deleted all salesplay steps';

  -- Delete all salesplays
  DELETE FROM salesplays;
  RAISE NOTICE 'Deleted all salesplays';

  -- Delete all contacts
  DELETE FROM contacts;
  RAISE NOTICE 'Deleted all contacts';

  -- Delete all accounts
  DELETE FROM accounts;
  RAISE NOTICE 'Deleted all accounts';

  RAISE NOTICE 'Successfully removed all seeded demo data from database';
END $$;