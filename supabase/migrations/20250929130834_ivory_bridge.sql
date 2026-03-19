/*
  # Create tasks and call logs tables

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `type` (enum: call, linkedin_connect, linkedin_message, email, custom)
      - `contact_id` (uuid, foreign key to contacts)
      - `salesplay_id` (uuid, foreign key to salesplays, optional)
      - `description` (text, required)
      - `due_date` (date, required)
      - `completed` (boolean, default false)
      - `completed_at` (timestamp, optional)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

    - `call_logs`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key to contacts)
      - `salesplay_id` (uuid, foreign key to salesplays)
      - `call_date` (date, required)
      - `call_time` (text, required)
      - `outcome` (enum: connected, voicemail, not_connected, bad_number, not_interested)
      - `duration` (text, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

    - `leads`
      - `id` (uuid, primary key)
      - `contact_id` (uuid, foreign key to contacts)
      - `status` (enum: new, qualified, dead)
      - `source` (enum: manual, email_reply)
      - `notes` (text, optional)
      - `response_preview` (text, optional)
      - `created_at` (timestamp)
      - `user_id` (uuid, foreign key to auth.users)

    - `call_sheets`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `contact_ids` (uuid array)
      - `status` (enum: active, completed)
      - `completed_calls` (integer, default 0)
      - `total_calls` (integer, default 0)
      - `created_at` (timestamp)
      - `completed_at` (timestamp, optional)
      - `user_id` (uuid, foreign key to auth.users)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create enum types
DO $$ BEGIN
  CREATE TYPE task_type AS ENUM ('call', 'linkedin_connect', 'linkedin_message', 'email', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE call_outcome AS ENUM ('connected', 'voicemail', 'not_connected', 'bad_number', 'not_interested');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'qualified', 'dead');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_source AS ENUM ('manual', 'email_reply');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE call_sheet_status AS ENUM ('active', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type task_type NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  salesplay_id uuid REFERENCES salesplays(id) ON DELETE CASCADE,
  description text NOT NULL,
  due_date date NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  salesplay_id uuid REFERENCES salesplays(id) ON DELETE CASCADE NOT NULL,
  call_date date NOT NULL,
  call_time text NOT NULL,
  outcome call_outcome NOT NULL,
  duration text,
  notes text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  status lead_status DEFAULT 'new',
  source lead_source NOT NULL,
  notes text,
  response_preview text,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS call_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_ids uuid[] DEFAULT '{}',
  status call_sheet_status DEFAULT 'active',
  completed_calls integer DEFAULT 0,
  total_calls integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sheets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own call logs"
  ON call_logs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own leads"
  ON leads
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own call sheets"
  ON call_sheets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);