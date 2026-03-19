/*
  # Add LinkedIn Activity Types to Call Outcome Enum

  1. Changes
    - Add 'linkedin_connect' and 'linkedin_message' values to the call_outcome enum
    - Add 'meeting' value to the call_outcome enum for consistency
  
  2. Purpose
    - Allow LinkedIn activities to be logged through the call_logs table
    - Ensure LinkedIn tasks can be marked as complete and properly tracked
    - Maintain consistency between call_logs and outbound_activities tables
  
  3. Notes
    - The call_logs table is used as the primary logging mechanism for all activities
    - The trigger automatically syncs these to outbound_activities with the correct activity_type
    - Existing data is not affected by this change
*/

-- Add new values to the call_outcome enum
ALTER TYPE call_outcome ADD VALUE IF NOT EXISTS 'linkedin_connect';
ALTER TYPE call_outcome ADD VALUE IF NOT EXISTS 'linkedin_message';
ALTER TYPE call_outcome ADD VALUE IF NOT EXISTS 'meeting';
