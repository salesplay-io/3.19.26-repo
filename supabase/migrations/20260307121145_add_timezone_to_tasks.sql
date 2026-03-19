/*
  # Add timezone column to tasks table

  ## Summary
  Tasks were missing a timezone column, so the scheduled_time stored in tasks
  had no associated timezone. The cron function was treating all scheduled times
  as UTC, causing emails to fire at the wrong local time.

  ## Changes
  - Modified table: `tasks`
    - Added column `timezone` (text, DEFAULT 'UTC') — stores the IANA timezone
      string (e.g. 'America/Los_Angeles') or legacy abbreviation (e.g. 'PST')
      for the step's scheduled send time

  ## Notes
  - Existing tasks without a timezone will default to 'UTC', which preserves
    their current behavior (they were already being compared as UTC anyway).
  - New tasks will receive the timezone from their salesplay step.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE tasks ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';
  END IF;
END $$;
