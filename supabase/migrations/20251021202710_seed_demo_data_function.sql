/*
  # Create Function to Seed Demo Data

  1. Purpose
    - Function to create sample accounts, contacts, and contact lists
    - Can be called by authenticated users to populate demo data
    - Creates 20 accounts, 60 contacts, and 5 contact lists with 10-20 members each

  2. Usage
    - Call: SELECT seed_demo_data();
    - Safe to run multiple times (uses INSERT with conflict handling)

  3. Data Created
    - 20 accounts across various industries
    - 60 contacts distributed across accounts
    - 5 contact lists with proper member counts
*/

CREATE OR REPLACE FUNCTION seed_demo_data()
RETURNS text AS $$
DECLARE
  current_user_id uuid;
  acc_ids uuid[];
  contact_ids uuid[];
  list_id_1 uuid;
  list_id_2 uuid;
  list_id_3 uuid;
  list_id_4 uuid;
  list_id_5 uuid;
  result_text text;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 'Error: No authenticated user found';
  END IF;

  -- Create 20 Accounts
  WITH inserted_accounts AS (
    INSERT INTO accounts (user_id, name, industry, location, company_size, website)
    VALUES
      (current_user_id, 'TechCorp Solutions', 'Technology', 'San Francisco, CA', '1000-5000', 'techcorp.com'),
      (current_user_id, 'HealthFirst Medical', 'Healthcare', 'Boston, MA', '500-1000', 'healthfirst.com'),
      (current_user_id, 'FinanceHub Inc', 'Finance', 'New York, NY', '5000+', 'financehub.com'),
      (current_user_id, 'EduTech Systems', 'Education', 'Austin, TX', '100-500', 'edutech.com'),
      (current_user_id, 'RetailMax Group', 'Retail', 'Chicago, IL', '1000-5000', 'retailmax.com'),
      (current_user_id, 'ManufacturePro', 'Manufacturing', 'Detroit, MI', '500-1000', 'manufacturepro.com'),
      (current_user_id, 'CloudServe Inc', 'Technology', 'Seattle, WA', '100-500', 'cloudserve.com'),
      (current_user_id, 'MedTech Innovations', 'Healthcare', 'San Diego, CA', '500-1000', 'medtech.com'),
      (current_user_id, 'Global Investments', 'Finance', 'New York, NY', '1000-5000', 'globalinvest.com'),
      (current_user_id, 'Learning Platform Co', 'Education', 'Denver, CO', '100-500', 'learnplatform.com'),
      (current_user_id, 'EcommerceNow', 'Retail', 'Los Angeles, CA', '500-1000', 'ecommercenow.com'),
      (current_user_id, 'AutoParts Direct', 'Manufacturing', 'Cleveland, OH', '1000-5000', 'autoparts.com'),
      (current_user_id, 'DataCore Systems', 'Technology', 'Atlanta, GA', '500-1000', 'datacore.com'),
      (current_user_id, 'CareClinic Network', 'Healthcare', 'Phoenix, AZ', '100-500', 'careclinic.com'),
      (current_user_id, 'Investment Partners', 'Finance', 'Charlotte, NC', '500-1000', 'invpartners.com'),
      (current_user_id, 'SchoolTech Pro', 'Education', 'Portland, OR', '100-500', 'schooltech.com'),
      (current_user_id, 'Fashion Retail Co', 'Retail', 'Miami, FL', '1000-5000', 'fashionretail.com'),
      (current_user_id, 'Industrial Solutions', 'Manufacturing', 'Pittsburgh, PA', '500-1000', 'industrial.com'),
      (current_user_id, 'SoftwareDev Inc', 'Technology', 'Austin, TX', '100-500', 'softwaredev.com'),
      (current_user_id, 'Wellness Group', 'Healthcare', 'San Francisco, CA', '1000-5000', 'wellnessgroup.com')
    ON CONFLICT DO NOTHING
    RETURNING id
  )
  SELECT ARRAY_AGG(id) INTO acc_ids FROM inserted_accounts;

  -- If no accounts were inserted (already exist), get existing ones
  IF acc_ids IS NULL OR array_length(acc_ids, 1) IS NULL THEN
    SELECT ARRAY_AGG(id) INTO acc_ids FROM accounts WHERE user_id = current_user_id ORDER BY created_at LIMIT 20;
  END IF;

  -- Create 60 Contacts
  WITH contact_data AS (
    SELECT 
      current_user_id as user_id,
      acc_ids[((row_num - 1) % COALESCE(array_length(acc_ids, 1), 1)) + 1] as account_id,
      first_name,
      last_name,
      lower(first_name || '.' || last_name || '@example.com') as email,
      phone,
      title,
      row_num
    FROM (VALUES
      (1, 'Sarah', 'Johnson', '555-0101', 'CEO'),
      (2, 'Michael', 'Chen', '555-0102', 'CTO'),
      (3, 'Emily', 'Rodriguez', '555-0103', 'VP of Sales'),
      (4, 'David', 'Thompson', '555-0104', 'VP of Engineering'),
      (5, 'Jessica', 'Martinez', '555-0105', 'CMO'),
      (6, 'James', 'Anderson', '555-0106', 'CFO'),
      (7, 'Lisa', 'Taylor', '555-0107', 'Director of Operations'),
      (8, 'Robert', 'Garcia', '555-0108', 'Head of Product'),
      (9, 'Amanda', 'Wilson', '555-0109', 'VP of Marketing'),
      (10, 'Christopher', 'Moore', '555-0110', 'IT Director'),
      (11, 'Jennifer', 'Brown', '555-0111', 'Sales Director'),
      (12, 'Daniel', 'Davis', '555-0112', 'Engineering Manager'),
      (13, 'Michelle', 'Miller', '555-0113', 'Product Manager'),
      (14, 'Matthew', 'Wilson', '555-0114', 'Business Development'),
      (15, 'Ashley', 'Thomas', '555-0115', 'Account Executive'),
      (16, 'Joshua', 'Jackson', '555-0116', 'Senior Engineer'),
      (17, 'Stephanie', 'White', '555-0117', 'Marketing Manager'),
      (18, 'Andrew', 'Harris', '555-0118', 'Sales Manager'),
      (19, 'Rachel', 'Martin', '555-0119', 'HR Director'),
      (20, 'Kevin', 'Thompson', '555-0120', 'Operations Manager'),
      (21, 'Lauren', 'Garcia', '555-0121', 'VP of Customer Success'),
      (22, 'Brian', 'Martinez', '555-0122', 'Chief Revenue Officer'),
      (23, 'Nicole', 'Robinson', '555-0123', 'VP of Finance'),
      (24, 'Ryan', 'Clark', '555-0124', 'Director of Engineering'),
      (25, 'Megan', 'Rodriguez', '555-0125', 'Marketing Director'),
      (26, 'Justin', 'Lewis', '555-0126', 'Product Director'),
      (27, 'Brittany', 'Lee', '555-0127', 'Customer Success Manager'),
      (28, 'Tyler', 'Walker', '555-0128', 'Senior Sales Executive'),
      (29, 'Amber', 'Hall', '555-0129', 'Business Analyst'),
      (30, 'Brandon', 'Allen', '555-0130', 'Technical Lead'),
      (31, 'Samantha', 'Young', '555-0131', 'VP of Business Development'),
      (32, 'Jonathan', 'King', '555-0132', 'Chief Operating Officer'),
      (33, 'Melissa', 'Wright', '555-0133', 'VP of Human Resources'),
      (34, 'Eric', 'Lopez', '555-0134', 'Director of Sales'),
      (35, 'Christina', 'Hill', '555-0135', 'Engineering Director'),
      (36, 'Nathan', 'Scott', '555-0136', 'Chief Marketing Officer'),
      (37, 'Heather', 'Green', '555-0137', 'VP of Product'),
      (38, 'Adam', 'Adams', '555-0138', 'Senior Account Manager'),
      (39, 'Kimberly', 'Baker', '555-0139', 'Operations Director'),
      (40, 'Jason', 'Gonzalez', '555-0140', 'IT Manager'),
      (41, 'Rebecca', 'Nelson', '555-0141', 'Sales Team Lead'),
      (42, 'Gregory', 'Carter', '555-0142', 'Software Architect'),
      (43, 'Sara', 'Mitchell', '555-0143', 'Marketing Coordinator'),
      (44, 'Timothy', 'Perez', '555-0144', 'Regional Sales Manager'),
      (45, 'Angela', 'Roberts', '555-0145', 'HR Manager'),
      (46, 'Steven', 'Turner', '555-0146', 'DevOps Manager'),
      (47, 'Lindsey', 'Phillips', '555-0147', 'Customer Success Director'),
      (48, 'Mark', 'Campbell', '555-0148', 'VP of Strategy'),
      (49, 'Amy', 'Parker', '555-0149', 'Finance Manager'),
      (50, 'Patrick', 'Evans', '555-0150', 'Sales Operations Manager'),
      (51, 'Katherine', 'Edwards', '555-0151', 'Product Marketing Manager'),
      (52, 'Sean', 'Collins', '555-0152', 'Engineering Lead'),
      (53, 'Courtney', 'Stewart', '555-0153', 'Account Manager'),
      (54, 'Benjamin', 'Sanchez', '555-0154', 'Technical Director'),
      (55, 'Danielle', 'Morris', '555-0155', 'Business Development Manager'),
      (56, 'Alexander', 'Rogers', '555-0156', 'Senior Product Manager'),
      (57, 'Erin', 'Reed', '555-0157', 'VP of Technology'),
      (58, 'Jordan', 'Cook', '555-0158', 'Chief Technology Officer'),
      (59, 'Taylor', 'Morgan', '555-0159', 'Director of Marketing'),
      (60, 'Cameron', 'Bell', '555-0160', 'Senior Business Analyst')
    ) AS contacts_raw(row_num, first_name, last_name, phone, title)
  ),
  inserted_contacts AS (
    INSERT INTO contacts (user_id, account_id, first_name, last_name, email, phone, title)
    SELECT user_id, account_id, first_name, last_name, email, phone, title
    FROM contact_data
    ON CONFLICT (email, user_id) DO NOTHING
    RETURNING id
  )
  SELECT ARRAY_AGG(id) INTO contact_ids FROM inserted_contacts;

  -- If no contacts were inserted, get existing ones
  IF contact_ids IS NULL OR array_length(contact_ids, 1) IS NULL THEN
    SELECT ARRAY_AGG(id) INTO contact_ids FROM contacts WHERE user_id = current_user_id ORDER BY created_at LIMIT 60;
  END IF;

  -- Create Contact Lists
  INSERT INTO contact_lists (user_id, name, description)
  VALUES (current_user_id, 'Enterprise Target Accounts', 'Large enterprise companies we are targeting for Q4 outreach')
  ON CONFLICT DO NOTHING
  RETURNING id INTO list_id_1;

  IF list_id_1 IS NULL THEN
    SELECT id INTO list_id_1 FROM contact_lists WHERE user_id = current_user_id AND name = 'Enterprise Target Accounts';
  END IF;

  INSERT INTO contact_list_members (contact_list_id, contact_id)
  SELECT list_id_1, unnest(contact_ids[1:LEAST(15, array_length(contact_ids, 1))])
  ON CONFLICT DO NOTHING;

  INSERT INTO contact_lists (user_id, name, description)
  VALUES (current_user_id, 'Healthcare Decision Makers', 'Key decision makers in healthcare organizations')
  ON CONFLICT DO NOTHING
  RETURNING id INTO list_id_2;

  IF list_id_2 IS NULL THEN
    SELECT id INTO list_id_2 FROM contact_lists WHERE user_id = current_user_id AND name = 'Healthcare Decision Makers';
  END IF;

  INSERT INTO contact_list_members (contact_list_id, contact_id)
  SELECT list_id_2, unnest(contact_ids[8:LEAST(25, array_length(contact_ids, 1))])
  ON CONFLICT DO NOTHING;

  INSERT INTO contact_lists (user_id, name, description)
  VALUES (current_user_id, 'Technology Leaders', 'CTOs, VPs of Engineering, and IT Directors')
  ON CONFLICT DO NOTHING
  RETURNING id INTO list_id_3;

  IF list_id_3 IS NULL THEN
    SELECT id INTO list_id_3 FROM contact_lists WHERE user_id = current_user_id AND name = 'Technology Leaders';
  END IF;

  INSERT INTO contact_list_members (contact_list_id, contact_id)
  SELECT list_id_3, unnest(contact_ids[15:LEAST(26, array_length(contact_ids, 1))])
  ON CONFLICT DO NOTHING;

  INSERT INTO contact_lists (user_id, name, description)
  VALUES (current_user_id, 'Q1 Outreach Pipeline', 'Contacts scheduled for Q1 2026 outreach campaigns')
  ON CONFLICT DO NOTHING
  RETURNING id INTO list_id_4;

  IF list_id_4 IS NULL THEN
    SELECT id INTO list_id_4 FROM contact_lists WHERE user_id = current_user_id AND name = 'Q1 Outreach Pipeline';
  END IF;

  INSERT INTO contact_list_members (contact_list_id, contact_id)
  SELECT list_id_4, unnest(contact_ids[25:LEAST(44, array_length(contact_ids, 1))])
  ON CONFLICT DO NOTHING;

  INSERT INTO contact_lists (user_id, name, description)
  VALUES (current_user_id, 'High Priority Prospects', 'Warm leads and high-value opportunities requiring immediate attention')
  ON CONFLICT DO NOTHING
  RETURNING id INTO list_id_5;

  IF list_id_5 IS NULL THEN
    SELECT id INTO list_id_5 FROM contact_lists WHERE user_id = current_user_id AND name = 'High Priority Prospects';
  END IF;

  INSERT INTO contact_list_members (contact_list_id, contact_id)
  SELECT list_id_5, unnest(contact_ids[40:LEAST(53, array_length(contact_ids, 1))])
  ON CONFLICT DO NOTHING;

  result_text := 'Successfully seeded: ' || 
                 COALESCE(array_length(acc_ids, 1), 0)::text || ' accounts, ' ||
                 COALESCE(array_length(contact_ids, 1), 0)::text || ' contacts, and 5 contact lists';
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;