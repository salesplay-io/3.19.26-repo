/*
  # Create outbound_activities table

  1. New Tables
    - `outbound_activities`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key to contacts)
      - `salesplay_id` (uuid, foreign key to salesplays, optional)
      - `salesplay_step_id` (uuid, foreign key to salesplay_steps, optional)
      - `step_order` (integer, optional - the step number in the salesplay)
      - `activity_type` (enum: email_sent, email_received, call, linkedin_connect, linkedin_message, meeting)
      - `activity_date` (date, required)
      - `activity_time` (text, required)
      - `outcome` (text, optional - for calls: connected, voicemail, not_connected, bad_number, not_interested)
      - `subject` (text, optional - for emails)
      - `content` (text, optional - for emails and messages)
      - `duration` (text, optional - for calls and meetings)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on the table
    - Add policies for authenticated users to manage their own data
*/

-- Create enum type for activity types
DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM ('email_sent', 'email_received', 'call', 'linkedin_connect', 'linkedin_message', 'meeting');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create outbound_activities table
CREATE TABLE IF NOT EXISTS outbound_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  salesplay_id uuid REFERENCES salesplays(id) ON DELETE SET NULL,
  salesplay_step_id uuid REFERENCES salesplay_steps(id) ON DELETE SET NULL,
  step_order integer,
  activity_type activity_type NOT NULL,
  activity_date date NOT NULL,
  activity_time text NOT NULL,
  outcome text,
  subject text,
  content text,
  duration text,
  notes text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS
ALTER TABLE outbound_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own outbound activities"
  ON outbound_activities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_outbound_activities_contact_id ON outbound_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_outbound_activities_salesplay_id ON outbound_activities(salesplay_id);
CREATE INDEX IF NOT EXISTS idx_outbound_activities_activity_date ON outbound_activities(activity_date DESC);
