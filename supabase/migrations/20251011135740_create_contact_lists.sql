/*
  # Create Contact Lists Feature

  1. New Tables
    - `contact_lists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, required)
      - `description` (text, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `contact_list_members`
      - `id` (uuid, primary key)
      - `contact_list_id` (uuid, references contact_lists)
      - `contact_id` (uuid, references contacts)
      - `added_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own lists
    - Add policies for list members access
*/

-- Create contact_lists table
CREATE TABLE IF NOT EXISTS contact_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contact_list_members table
CREATE TABLE IF NOT EXISTS contact_list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_list_id uuid REFERENCES contact_lists(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(contact_list_id, contact_id)
);

-- Enable RLS
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_list_members ENABLE ROW LEVEL SECURITY;

-- Policies for contact_lists
CREATE POLICY "Users can view own contact lists"
  ON contact_lists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own contact lists"
  ON contact_lists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contact lists"
  ON contact_lists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contact lists"
  ON contact_lists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for contact_list_members
CREATE POLICY "Users can view members of own contact lists"
  ON contact_list_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contact_lists
      WHERE contact_lists.id = contact_list_members.contact_list_id
      AND contact_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add members to own contact lists"
  ON contact_list_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_lists
      WHERE contact_lists.id = contact_list_members.contact_list_id
      AND contact_lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove members from own contact lists"
  ON contact_list_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contact_lists
      WHERE contact_lists.id = contact_list_members.contact_list_id
      AND contact_lists.user_id = auth.uid()
    )
  );

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_lists_user_id ON contact_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_list_members_list_id ON contact_list_members(contact_list_id);
CREATE INDEX IF NOT EXISTS idx_contact_list_members_contact_id ON contact_list_members(contact_id);