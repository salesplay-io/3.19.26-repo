/*
  # Create Templates Table

  1. New Tables
    - `templates`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, template name)
      - `type` (text, template type: email, call, or messaging)
      - `subject` (text, optional, for email templates)
      - `content` (text, template content)
      - `category` (text, custom category for organization)
      - `usage_count` (integer, tracks how many times template was used)
      - `last_used` (timestamptz, last time template was used)
      - `is_deleted` (boolean, soft delete flag)
      - `deleted_at` (timestamptz, when template was deleted)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `templates` table
    - Add policy for users to manage their own templates
*/

-- Create template_type enum
DO $$ BEGIN
  CREATE TYPE template_type AS ENUM ('email', 'call', 'messaging');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type template_type NOT NULL,
  subject text,
  content text NOT NULL,
  category text NOT NULL,
  usage_count integer DEFAULT 0,
  last_used timestamptz,
  is_deleted boolean DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND is_deleted = false);

CREATE POLICY "Users can insert own templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates(user_id);
CREATE INDEX IF NOT EXISTS templates_type_idx ON templates(type);
CREATE INDEX IF NOT EXISTS templates_is_deleted_idx ON templates(is_deleted);