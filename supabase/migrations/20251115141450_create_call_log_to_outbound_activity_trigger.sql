/*
  # Create Trigger to Sync Call Logs to Outbound Activities

  1. Changes
    - Create a trigger function that automatically creates outbound activity entries when call logs are created
    - Create a trigger that calls this function after insert on call_logs table
    - Backfill existing call logs that don't have corresponding outbound activities

  2. Purpose
    - Ensure all call activities automatically appear in the contact's outbound activities feed
    - Maintain data consistency between call_logs and outbound_activities tables
    - Support historical data by backfilling existing call logs

  3. Notes
    - The trigger maps call log outcomes to appropriate activity types
    - LinkedIn activities (linkedin_connect, linkedin_message) are preserved as-is
    - Standard call outcomes are mapped to 'call' activity type
    - Uses the same user_id from the call log for the outbound activity
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION sync_call_log_to_outbound_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a corresponding outbound activity for the new call log
  INSERT INTO outbound_activities (
    contact_id,
    salesplay_id,
    activity_type,
    activity_date,
    activity_time,
    outcome,
    notes,
    user_id
  )
  VALUES (
    NEW.contact_id,
    NEW.salesplay_id,
    (CASE 
      WHEN NEW.outcome::text = 'linkedin_message' THEN 'linkedin_message'
      WHEN NEW.outcome::text = 'linkedin_connect' THEN 'linkedin_connect'
      ELSE 'call'
    END)::activity_type,
    NEW.call_date,
    NEW.call_time,
    NEW.outcome::text,
    NEW.notes,
    NEW.user_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS sync_call_log_to_outbound_activity_trigger ON call_logs;
CREATE TRIGGER sync_call_log_to_outbound_activity_trigger
  AFTER INSERT ON call_logs
  FOR EACH ROW
  EXECUTE FUNCTION sync_call_log_to_outbound_activity();

-- Backfill existing call logs that don't have corresponding outbound activities
INSERT INTO outbound_activities (
  contact_id,
  salesplay_id,
  activity_type,
  activity_date,
  activity_time,
  outcome,
  notes,
  user_id,
  created_at
)
SELECT 
  cl.contact_id,
  cl.salesplay_id,
  (CASE 
    WHEN cl.outcome::text = 'linkedin_message' THEN 'linkedin_message'
    WHEN cl.outcome::text = 'linkedin_connect' THEN 'linkedin_connect'
    ELSE 'call'
  END)::activity_type,
  cl.call_date,
  cl.call_time,
  cl.outcome::text,
  cl.notes,
  cl.user_id,
  cl.created_at
FROM call_logs cl
LEFT JOIN outbound_activities oa 
  ON cl.contact_id = oa.contact_id 
  AND cl.call_date = oa.activity_date 
  AND cl.call_time = oa.activity_time
  AND cl.outcome::text = oa.outcome
WHERE oa.id IS NULL;
