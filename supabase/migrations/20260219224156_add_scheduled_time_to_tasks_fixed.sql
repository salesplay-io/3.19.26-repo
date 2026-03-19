/*
  # Add Scheduled Time Support to Tasks

  1. Changes
    - Add `scheduled_time` column to tasks table to store exact send time
    - Update the process_due_email_tasks function to check both date AND time

  2. Why This Matters
    - Emails need to be sent at specific times (e.g., 9:00 AM, 2:30 PM)
    - Current implementation only checks date, not time
    - With 5-minute cron intervals, we need to check if scheduled time has passed

  3. New Logic
    - Task is ready to send if: (due_date + scheduled_time) <= NOW()
    - This ensures emails are sent at or after their scheduled time
    - 5-minute cron job will catch them within 5 minutes of scheduled time
*/

-- Add scheduled_time column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_time time;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_lookup 
ON tasks(type, completed, due_date, scheduled_time) 
WHERE type = 'email' AND completed = false;

-- Update existing email tasks to have default scheduled time (9:00 AM)
UPDATE tasks 
SET scheduled_time = '09:00:00'::time
WHERE type = 'email' AND scheduled_time IS NULL;

-- Drop and recreate the function with time-aware logic
DROP FUNCTION IF EXISTS process_due_email_tasks();

CREATE OR REPLACE FUNCTION process_due_email_tasks()
RETURNS TABLE(
  processed_count integer,
  success_count integer,
  error_count integer,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_record RECORD;
  contact_record RECORD;
  salesplay_record RECORD;
  email_step JSONB;
  email_account_record RECORD;
  now_time timestamptz;
  processed integer := 0;
  successes integer := 0;
  errors integer := 0;
  result_details jsonb := '[]'::jsonb;
  error_message text;
BEGIN
  now_time := NOW();

  -- Loop through email tasks where scheduled datetime has passed
  FOR task_record IN
    SELECT
      t.id as task_id,
      t.contact_id,
      t.salesplay_id,
      t.step_id,
      t.user_id,
      t.due_date,
      t.scheduled_time,
      (t.due_date::text || ' ' || COALESCE(t.scheduled_time::text, '09:00:00'))::timestamp as scheduled_at
    FROM tasks t
    WHERE t.type = 'email'
      AND t.completed = false
      AND (t.due_date::text || ' ' || COALESCE(t.scheduled_time::text, '09:00:00'))::timestamp <= now_time
    ORDER BY (t.due_date::text || ' ' || COALESCE(t.scheduled_time::text, '09:00:00'))::timestamp ASC
    LIMIT 50
  LOOP
    BEGIN
      processed := processed + 1;
      error_message := NULL;

      SELECT * INTO contact_record FROM contacts WHERE id = task_record.contact_id;

      IF contact_record IS NULL OR contact_record.email IS NULL THEN
        error_message := 'Contact not found or has no email';
        result_details := result_details || jsonb_build_object(
          'task_id', task_record.task_id,
          'status', 'skipped',
          'reason', error_message,
          'scheduled_at', task_record.scheduled_at
        );
        errors := errors + 1;
        CONTINUE;
      END IF;

      SELECT * INTO salesplay_record FROM salesplays WHERE id = task_record.salesplay_id;

      IF salesplay_record IS NULL THEN
        error_message := 'Salesplay not found';
        result_details := result_details || jsonb_build_object(
          'task_id', task_record.task_id,
          'status', 'skipped',
          'reason', error_message,
          'scheduled_at', task_record.scheduled_at
        );
        errors := errors + 1;
        CONTINUE;
      END IF;

      IF salesplay_record.status = 'paused' THEN
        error_message := 'Salesplay is paused';
        result_details := result_details || jsonb_build_object(
          'task_id', task_record.task_id,
          'status', 'skipped',
          'reason', error_message,
          'scheduled_at', task_record.scheduled_at
        );
        errors := errors + 1;
        CONTINUE;
      END IF;

      IF EXISTS (
        SELECT 1 FROM salesplay_contacts
        WHERE salesplay_id = task_record.salesplay_id
          AND contact_id = task_record.contact_id
          AND status = 'paused'
      ) THEN
        error_message := 'Salesplay paused for this contact';
        result_details := result_details || jsonb_build_object(
          'task_id', task_record.task_id,
          'status', 'skipped',
          'reason', error_message,
          'scheduled_at', task_record.scheduled_at
        );
        errors := errors + 1;
        CONTINUE;
      END IF;

      SELECT step INTO email_step
      FROM jsonb_array_elements(salesplay_record.steps) AS step
      WHERE step->>'id' = task_record.step_id;

      IF email_step IS NULL THEN
        error_message := 'Email step not found';
        result_details := result_details || jsonb_build_object(
          'task_id', task_record.task_id,
          'status', 'skipped',
          'reason', error_message,
          'scheduled_at', task_record.scheduled_at
        );
        errors := errors + 1;
        CONTINUE;
      END IF;

      SELECT * INTO email_account_record
      FROM email_accounts
      WHERE user_id = task_record.user_id AND is_active = true
      LIMIT 1;

      IF email_account_record IS NULL THEN
        error_message := 'No active email account for user';
        result_details := result_details || jsonb_build_object(
          'task_id', task_record.task_id,
          'status', 'skipped',
          'reason', error_message,
          'scheduled_at', task_record.scheduled_at
        );
        errors := errors + 1;
        CONTINUE;
      END IF;

      -- Mark task as complete
      UPDATE tasks 
      SET completed = true, completed_at = NOW()
      WHERE id = task_record.task_id;

      -- Update statistics
      UPDATE salesplays
      SET emails_sent = COALESCE(emails_sent, 0) + 1
      WHERE id = task_record.salesplay_id;

      successes := successes + 1;
      result_details := result_details || jsonb_build_object(
        'task_id', task_record.task_id,
        'status', 'success',
        'contact_email', contact_record.email,
        'subject', email_step->>'subject',
        'scheduled_at', task_record.scheduled_at,
        'sent_at', now_time
      );

    EXCEPTION WHEN OTHERS THEN
      errors := errors + 1;
      result_details := result_details || jsonb_build_object(
        'task_id', task_record.task_id,
        'status', 'error',
        'error', SQLERRM,
        'scheduled_at', task_record.scheduled_at
      );
    END;
  END LOOP;

  RETURN QUERY SELECT processed, successes, errors, result_details;
END;
$$;

GRANT EXECUTE ON FUNCTION process_due_email_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION process_due_email_tasks() TO service_role;
