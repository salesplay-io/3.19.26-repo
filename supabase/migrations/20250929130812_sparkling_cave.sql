/*
  # Create contacts table

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `first_name` (text, required)
      - `last_name` (text, required)
      - `email` (text, required, unique per user)
      - `phone` (text, optional)
      - `title` (text, optional)
      - `account_id` (uuid, foreign key to accounts)
      - `last_contacted` (date, optional)
      - `active_salesplay_id` (uuid, optional)
      - `completed_salesplays` (text array, default empty)
      - `linkedin_url` (text, optional)
      - `contact_groups` (text array, default empty)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on `contacts` table
    - Add policy for authenticated users to manage their own contacts
*/

CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  title text,
  account_id uuid REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  last_contacted date,
  active_salesplay_id uuid,
  completed_salesplays text[] DEFAULT '{}',
  linkedin_url text,
  contact_groups text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own contacts"
  ON contacts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create unique constraint on email per user
CREATE UNIQUE INDEX IF NOT EXISTS contacts_email_user_unique 
  ON contacts(email, user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();