-- Run this SQL in your Supabase SQL Editor to fix the "Add User" functionality
-- This updates the trigger to handle user metadata and ensures RLS policies work correctly

-- Update the handle_new_user function to use user metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count integer;
  first_name_val text;
  last_name_val text;
BEGIN
  -- Count existing users
  SELECT COUNT(*) INTO user_count FROM user_profiles;

  -- Extract first_name and last_name from user metadata if available
  first_name_val := NEW.raw_user_meta_data->>'firstName';
  last_name_val := NEW.raw_user_meta_data->>'lastName';

  -- Insert new user profile
  INSERT INTO user_profiles (id, email, first_name, last_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    first_name_val,
    last_name_val,
    user_count = 0  -- First user is admin
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
