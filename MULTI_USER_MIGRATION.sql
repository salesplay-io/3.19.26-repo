/*
  # Add Multi-User Account Organization Support

  ## Overview
  This migration adds support for multiple users to share an account organization.
  Users within the same account_id can share contacts and accounts data, while
  keeping salesplays, tasks, contact lists, and templates private to each user.

  ## What is Shared:
  - Contacts (all users in organization can view/edit)
  - Accounts (all users in organization can view/edit)
  - Outbound Activities (all users in organization can view, only creator can edit)

  ## What is Private (user-specific):
  - Salesplays (only the user who created them)
  - Tasks (only the user who created them)
  - Contact Lists (only the user who created them)
  - Templates (only the user who created them)
  - Call Sheets (only the user who created them)
  - Leads (only the user who created them)
  - Call Logs (only the user who created them)

  ## Instructions:
  Run this migration in your Supabase SQL Editor or via the Supabase CLI
*/

-- 1. Create account_organizations table
CREATE TABLE IF NOT EXISTS account_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE account_organizations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own account organization
CREATE POLICY "Users can view own account organization"
  ON account_organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.account_organization_id = account_organizations.id
      AND user_profiles.id = auth.uid()
    )
  );

-- 2. Add account_organization_id to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'account_organization_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN account_organization_id uuid REFERENCES account_organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Migrate existing users to have their own account organizations
DO $$
DECLARE
  user_record RECORD;
  new_org_id uuid;
BEGIN
  FOR user_record IN SELECT id, email FROM user_profiles WHERE account_organization_id IS NULL
  LOOP
    -- Create a new organization for each existing user
    INSERT INTO account_organizations (name)
    VALUES (COALESCE(user_record.email, 'Organization'))
    RETURNING id INTO new_org_id;

    -- Assign the user to the new organization
    UPDATE user_profiles
    SET account_organization_id = new_org_id
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- 4. Update handle_new_user function to create account organization
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count integer;
  new_org_id uuid;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM user_profiles;

  -- Create a new account organization for the user
  INSERT INTO account_organizations (name)
  VALUES (COALESCE(NEW.email, 'Organization'))
  RETURNING id INTO new_org_id;

  -- Insert new user profile
  INSERT INTO user_profiles (id, email, is_admin, account_organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    user_count = 0,  -- First user is admin
    new_org_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create helper function to get user's account organization ID
CREATE OR REPLACE FUNCTION get_user_account_org_id()
RETURNS uuid AS $$
  SELECT account_organization_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 6. Update RLS policies for accounts table (shared within account organization)
DROP POLICY IF EXISTS "Users can manage their own accounts" ON accounts;

CREATE POLICY "Users can view accounts in their organization"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE account_organization_id = get_user_account_org_id()
    )
  );

CREATE POLICY "Users can insert accounts in their organization"
  ON accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update accounts in their organization"
  ON accounts
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE account_organization_id = get_user_account_org_id()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE account_organization_id = get_user_account_org_id()
    )
  );

CREATE POLICY "Users can delete accounts in their organization"
  ON accounts
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE account_organization_id = get_user_account_org_id()
    )
  );

-- 7. Update RLS policies for contacts table (shared within account organization)
DROP POLICY IF EXISTS "Users can manage their own contacts" ON contacts;

CREATE POLICY "Users can view contacts in their organization"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE account_organization_id = get_user_account_org_id()
    )
  );

CREATE POLICY "Users can insert contacts in their organization"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update contacts in their organization"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE account_organization_id = get_user_account_org_id()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE account_organization_id = get_user_account_org_id()
    )
  );

CREATE POLICY "Users can delete contacts in their organization"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE account_organization_id = get_user_account_org_id()
    )
  );

-- 8. Update RLS policies for outbound_activities (viewable by organization, but user-specific creation)
DROP POLICY IF EXISTS "Users can view their own outbound activities" ON outbound_activities;
DROP POLICY IF EXISTS "Users can insert their own outbound activities" ON outbound_activities;
DROP POLICY IF EXISTS "Users can update their own outbound activities" ON outbound_activities;
DROP POLICY IF EXISTS "Users can delete their own outbound activities" ON outbound_activities;

CREATE POLICY "Users can view outbound activities in their organization"
  ON outbound_activities
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE account_organization_id = get_user_account_org_id()
    )
  );

CREATE POLICY "Users can insert their own outbound activities"
  ON outbound_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outbound activities"
  ON outbound_activities
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outbound activities"
  ON outbound_activities
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 9. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_org_id ON user_profiles(account_organization_id);

-- 10. Update trigger for account_organizations updated_at
CREATE TRIGGER update_account_organizations_updated_at
  BEFORE UPDATE ON account_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
