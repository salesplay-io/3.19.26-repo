# Automated Email Sending Setup

## Overview

This document explains how the automated email sending system works in your SalesPlay application.

## The Problem (Before)

Previously, when you created a SalesPlay and added contacts:
1. ✅ SalesPlay was created with email steps
2. ✅ Tasks were created for each contact with scheduled dates
3. ❌ **Emails were NEVER sent automatically**
4. ❌ Email tasks were hidden from the UI
5. ❌ No background job existed to send emails

## The Solution (Now)

We've implemented a **pg_cron scheduled job** that:
1. Runs every 5 minutes automatically
2. Finds all email tasks that are due (due_date <= today)
3. Validates conditions (contact exists, has email, salesplay not paused, etc.)
4. Marks tasks as complete
5. Updates salesplay statistics

## How It Works

### 1. Database Components

**Extension: `pg_cron`**
- Schedules jobs to run on a timer
- Runs in the database automatically

**Extension: `http`**
- Allows PostgreSQL to make HTTP requests
- Used to call the send-email edge function

**Function: `process_due_email_tasks()`**
- Queries for due email tasks (where scheduled datetime <= NOW())
- Validates all conditions
- Marks tasks complete
- Returns detailed results

**Cron Job: `process-due-email-tasks`**
- Runs every 5 minutes: `*/5 * * * *`
- Executes the `process_due_email_tasks()` function
- Processes up to 50 emails per run

**New Column: `scheduled_time`**
- Added to `tasks` table to store exact send time
- Combined with `due_date` to create full datetime for sending
- Default is 9:00 AM if not specified

### 2. Workflow

```
Every 5 minutes:
  ↓
Find email tasks where:
  - type = 'email'
  - completed = false
  - (due_date + scheduled_time) <= NOW()  ← Checks exact datetime!
  ↓
For each task:
  ✓ Check contact exists and has email
  ✓ Check salesplay exists
  ✓ Check salesplay not paused globally
  ✓ Check salesplay not paused for this contact
  ✓ Check email step exists
  ✓ Check user has active email account
  ↓
  ✓ Mark task complete
  ✓ Update salesplay emails_sent counter
```

### 3. Email Timing Accuracy

**How exact timing works:**

When you schedule an email for **9:30 AM on Jan 15th**:
- Task created with `due_date = '2025-01-15'` and `scheduled_time = '09:30:00'`
- Combined datetime: `2025-01-15 09:30:00`

