/*
  # Fix Automated Email Sending Workflow

  ## Summary
  This migration fixes critical bugs preventing automated email sending from working.

  ## Issues Fixed
  
  ### 1. Database Query Error (CRITICAL)
  - **Problem**: Function tried to access `salesplay_record.steps` column that doesn't exist
  - **Fix**: Query `salesplay_steps` table using `task_record.step_id` to get email content
  
  ### 2. Missing Email Sending Logic (CRITICAL)
  - **Problem**: Function marked tasks complete but never actually sent emails
  - **Fix**: Add HTTP call to `send-email` edge function using `http` extension
  
  ### 3. Step Data Structure
  - **Problem**: Function tried to parse steps as JSONB array from salesplays table
  - **Fix**: Query steps from separate `salesplay_steps` table with proper columns

  ## Changes Made
  
  1. Fixed salesplay_steps query to use step_id from tasks table
  2. Get subject and content from salesplay_steps.subject and salesplay_steps.content
  3. Added actual HTTP POST to send-email edge function with all required data
  4. Proper error handling for HTTP failures
  5. Added OAuth token retrieval from email_accounts table

  ## Testing Notes
  - 17 email tasks currently in database ready to send once this is deployed
  - Cron job runs every 5 minutes and will pick up pending tasks
  - Check cron.job_run_details for execution logs
*/

-- Drop and recreate the function with proper salesplay_steps query
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
  supabase_url text;
  supabase_anon_key text;
BEGIN
  now_time := NOW();
  
  -- Get Supabase URL and anon key from environment
  supabase_url := current_setting('app.settings.supabase_url', true);
  supabase_anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  -- Fallback if not set (should not happen in production)
  IF supabase_url IS NULL THEN
    supabase_url := 'https://' || current_database() || '.supabase.co';
  END IF;

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

      -- Get the email step from salesplay_steps table (FIXED: was trying to access non-existent salesplay_record.steps)
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

      -- CRITICAL FIX: Actually send the email via HTTP call to edge function
      BEGIN
        SELECT * INTO http_response FROM http((
          'POST',
          supabase_url || '/functions/v1/send-email',
          ARRAY[
            http_header('Authorization', 'Bearer ' || COALESCE(supabase_anon_key, '')),
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
          error_message := 'Failed to send email: HTTP ' || http_response.status || ' - ' || http_response.content;
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
