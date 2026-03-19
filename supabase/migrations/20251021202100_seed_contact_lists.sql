/*
  # Seed Contact Lists with Members

  1. Purpose
    - Create sample contact lists for demo/testing purposes
    - Populate lists with 10-20 contacts each
    - Lists represent common use cases (Target Accounts, Key Decision Makers, etc.)

  2. Contact Lists Created
    - "Enterprise Target Accounts" (15 contacts)
    - "Healthcare Decision Makers" (18 contacts)
    - "Technology Leaders" (12 contacts)
    - "Q1 Outreach Pipeline" (20 contacts)
    - "High Priority Prospects" (14 contacts)

  3. Notes
    - This migration seeds data only if the user has existing contacts
    - Uses DO block to dynamically insert based on current user's contacts
*/

-- Function to seed contact lists for a user
CREATE OR REPLACE FUNCTION seed_contact_lists_for_user(target_user_id uuid)
RETURNS void AS $$
DECLARE
  list_id_1 uuid;
  list_id_2 uuid;
  list_id_3 uuid;
  list_id_4 uuid;
  list_id_5 uuid;
  contact_ids uuid[];
BEGIN
  -- Get existing contact IDs for this user
  SELECT ARRAY_AGG(id) INTO contact_ids
  FROM contacts
  WHERE user_id = target_user_id
  LIMIT 100;

  -- Only proceed if user has contacts
  IF array_length(contact_ids, 1) > 0 THEN

    -- Create Enterprise Target Accounts list
    INSERT INTO contact_lists (user_id, name, description)
    VALUES (
      target_user_id,
      'Enterprise Target Accounts',
      'Large enterprise companies we are targeting for Q4 outreach'
    )
    RETURNING id INTO list_id_1;

    -- Add 15 contacts to Enterprise Target Accounts
    INSERT INTO contact_list_members (contact_list_id, contact_id)
    SELECT list_id_1, unnest(contact_ids[1:LEAST(15, array_length(contact_ids, 1))]);

    -- Create Healthcare Decision Makers list
    INSERT INTO contact_lists (user_id, name, description)
    VALUES (
      target_user_id,
      'Healthcare Decision Makers',
      'Key decision makers in healthcare organizations'
    )
    RETURNING id INTO list_id_2;

    -- Add 18 contacts to Healthcare Decision Makers
    INSERT INTO contact_list_members (contact_list_id, contact_id)
    SELECT list_id_2, unnest(contact_ids[5:LEAST(22, array_length(contact_ids, 1))]);

    -- Create Technology Leaders list
    INSERT INTO contact_lists (user_id, name, description)
    VALUES (
      target_user_id,
      'Technology Leaders',
      'CTOs, VPs of Engineering, and IT Directors'
    )
    RETURNING id INTO list_id_3;

    -- Add 12 contacts to Technology Leaders
    INSERT INTO contact_list_members (contact_list_id, contact_id)
    SELECT list_id_3, unnest(contact_ids[10:LEAST(21, array_length(contact_ids, 1))]);

    -- Create Q1 Outreach Pipeline list
    INSERT INTO contact_lists (user_id, name, description)
    VALUES (
      target_user_id,
      'Q1 Outreach Pipeline',
      'Contacts scheduled for Q1 2026 outreach campaigns'
    )
    RETURNING id INTO list_id_4;

    -- Add 20 contacts to Q1 Outreach Pipeline
    INSERT INTO contact_list_members (contact_list_id, contact_id)
    SELECT list_id_4, unnest(contact_ids[15:LEAST(34, array_length(contact_ids, 1))]);

    -- Create High Priority Prospects list
    INSERT INTO contact_lists (user_id, name, description)
    VALUES (
      target_user_id,
      'High Priority Prospects',
      'Warm leads and high-value opportunities requiring immediate attention'
    )
    RETURNING id INTO list_id_5;

    -- Add 14 contacts to High Priority Prospects
    INSERT INTO contact_list_members (contact_list_id, contact_id)
    SELECT list_id_5, unnest(contact_ids[25:LEAST(38, array_length(contact_ids, 1))]);

  END IF;
END;
$$ LANGUAGE plpgsql;

-- Note: This function can be called manually for any user
-- Example: SELECT seed_contact_lists_for_user(auth.uid());
