/*
  # Create salesplay_contacts join table

  1. New Tables
    - `salesplay_contacts`
      - `id` (uuid, primary key)
      - `salesplay_id` (uuid, foreign key to salesplays)
      - `contact_id` (uuid, foreign key to contacts)
      - `status` (text, either 'active' or 'paused')
      - `added_at` (timestamptz)
      - `paused_at` (timestamptz, nullable)
      - `user_id` (uuid, foreign key to auth.users)
  
  2. Security
    - Enable RLS on `salesplay_contacts` table
    - Add policy for authenticated users to read their own salesplay contacts
    - Add policy for authenticated users to insert their own salesplay contacts
    - Add policy for authenticated users to update their own salesplay contacts
    - Add policy for authenticated users to delete their own salesplay contacts
  
  3. Indexes
    - Index on salesplay_id for faster lookups
    - Index on contact_id for faster lookups
    - Unique constraint on (salesplay_id, contact_id) to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS salesplay_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesplay_id uuid NOT NULL REFERENCES salesplays(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  added_at timestamptz DEFAULT now(),
  paused_at timestamptz,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(salesplay_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_salesplay_contacts_salesplay_id ON salesplay_contacts(salesplay_id);
CREATE INDEX IF NOT EXISTS idx_salesplay_contacts_contact_id ON salesplay_contacts(contact_id);

ALTER TABLE salesplay_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own salesplay contacts"
  ON salesplay_contacts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own salesplay contacts"
  ON salesplay_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salesplay contacts"
  ON salesplay_contacts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salesplay contacts"
  ON salesplay_contacts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);