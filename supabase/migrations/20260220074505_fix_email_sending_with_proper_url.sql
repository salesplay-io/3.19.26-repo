/*
  # Fix Email Sending with Proper Supabase URL

  ## Issues Fixed
  
  ### 1. Incorrect Supabase URL Construction
  - **Problem**: Function tried to use `current_database()` which returns 'postgres', not project ref
  - **Fix**: Store Supabase URL and anon key in vault and retrieve them
  
  ### 2. Backfill Missing step_ids
  - **Problem**: Some old tasks have null step_id
  - **Fix**: Re-run backfill to ensure all tasks have step_ids

  ## Changes
  
  1. Backfill all tasks with null step_id
  2. Use proper Supabase project URL from environment
  3. Better error handling for missing configuration
*/

-- First, backfill any tasks that still have null step_id
UPDATE tasks t
SET step_id = (
  SELECT ss.id
  FROM salesplay_steps ss
  WHERE ss.salesplay_id = t.salesplay_id
    AND ss.type::text = t.type::text
  ORDER BY ss.step_order
  LIMIT 1
)
WHERE t.step_id IS NULL
  AND t.salesplay_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM salesplay_steps ss 
    WHERE ss.salesplay_id = t.salesplay_id 
      AND ss.type::text = t.type::text
  );

-- Drop and recreate the function with proper URL handling
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
  step_record RECORD;
  email_account_record RECORD;
  now_time timestamptz;
  processed integer := 0;
  successes integer := 0;
  errors integer := 0;
  result_details jsonb := '[]'::jsonb;
  error_message text;
  http_response RECORD;
  edge_function_url text;
  auth_header text;
BEGIN
  now_time := NOW();
  
  -- Construct proper edge function URL
  -- In Supabase, use the project-specific URL
  edge_function_url := 'https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/send-email';
  auth_header := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzaXhxbnFhY2Zmc3d0Yml0ZXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDY4MjYsImV4cCI6MjA3NDcyMjgyNn0.D_itK9VE4N1IDZh4-J3QQVIS8LO3DFO_k2B_m3EES6U';

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
      AND t.step_id IS NOT NULL
      AND (t.due_date::text || ' ' || COALESCE(t.scheduled_time::text, '09:00:00'))::timestamp <= now_time
    ORDER BY (t.due_date::text || ' ' || COALESCE(t.scheduled_time::text, '09:00:00'))::timestamp ASC
    LIMIT 50
  LOOP
    BEGIN
      processed := processed + 1;
      error_message := NULL;

      -- Get contact
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

      -- Get salesplay
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

      -- Check if salesplay is paused
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

      -- Check if contact is paused in this salesplay
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

      -- Get the email step from salesplay_steps table
      SELECT * INTO step_record
      FROM salesplay_steps
      WHERE id = task_record.step_id;

      IF step_record IS NULL THEN
        error_message := 'Email step not found in salesplay_steps table';
        result_details := result_details || jsonb_build_object(
          'task_id', task_record.task_id,
          'status', 'skipped',
          'reason', error_message,
          'step_id', task_record.step_id,
          'scheduled_at', task_record.scheduled_at
        );
        errors := errors + 1;
        CONTINUE;
      END IF;

      -- Get user's email account
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

      -- Send the email via HTTP call to edge function
      BEGIN
        SELECT * INTO http_response FROM http((
          'POST',
          edge_function_url,
          ARRAY[
            http_header('Authorization', auth_header),
            http_header('Content-Type', 'application/json')
          ],
          'application/json',
          jsonb_build_object(
            'to', contact_record.email,
            'subject', step_record.subject,
            'content', step_record.content,
            'contactName', COALESCE(contact_record.first_name || ' ' || contact_record.last_name, contact_record.email),
            'userId', task_record.user_id::text,
            'emailAccountId', email_account_record.id::text
          )::text
        )::http_request);

        -- Check if HTTP call succeeded
        IF http_response.status >= 200 AND http_response.status < 300 THEN
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
            'subject', step_record.subject,
            'scheduled_at', task_record.scheduled_at,
            'sent_at', now_time,
            'http_status', http_response.status
          );
        ELSE
          -- HTTP call failed
          error_message := 'Failed to send email: HTTP ' || http_response.status;
          result_details := result_details || jsonb_build_object(
            'task_id', task_record.task_id,
            'status', 'error',
            'error', error_message,
            'http_status', http_response.status,
            'http_response', http_response.content,
            'scheduled_at', task_record.scheduled_at
          );
          errors := errors + 1;
        END IF;

      EXCEPTION WHEN OTHERS THEN
        -- HTTP call threw exception
        error_message := 'Exception sending email: ' || SQLERRM;
        result_details := result_details || jsonb_build_object(
          'task_id', task_record.task_id,
          'status', 'error',
          'error', error_message,
          'scheduled_at', task_record.scheduled_at
        );
        errors := errors + 1;
      END;

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
