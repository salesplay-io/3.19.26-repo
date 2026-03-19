/*
  # Fix step time ordering validation in email task processing

  ## Summary
  Add backend validation to ensure email tasks are only processed when
  their scheduled time is strictly after all earlier steps' scheduled times
  for the same contact + salesplay combination.

  ## Problem
  Previously, a Step 2 email task with delay=0 and a "specific time" earlier
  than Step 1's time would fire immediately after Step 1 completed (because
  the scheduled_at was in the past), rather than waiting for the correct time.

  The existing NOT EXISTS guard only enforced that Step 1 was COMPLETED before
  Step 2 was processed. It did NOT check that Step 2's scheduled_at is
  meaningfully after Step 1's scheduled_at.

  ## Changes
  - Recreates process_due_email_tasks() with an additional guard:
    For each email task, check that no earlier step (by step_order) for the
    same contact+salesplay has a scheduled_at >= this task's scheduled_at.
    This prevents same-day, earlier-time step 2 tasks from firing immediately
    after step 1 completes.

  ## Security
  - No schema changes
  - No RLS changes
  - SECURITY DEFINER preserved
*/

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
  account_record RECORD;
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
  service_role_key text;
  final_subject text;
  final_content text;
  html_content text;
  plain_text_content text;
  contact_json jsonb;
  account_json jsonb;
