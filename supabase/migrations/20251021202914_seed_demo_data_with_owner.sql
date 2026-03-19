/*
  # Seed Demo Data with Owner Field

  1. Purpose
    - Seed accounts, contacts, and contact lists for demo user
    - Creates 20 accounts, 60 contacts, and 5 contact lists with 10-20 members

  2. Data Created
    - 20 accounts across various industries
    - 60 contacts with proper distribution
    - 5 contact lists with 10-20 contacts each

  3. Notes
    - Includes required owner field for accounts
    - Safe to run multiple times
*/

DO $$
DECLARE
  demo_user_id uuid;
  acc_ids uuid[] := ARRAY[]::uuid[];
  contact_ids uuid[] := ARRAY[]::uuid[];
  temp_id uuid;
  list_id_1 uuid;
  list_id_2 uuid;
  list_id_3 uuid;
  list_id_4 uuid;
  list_id_5 uuid;
BEGIN
  -- Get the first user (demo user)
  SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'No user found, skipping seed';
    RETURN;
  END IF;

  -- Create 20 Accounts with owner field
  INSERT INTO accounts (user_id, name, industry, location, company_size, website, owner)
  VALUES
    (demo_user_id, 'TechCorp Solutions', 'Technology', 'San Francisco, CA', '1000-5000', 'techcorp.com', 'Demo User'),
    (demo_user_id, 'HealthFirst Medical', 'Healthcare', 'Boston, MA', '500-1000', 'healthfirst.com', 'Demo User'),
    (demo_user_id, 'FinanceHub Inc', 'Finance', 'New York, NY', '5000+', 'financehub.com', 'Demo User'),
    (demo_user_id, 'EduTech Systems', 'Education', 'Austin, TX', '100-500', 'edutech.com', 'Demo User'),
    (demo_user_id, 'RetailMax Group', 'Retail', 'Chicago, IL', '1000-5000', 'retailmax.com', 'Demo User'),
    (demo_user_id, 'ManufacturePro', 'Manufacturing', 'Detroit, MI', '500-1000', 'manufacturepro.com', 'Demo User'),
    (demo_user_id, 'CloudServe Inc', 'Technology', 'Seattle, WA', '100-500', 'cloudserve.com', 'Demo User'),
    (demo_user_id, 'MedTech Innovations', 'Healthcare', 'San Diego, CA', '500-1000', 'medtech.com', 'Demo User'),
    (demo_user_id, 'Global Investments', 'Finance', 'New York, NY', '1000-5000', 'globalinvest.com', 'Demo User'),
    (demo_user_id, 'Learning Platform Co', 'Education', 'Denver, CO', '100-500', 'learnplatform.com', 'Demo User'),
    (demo_user_id, 'EcommerceNow', 'Retail', 'Los Angeles, CA', '500-1000', 'ecommercenow.com', 'Demo User'),
    (demo_user_id, 'AutoParts Direct', 'Manufacturing', 'Cleveland, OH', '1000-5000', 'autoparts.com', 'Demo User'),
    (demo_user_id, 'DataCore Systems', 'Technology', 'Atlanta, GA', '500-1000', 'datacore.com', 'Demo User'),
    (demo_user_id, 'CareClinic Network', 'Healthcare', 'Phoenix, AZ', '100-500', 'careclinic.com', 'Demo User'),
    (demo_user_id, 'Investment Partners', 'Finance', 'Charlotte, NC', '500-1000', 'invpartners.com', 'Demo User'),
    (demo_user_id, 'SchoolTech Pro', 'Education', 'Portland, OR', '100-500', 'schooltech.com', 'Demo User'),
    (demo_user_id, 'Fashion Retail Co', 'Retail', 'Miami, FL', '1000-5000', 'fashionretail.com', 'Demo User'),
    (demo_user_id, 'Industrial Solutions', 'Manufacturing', 'Pittsburgh, PA', '500-1000', 'industrial.com', 'Demo User'),
    (demo_user_id, 'SoftwareDev Inc', 'Technology', 'Austin, TX', '100-500', 'softwaredev.com', 'Demo User'),
    (demo_user_id, 'Wellness Group', 'Healthcare', 'San Francisco, CA', '1000-5000', 'wellnessgroup.com', 'Demo User')
  ON CONFLICT DO NOTHING;

  -- Get account IDs
  SELECT ARRAY_AGG(id ORDER BY created_at) INTO acc_ids 
  FROM accounts 
  WHERE user_id = demo_user_id 
  LIMIT 20;

  -- Create 60 Contacts (3 per account)
  FOR i IN 1..60 LOOP
    INSERT INTO contacts (user_id, account_id, first_name, last_name, email, phone, title)
    VALUES (
      demo_user_id,
      acc_ids[((i - 1) % 20) + 1],
      CASE i
        WHEN 1 THEN 'Sarah' WHEN 2 THEN 'Michael' WHEN 3 THEN 'Emily'
        WHEN 4 THEN 'David' WHEN 5 THEN 'Jessica' WHEN 6 THEN 'James'
        WHEN 7 THEN 'Lisa' WHEN 8 THEN 'Robert' WHEN 9 THEN 'Amanda'
        WHEN 10 THEN 'Christopher' WHEN 11 THEN 'Jennifer' WHEN 12 THEN 'Daniel'
        WHEN 13 THEN 'Michelle' WHEN 14 THEN 'Matthew' WHEN 15 THEN 'Ashley'
        WHEN 16 THEN 'Joshua' WHEN 17 THEN 'Stephanie' WHEN 18 THEN 'Andrew'
        WHEN 19 THEN 'Rachel' WHEN 20 THEN 'Kevin' WHEN 21 THEN 'Lauren'
        WHEN 22 THEN 'Brian' WHEN 23 THEN 'Nicole' WHEN 24 THEN 'Ryan'
        WHEN 25 THEN 'Megan' WHEN 26 THEN 'Justin' WHEN 27 THEN 'Brittany'
        WHEN 28 THEN 'Tyler' WHEN 29 THEN 'Amber' WHEN 30 THEN 'Brandon'
        WHEN 31 THEN 'Samantha' WHEN 32 THEN 'Jonathan' WHEN 33 THEN 'Melissa'
        WHEN 34 THEN 'Eric' WHEN 35 THEN 'Christina' WHEN 36 THEN 'Nathan'
        WHEN 37 THEN 'Heather' WHEN 38 THEN 'Adam' WHEN 39 THEN 'Kimberly'
        WHEN 40 THEN 'Jason' WHEN 41 THEN 'Rebecca' WHEN 42 THEN 'Gregory'
        WHEN 43 THEN 'Sara' WHEN 44 THEN 'Timothy' WHEN 45 THEN 'Angela'
        WHEN 46 THEN 'Steven' WHEN 47 THEN 'Lindsey' WHEN 48 THEN 'Mark'
        WHEN 49 THEN 'Amy' WHEN 50 THEN 'Patrick' WHEN 51 THEN 'Katherine'
        WHEN 52 THEN 'Sean' WHEN 53 THEN 'Courtney' WHEN 54 THEN 'Benjamin'
        WHEN 55 THEN 'Danielle' WHEN 56 THEN 'Alexander' WHEN 57 THEN 'Erin'
        WHEN 58 THEN 'Jordan' WHEN 59 THEN 'Taylor' ELSE 'Cameron'
      END,
      CASE i
        WHEN 1 THEN 'Johnson' WHEN 2 THEN 'Chen' WHEN 3 THEN 'Rodriguez'
        WHEN 4 THEN 'Thompson' WHEN 5 THEN 'Martinez' WHEN 6 THEN 'Anderson'
        WHEN 7 THEN 'Taylor' WHEN 8 THEN 'Garcia' WHEN 9 THEN 'Wilson'
        WHEN 10 THEN 'Moore' WHEN 11 THEN 'Brown' WHEN 12 THEN 'Davis'
        WHEN 13 THEN 'Miller' WHEN 14 THEN 'Wilson' WHEN 15 THEN 'Thomas'
        WHEN 16 THEN 'Jackson' WHEN 17 THEN 'White' WHEN 18 THEN 'Harris'
        WHEN 19 THEN 'Martin' WHEN 20 THEN 'Thompson' WHEN 21 THEN 'Garcia'
        WHEN 22 THEN 'Martinez' WHEN 23 THEN 'Robinson' WHEN 24 THEN 'Clark'
        WHEN 25 THEN 'Rodriguez' WHEN 26 THEN 'Lewis' WHEN 27 THEN 'Lee'
        WHEN 28 THEN 'Walker' WHEN 29 THEN 'Hall' WHEN 30 THEN 'Allen'
        WHEN 31 THEN 'Young' WHEN 32 THEN 'King' WHEN 33 THEN 'Wright'
        WHEN 34 THEN 'Lopez' WHEN 35 THEN 'Hill' WHEN 36 THEN 'Scott'
        WHEN 37 THEN 'Green' WHEN 38 THEN 'Adams' WHEN 39 THEN 'Baker'
        WHEN 40 THEN 'Gonzalez' WHEN 41 THEN 'Nelson' WHEN 42 THEN 'Carter'
        WHEN 43 THEN 'Mitchell' WHEN 44 THEN 'Perez' WHEN 45 THEN 'Roberts'
        WHEN 46 THEN 'Turner' WHEN 47 THEN 'Phillips' WHEN 48 THEN 'Campbell'
        WHEN 49 THEN 'Parker' WHEN 50 THEN 'Evans' WHEN 51 THEN 'Edwards'
        WHEN 52 THEN 'Collins' WHEN 53 THEN 'Stewart' WHEN 54 THEN 'Sanchez'
        WHEN 55 THEN 'Morris' WHEN 56 THEN 'Rogers' WHEN 57 THEN 'Reed'
        WHEN 58 THEN 'Cook' WHEN 59 THEN 'Morgan' ELSE 'Bell'
      END,
      'contact' || i || '@example.com',
      '555-01' || LPAD(i::text, 2, '0'),
      CASE (i % 10)
        WHEN 1 THEN 'CEO' WHEN 2 THEN 'CTO' WHEN 3 THEN 'VP of Sales'
        WHEN 4 THEN 'VP of Engineering' WHEN 5 THEN 'CMO' WHEN 6 THEN 'CFO'
        WHEN 7 THEN 'Director of Operations' WHEN 8 THEN 'Head of Product'
        WHEN 9 THEN 'VP of Marketing' ELSE 'IT Director'
      END
    )
    ON CONFLICT (email, user_id) DO NOTHING
    RETURNING id INTO temp_id;
    
    IF temp_id IS NOT NULL THEN
      contact_ids := array_append(contact_ids, temp_id);
    END IF;
  END LOOP;

  -- If no new contacts were created, get existing ones
  IF array_length(contact_ids, 1) IS NULL OR array_length(contact_ids, 1) = 0 THEN
    SELECT ARRAY_AGG(id ORDER BY created_at) INTO contact_ids 
    FROM contacts 
    WHERE user_id = demo_user_id 
    LIMIT 60;
  END IF;

  -- Create Contact List 1: Enterprise Target Accounts (15 contacts)
  INSERT INTO contact_lists (user_id, name, description)
  VALUES (demo_user_id, 'Enterprise Target Accounts', 'Large enterprise companies we are targeting for Q4 outreach')
  ON CONFLICT DO NOTHING
  RETURNING id INTO list_id_1;

  IF list_id_1 IS NULL THEN
    SELECT id INTO list_id_1 FROM contact_lists 
    WHERE user_id = demo_user_id AND name = 'Enterprise Target Accounts';
  END IF;

  IF list_id_1 IS NOT NULL THEN
    DELETE FROM contact_list_members WHERE contact_list_id = list_id_1;
    FOR i IN 1..LEAST(15, array_length(contact_ids, 1)) LOOP
      INSERT INTO contact_list_members (contact_list_id, contact_id)
      VALUES (list_id_1, contact_ids[i])
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Create Contact List 2: Healthcare Decision Makers (18 contacts)
  INSERT INTO contact_lists (user_id, name, description)
  VALUES (demo_user_id, 'Healthcare Decision Makers', 'Key decision makers in healthcare organizations')
  ON CONFLICT DO NOTHING
  RETURNING id INTO list_id_2;

  IF list_id_2 IS NULL THEN
    SELECT id INTO list_id_2 FROM contact_lists 
    WHERE user_id = demo_user_id AND name = 'Healthcare Decision Makers';
  END IF;

  IF list_id_2 IS NOT NULL THEN
    DELETE FROM contact_list_members WHERE contact_list_id = list_id_2;
    FOR i IN 8..LEAST(25, array_length(contact_ids, 1)) LOOP
      INSERT INTO contact_list_members (contact_list_id, contact_id)
      VALUES (list_id_2, contact_ids[i])
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Create Contact List 3: Technology Leaders (12 contacts)
  INSERT INTO contact_lists (user_id, name, description)
  VALUES (demo_user_id, 'Technology Leaders', 'CTOs, VPs of Engineering, and IT Directors')
  ON CONFLICT DO NOTHING
  RETURNING id INTO list_id_3;

  IF list_id_3 IS NULL THEN
    SELECT id INTO list_id_3 FROM contact_lists 
    WHERE user_id = demo_user_id AND name = 'Technology Leaders';
  END IF;

  IF list_id_3 IS NOT NULL THEN
    DELETE FROM contact_list_members WHERE contact_list_id = list_id_3;
    FOR i IN 15..LEAST(26, array_length(contact_ids, 1)) LOOP
      INSERT INTO contact_list_members (contact_list_id, contact_id)
      VALUES (list_id_3, contact_ids[i])
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Create Contact List 4: Q1 Outreach Pipeline (20 contacts)
  INSERT INTO contact_lists (user_id, name, description)
  VALUES (demo_user_id, 'Q1 Outreach Pipeline', 'Contacts scheduled for Q1 2026 outreach campaigns')
  ON CONFLICT DO NOTHING
  RETURNING id INTO list_id_4;

  IF list_id_4 IS NULL THEN
    SELECT id INTO list_id_4 FROM contact_lists 
    WHERE user_id = demo_user_id AND name = 'Q1 Outreach Pipeline';
  END IF;

  IF list_id_4 IS NOT NULL THEN
    DELETE FROM contact_list_members WHERE contact_list_id = list_id_4;
    FOR i IN 25..LEAST(44, array_length(contact_ids, 1)) LOOP
      INSERT INTO contact_list_members (contact_list_id, contact_id)
      VALUES (list_id_4, contact_ids[i])
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- Create Contact List 5: High Priority Prospects (14 contacts)
  INSERT INTO contact_lists (user_id, name, description)
  VALUES (demo_user_id, 'High Priority Prospects', 'Warm leads and high-value opportunities requiring immediate attention')
  ON CONFLICT DO NOTHING
  RETURNING id INTO list_id_5;

  IF list_id_5 IS NULL THEN
    SELECT id INTO list_id_5 FROM contact_lists 
    WHERE user_id = demo_user_id AND name = 'High Priority Prospects';
  END IF;

  IF list_id_5 IS NOT NULL THEN
    DELETE FROM contact_list_members WHERE contact_list_id = list_id_5;
    FOR i IN 40..LEAST(53, array_length(contact_ids, 1)) LOOP
      INSERT INTO contact_list_members (contact_list_id, contact_id)
      VALUES (list_id_5, contact_ids[i])
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RAISE NOTICE 'Seeded % contacts and 5 contact lists', array_length(contact_ids, 1);
END $$;