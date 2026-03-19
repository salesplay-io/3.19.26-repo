/*
  # Add Template Variable Replacement to Email Sending

  ## Summary
  Fixes the email sending workflow to replace template variables with actual contact data
  before sending emails.

  ## Issue
  - Emails were being sent with unreplaced template variables (e.g., {{firstName}}, {{lastName}})
  - Recipients were receiving emails like "Hey {{firstName}}" instead of "Hey John"

  ## Solution
  - Add template replacement function that replaces variables with contact and account data
  - Support variables: {{firstName}}, {{lastName}}, {{email}}, {{title}}, {{companyName}}, {{industry}}
  - Apply replacement to both subject and content before sending

  ## Supported Variables
  - {{firstName}} - Contact's first name
  - {{lastName}} - Contact's last name
  - {{email}} - Contact's email address
  - {{title}} - Contact's job title
  - {{companyName}} - Account/company name
  - {{industry}} - Company industry
*/

-- Drop existing function
DROP FUNCTION IF EXISTS process_due_email_tasks();

-- Create helper function to replace template variables
CREATE OR REPLACE FUNCTION replace_template_variables(
  template_text text,
  contact_data jsonb,
  account_data jsonb
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text;
BEGIN
  result := template_text;
  
  -- Replace contact variables
  result := replace(result, '{{firstName}}', COALESCE(contact_data->>'first_name', ''));
  result := replace(result, '{{lastName}}', COALESCE(contact_data->>'last_name', ''));
  result := replace(result, '{{email}}', COALESCE(contact_data->>'email', ''));
  result := replace(result, '{{title}}', COALESCE(contact_data->>'title', ''));
  
  -- Replace account/company variables
  result := replace(result, '{{companyName}}', COALESCE(account_data->>'name', ''));
  result := replace(result, '{{industry}}', COALESCE(account_data->>'industry', ''));
  
  RETURN result;
END;
$$;

-- Recreate main function with template replacement
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
  contact_json jsonb;
  account_json jsonb;
BEGIN
  now_time := NOW();
  
  edge_function_url := 'https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/send-email';
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzaXhxbnFhY2Zmc3d0Yml0ZXl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE0NjgyNiwiZXhwIjoyMDc0NzIyODI2fQ.p3kIF_EfMkG36xoWsWVZqVLs5Q5w6U-wQ2vDPMxg9ks';

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

      -- Get account/company data if available
      IF contact_record.account_id IS NOT NULL THEN
        SELECT * INTO account_record FROM accounts WHERE id = contact_record.account_id;
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

      -- Get the email step
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

      -- Convert contact and account to JSON for template replacement
      contact_json := to_jsonb(contact_record);
      account_json := COALESCE(to_jsonb(account_record), '{}'::jsonb);

      -- Replace template variables in subject and content
      final_subject := replace_template_variables(step_record.subject, contact_json, account_json);
      final_content := replace_template_variables(step_record.content, contact_json, account_json);

      -- Send the email via HTTP call with replaced variables
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
            'content', final_content,
            'contactId', task_record.contact_id::text,
            'contactName', COALESCE(contact_record.first_name || ' ' || contact_record.last_name, contact_record.email),
            'salesplayId', task_record.salesplay_id::text,
            'userId', task_record.user_id::text,
            'emailAccountId', email_account_record.id::text
          )::text
        )::http_request);

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
            'subject', final_subject,
            'scheduled_at', task_record.scheduled_at,
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

GRANT EXECUTE ON FUNCTION replace_template_variables(text, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION replace_template_variables(text, jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION process_due_email_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION process_due_email_tasks() TO service_role;
