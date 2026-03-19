/*
  # Add inherit_send_time to salesplay_steps

  ## Summary
  Adds an explicit `inherit_send_time` boolean column to `salesplay_steps`.

  ## Changes
  - `salesplay_steps`: new column `inherit_send_time` (boolean, default false)
    - When true, the step should use the same resolved scheduled_time as Step 1
    - Previously this intent was implicit (null send_time + has_specific_time=false)
      which worked by accident but was fragile

  ## Notes
  - No destructive operations
  - Default false keeps all existing rows unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salesplay_steps' AND column_name = 'inherit_send_time'
  ) THEN
    ALTER TABLE salesplay_steps ADD COLUMN inherit_send_time boolean NOT NULL DEFAULT false;
  END IF;
END $$;