BEGIN
  now_time := NOW();

  edge_function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-email';
  IF edge_function_url IS NULL OR edge_function_url = '/functions/v1/send-email' THEN
    edge_function_url := 'https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/send-email';
  END IF;
  service_role_key := coalesce(
    current_setting('app.settings.service_role_key', true),
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzaXhxbnFhY2Zmc3d0Yml0ZXl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE0NjgyNiwiZXhwIjoyMDc0NzIyODI2fQ.p3kIF_EfMkG36xoWsWVZqVLs5Q5w6U-wQ2vDPMxg9ks'
  );

  FOR task_record IN
    SELECT
      t.id as task_id,
      t.contact_id,
      t.salesplay_id,
      t.step_id,
      t.user_id,
      t.due_date,
      t.scheduled_time,
      t.timezone,
      ss.step_order,
      (
        (t.due_date::text || ' ' || t.scheduled_time::text)::timestamp
        AT TIME ZONE COALESCE(NULLIF(t.timezone, ''), 'UTC')
      ) as scheduled_at
    FROM tasks t
    JOIN salesplay_steps ss ON ss.id = t.step_id
    WHERE t.type = 'email'
      AND t.completed = false
      AND t.step_id IS NOT NULL
      AND t.scheduled_time IS NOT NULL
      AND (
        (t.due_date::text || ' ' || t.scheduled_time::text)::timestamp
        AT TIME ZONE COALESCE(NULLIF(t.timezone, ''), 'UTC')
      ) <= now_time
      -- Guard 1: no earlier step is still incomplete (step sequencing)
      AND NOT EXISTS (
        SELECT 1
        FROM tasks earlier_t
        JOIN salesplay_steps earlier_ss ON earlier_ss.id = earlier_t.step_id
        WHERE earlier_t.salesplay_id = t.salesplay_id
          AND earlier_t.contact_id = t.contact_id
          AND earlier_t.type = 'email'
          AND earlier_t.completed = false
          AND earlier_t.id != t.id
          AND earlier_ss.step_order < ss.step_order
      )
      -- Guard 2: no earlier step has a scheduled_at >= this task's scheduled_at
      -- (prevents same-day earlier-time step 2 from firing out of time order)
      AND NOT EXISTS (
        SELECT 1
        FROM tasks earlier_t2
        JOIN salesplay_steps earlier_ss2 ON earlier_ss2.id = earlier_t2.step_id
        WHERE earlier_t2.salesplay_id = t.salesplay_id
          AND earlier_t2.contact_id = t.contact_id
          AND earlier_t2.type = 'email'
          AND earlier_t2.id != t.id
          AND earlier_ss2.step_order < ss.step_order
          AND earlier_t2.scheduled_time IS NOT NULL
          AND (
            (earlier_t2.due_date::text || ' ' || earlier_t2.scheduled_time::text)::timestamp
            AT TIME ZONE COALESCE(NULLIF(earlier_t2.timezone, ''), 'UTC')
          ) >= (
            (t.due_date::text || ' ' || t.scheduled_time::text)::timestamp
            AT TIME ZONE COALESCE(NULLIF(t.timezone, ''), 'UTC')
          )
      )
    ORDER BY (
      (t.due_date::text || ' ' || t.scheduled_time::text)::timestamp
      AT TIME ZONE COALESCE(NULLIF(t.timezone, ''), 'UTC')
    ) ASC,
    ss.step_order ASC
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

      IF contact_record.account_id IS NOT NULL THEN
        SELECT * INTO account_record FROM accounts WHERE id = contact_record.account_id;
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

      SELECT * INTO step_record FROM salesplay_steps WHERE id = task_record.step_id;

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

      IF salesplay_record.email_account_id IS NOT NULL THEN
        SELECT * INTO email_account_record
        FROM email_accounts
        WHERE id = salesplay_record.email_account_id
        LIMIT 1;
      ELSE
        SELECT * INTO email_account_record
        FROM email_accounts
        WHERE user_id = task_record.user_id AND is_active = true
        LIMIT 1;
      END IF;

      IF email_account_record IS NULL THEN
        error_message := 'No email account found for salesplay';
        result_details := result_details || jsonb_build_object(
          'task_id', task_record.task_id,
          'status', 'skipped',
          'reason', error_message,
          'salesplay_email_account_id', salesplay_record.email_account_id,
          'scheduled_at', task_record.scheduled_at
        );
        errors := errors + 1;
        CONTINUE;
      END IF;

      contact_json := to_jsonb(contact_record);
      account_json := COALESCE(to_jsonb(account_record), '{}'::jsonb);

      final_subject := replace_template_variables(step_record.subject, contact_json, account_json);
      final_content := replace_template_variables(step_record.content, contact_json, account_json);

      html_content := replace(final_content, E'\n', '<br>');

      plain_text_content := regexp_replace(
        regexp_replace(final_content, '<br\s*/?>', E'\n', 'gi'),
        '<[^>]+>', '', 'g'
      );

      BEGIN
        SELECT * INTO http_response FROM http((
          'POST',
          edge_function_url,
          ARRAY[
            http_header('Authorization', 'Bearer ' || service_role_key),
            http_header('Content-Type', 'application/json')
          ],
          'application/json',
          jsonb_build_object(
            'to', contact_record.email,
            'subject', final_subject,
            'bodyHtml', html_content,
            'bodyText', plain_text_content,
            'contactId', task_record.contact_id::text,
            'contactName', COALESCE(contact_record.first_name || ' ' || contact_record.last_name, contact_record.email),
            'salesplayId', task_record.salesplay_id::text,
            'userId', task_record.user_id::text,
            'emailAccountId', email_account_record.id::text
          )::text
        )::http_request);

        IF http_response.status >= 200 AND http_response.status < 300 THEN
          UPDATE tasks
          SET completed = true, completed_at = NOW()
          WHERE id = task_record.task_id;

          UPDATE salesplays
          SET emails_sent = COALESCE(emails_sent, 0) + 1
          WHERE id = task_record.salesplay_id;

          successes := successes + 1;
          result_details := result_details || jsonb_build_object(
            'task_id', task_record.task_id,
            'status', 'success',
            'contact_email', contact_record.email,
            'subject', final_subject,
            'from_email', email_account_record.email_address,
            'step_order', task_record.step_order,
            'scheduled_at', task_record.scheduled_at,
            'timezone', task_record.timezone,
            'sent_at', now_time,
            'http_status', http_response.status
          );
        ELSE
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
