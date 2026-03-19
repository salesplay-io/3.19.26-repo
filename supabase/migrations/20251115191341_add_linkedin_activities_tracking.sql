/*
  # Add LinkedIn Activities Tracking to SalesPlays

  1. Purpose
    - Add linkedin_activities column to track combined LinkedIn connects and messages
    - Update triggers to automatically count LinkedIn activities from outbound_activities

  2. Changes
    - Add linkedin_activities column to salesplays table (defaults to 0)
    - Create/update trigger to count LinkedIn activities when outbound activities are logged
    - Backfill existing LinkedIn activities from outbound_activities table

  3. Security
    - Maintains existing RLS policies
*/

-- Add linkedin_activities column to salesplays table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salesplays' AND column_name = 'linkedin_activities'
  ) THEN
    ALTER TABLE salesplays ADD COLUMN linkedin_activities integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Function to update salesplay LinkedIn statistics when an outbound activity is created
CREATE OR REPLACE FUNCTION update_salesplay_linkedin_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment linkedin_activities for linkedin_connect or linkedin_message activities
  IF NEW.activity_type IN ('linkedin_connect', 'linkedin_message') AND NEW.salesplay_id IS NOT NULL THEN
    UPDATE salesplays
    SET linkedin_activities = linkedin_activities + 1,
        updated_at = now()
    WHERE id = NEW.salesplay_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for outbound_activities
DROP TRIGGER IF EXISTS trigger_update_salesplay_linkedin_stats ON outbound_activities;
CREATE TRIGGER trigger_update_salesplay_linkedin_stats
  AFTER INSERT ON outbound_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_salesplay_linkedin_stats();

-- Backfill existing LinkedIn activities
UPDATE salesplays sp
SET linkedin_activities = (
  SELECT COUNT(*)
  FROM outbound_activities oa
  WHERE oa.salesplay_id = sp.id
    AND oa.activity_type IN ('linkedin_connect', 'linkedin_message')
)
WHERE EXISTS (
  SELECT 1
  FROM outbound_activities oa
  WHERE oa.salesplay_id = sp.id
    AND oa.activity_type IN ('linkedin_connect', 'linkedin_message')
);