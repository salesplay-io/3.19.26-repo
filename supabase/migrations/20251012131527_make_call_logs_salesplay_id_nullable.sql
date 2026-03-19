/*
  # Make salesplay_id nullable in call_logs

  1. Changes
    - Alter call_logs table to make salesplay_id nullable
    - This allows logging calls that are not associated with any SalesPlay
  
  2. Notes
    - Manual call logs (not part of a SalesPlay) can now have NULL salesplay_id
*/

ALTER TABLE call_logs 
ALTER COLUMN salesplay_id DROP NOT NULL;