**Cron job checks every 5 minutes:**
- 9:25 AM: Email not sent (scheduled time hasn't arrived)
- 9:30 AM: Email not sent yet (cron runs at :00, :05, :10, :15, :20, :25, :30, :35...)
- **9:30 AM (exact)**: If cron happens to run at 9:30, email sent immediately
- **9:35 AM**: If cron missed 9:30, email sent here (5 minutes late maximum)

**Accuracy:** Emails will be sent within **0-5 minutes** of their scheduled time.

**Example timings:**
- Scheduled: 9:00 AM → Sent at: 9:00 AM (on time)
- Scheduled: 9:03 AM → Sent at: 9:05 AM (2 min late)
- Scheduled: 9:07 AM → Sent at: 9:10 AM (3 min late)
- Scheduled: 9:12 AM → Sent at: 9:15 AM (3 min late)

**To improve accuracy:**
- Change cron to run every minute: `* * * * *`
- Trade-off: More database load but emails within 0-1 minutes of schedule

### 4. What Gets Checked

The system validates multiple conditions before processing:

- **Contact validation**: Must exist and have an email address
- **Salesplay validation**: Must exist and not be deleted
- **Pause status**: Won't send if salesplay is paused (globally or for specific contact)
- **Email step**: Must have valid subject and content
- **Email account**: User must have an active email account configured

### 5. Current Implementation Status

**✅ Completed:**
- pg_cron extension enabled
- Scheduled job created (runs every 5 minutes)
- Function to find and process due email tasks
- Task completion and statistics updates
- Comprehensive validation and error handling

**⚠️ Note:**
The current implementation marks tasks as complete but **doesn't actually send emails yet**. To fully enable email sending, you need to:

1. Add HTTP call to the `send-email` edge function in the `process_due_email_tasks()` function
2. Uncomment and configure the HTTP request code
3. Provide the Supabase URL and service role key

## Testing the Cron Job

### Check if the cron job is scheduled:
```sql
SELECT * FROM cron.job;
```

### Manually run the function to test:
```sql
SELECT * FROM process_due_email_tasks();
```

Expected output:
```json
{
  "processed_count": 5,
  "success_count": 5,
  "error_count": 0,
  "details": [
    {
      "task_id": "...",
      "status": "success",
      "contact_email": "john@example.com",
      "subject": "Introduction Email"
    }
  ]
}
```

### Check cron job runs:
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-due-email-tasks')
ORDER BY start_time DESC
LIMIT 10;
```

## Managing the Cron Job

### Disable the cron job:
```sql
SELECT cron.unschedule('process-due-email-tasks');
```

### Re-enable the cron job:
```sql
SELECT cron.schedule(
  'process-due-email-tasks',
  '*/5 * * * *',
  $$SELECT process_due_email_tasks()$$
);
```

### Change the schedule (e.g., every 10 minutes):
```sql
SELECT cron.unschedule('process-due-email-tasks');
SELECT cron.schedule(
  'process-due-email-tasks',
  '*/10 * * * *',
  $$SELECT process_due_email_tasks()$$
);
```

## Cron Schedule Format

```
 ┌───────────── minute (0 - 59)
 │ ┌───────────── hour (0 - 23)
 │ │ ┌───────────── day of month (1 - 31)
 │ │ │ ┌───────────── month (1 - 12)
 │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
 │ │ │ │ │
 * * * * *
```

Examples:
- `*/5 * * * *` - Every 5 minutes
- `*/10 * * * *` - Every 10 minutes
- `0 * * * *` - Every hour at minute 0
- `0 9 * * *` - Every day at 9:00 AM
- `0 9 * * 1` - Every Monday at 9:00 AM

## Monitoring

### View recent email tasks:
```sql
SELECT
  t.id,
  t.type,
  t.due_date,
  t.completed,
  c.email as contact_email,
  sp.name as salesplay_name
FROM tasks t
JOIN contacts c ON c.id = t.contact_id
JOIN salesplays sp ON sp.id = t.salesplay_id
WHERE t.type = 'email'
ORDER BY t.due_date DESC
LIMIT 20;
```

### Check for errors in logs:
Look in the Supabase logs for any NOTICE or ERROR messages from the `process_due_email_tasks` function.

## Troubleshooting

### Emails not being processed?

1. **Check if cron job is scheduled:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-due-email-tasks';
   ```

2. **Check if cron is running:**
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-due-email-tasks')
   ORDER BY start_time DESC LIMIT 5;
   ```

3. **Manually test the function:**
   ```sql
   SELECT * FROM process_due_email_tasks();
   ```

4. **Check for due email tasks:**
   ```sql
   SELECT COUNT(*) FROM tasks
   WHERE type = 'email'
   AND completed = false
   AND due_date <= CURRENT_DATE;
   ```

### Common Issues

**No tasks being processed:**
- Ensure email tasks exist with `due_date <= today`
- Check if salesplay is paused
- Verify contacts have email addresses
- Confirm users have active email accounts

**Tasks skipped:**
- Check the `details` output from the function
- Look for skip reasons (paused, no email account, etc.)

**Cron job not running:**
- Verify pg_cron extension is enabled
- Check database logs for errors
- Ensure job is scheduled correctly

## Next Steps

To complete the email sending implementation:

1. Configure the HTTP call in `process_due_email_tasks()` to call the `send-email` edge function
2. Store Supabase URL and service role key securely
3. Test with a few contacts first
4. Monitor logs for any errors
5. Gradually scale up to more contacts

## Security Notes

- The function runs with `SECURITY DEFINER` (elevated privileges)
- All conditions are validated before processing
- Paused salesplays are respected
- Email accounts are verified as active
- Service role key should be kept secure
