/*
  # Create salesplays and related tables

  1. New Tables
    - `salesplays`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `status` (enum: draft, active, completed, cancelled, paused)
      - `email_count` (integer, default 0)
      - `contact_count` (integer, default 0)
      - `emails_sent` (integer, default 0)
      - `emails_opened` (integer, default 0)
      - `replies` (integer, default 0)
      - `call_attempts` (integer, default 0)
      - `call_connects` (integer, default 0)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, optional)
      - `user_id` (uuid, foreign key to auth.users)

    - `salesplay_steps`
      - `id` (uuid, primary key)
      - `salesplay_id` (uuid, foreign key to salesplays)
      - `step_order` (integer, required)
      - `type` (enum: email, call, linkedin_connect, linkedin_message, custom)
      - `subject` (text, optional - for emails)
      - `content` (text, optional)
      - `talk_track` (text, optional - for calls)
      - `delay_days` (integer, default 0)
      - `scheduled_date` (date, optional)
      - `start_immediately` (boolean, default false)
      - `has_specific_time` (boolean, default false)
      - `send_time` (time, optional)
      - `timezone` (text, default 'PST')
      - `has_time_gap` (boolean, default false)
      - `time_gap` (text, default '30s')
      - `completed` (boolean, default false)
      - `completed_at` (timestamp, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create enum types
DO $$ BEGIN
  CREATE TYPE salesplay_status AS ENUM ('draft', 'active', 'completed', 'cancelled', 'paused');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE step_type AS ENUM ('email', 'call', 'linkedin_connect', 'linkedin_message', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS salesplays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status salesplay_status DEFAULT 'draft',
  email_count integer DEFAULT 0,
  contact_count integer DEFAULT 0,
  emails_sent integer DEFAULT 0,
  emails_opened integer DEFAULT 0,
  replies integer DEFAULT 0,
  call_attempts integer DEFAULT 0,
  call_connects integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS salesplay_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesplay_id uuid REFERENCES salesplays(id) ON DELETE CASCADE NOT NULL,
  step_order integer NOT NULL,
  type step_type NOT NULL,
  subject text,
  content text,
  talk_track text,
  delay_days integer DEFAULT 0,
  scheduled_date date,
  start_immediately boolean DEFAULT false,
  has_specific_time boolean DEFAULT false,
  send_time time,
  timezone text DEFAULT 'PST',
  has_time_gap boolean DEFAULT false,
  time_gap text DEFAULT '30s',
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE salesplays ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesplay_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own salesplays"
  ON salesplays
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage steps for their own salesplays"
  ON salesplay_steps
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM salesplays 
      WHERE salesplays.id = salesplay_steps.salesplay_id 
      AND salesplays.user_id = auth.uid()
    )
  );

-- Create trigger for salesplays updated_at
CREATE TRIGGER update_salesplays_updated_at
  BEFORE UPDATE ON salesplays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();