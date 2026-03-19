# SalesPlay Email Workflow - Complete Guide

## Overview
This document explains the complete end-to-end workflow for automated email sending in the SalesPlay application, from salesplay creation to email delivery with personalized content.

## Complete Workflow

### 1. Salesplay Creation

When a user creates a salesplay:

```typescript
// File: src/components/salesplays/CreateSalesPlay.tsx

// User creates a salesplay with:
- Name, description
- List of steps (emails, calls, LinkedIn actions)
- Selected contacts

// After salesplay is created:
1. Salesplay record saved to 'salesplays' table
2. Steps saved to 'salesplay_steps' table with template variables
3. Contacts added to 'salesplay_contacts' table
4. Tasks automatically created for each contact/step combination
```

### 2. Database Tables Involved

#### `salesplays` Table
- Stores the main salesplay information (name, description, status)
- Each salesplay can have multiple steps and contacts

#### `salesplay_steps` Table
- Stores each step in the salesplay sequence
- For email steps, contains:
  - `subject`: Email subject with template variables (e.g., "Hey {{firstName}} {{lastName}}")
  - `content`: Email body with template variables (e.g., "Hi {{firstName}}, I work at {{companyName}}")
  - `type`: Step type ('email', 'call', 'linkedin_connect', etc.)
  - `delay_days`: Days to wait before this step
  - `send_time`: Time of day to send (e.g., '09:00:00')

#### `salesplay_contacts` Table
```sql
CREATE TABLE salesplay_contacts (
  id UUID PRIMARY KEY,
  salesplay_id UUID REFERENCES salesplays(id),
  contact_id UUID REFERENCES contacts(id),
  status TEXT (active/paused/completed),
  user_id UUID REFERENCES auth.users(id)
);
```
- Links contacts to salesplays
- When user selects contacts for a salesplay, they're inserted here
- Status can be 'active', 'paused', or 'completed'

#### `tasks` Table
- Stores individual tasks for each contact/step combination
- Created automatically when contacts are added to salesplay
- Fields:
  - `contact_id`: Which contact this task is for
  - `salesplay_id`: Which salesplay this is part of
  - `step_id`: References the salesplay_steps table for template content
  - `type`: 'email', 'call', etc.
  - `due_date`: Date the task is due
  - `scheduled_time`: Time of day (e.g., '09:00:00')
  - `completed`: Boolean flag

### 3. Task Creation Process

```typescript
// File: src/services/salesplays.ts - addContactsToSalesPlay()

For each contact added to salesplay:
  For each step in the salesplay:
    1. Calculate due_date based on delay_days
    2. Create task with:
       - contact_id (links to contact's email address)
       - step_id (links to template content)
       - due_date + scheduled_time
       - completed = false

Example:
  Salesplay: "Outreach Campaign"
  Steps:
    1. Email (day 0, 9:00 AM) - "Hey {{firstName}}"
    2. Email (day 3, 10:00 AM) - "Following up, {{firstName}}"
    3. Call (day 7, 2:00 PM)

  Contact: Satoshi Araki (satoshi@example.com)

  Tasks Created:
    - Email task, due: today 9:00 AM, step_id: [step 1]
    - Email task, due: today+3 days 10:00 AM, step_id: [step 2]
    - Call task, due: today+7 days 2:00 PM, step_id: [step 3]
```

### 4. Automated Email Processing

#### Cron Job Trigger
```sql
-- Migration: 20260219223145_setup_automated_email_sending.sql

-- Cron job runs every 5 minutes
SELECT cron.schedule(
  'process-email-tasks',
  '*/5 * * * *',  -- Every 5 minutes
  $$SELECT process_due_email_tasks()$$
);
```

#### Email Processing Function
```sql
-- Function: process_due_email_tasks()

Every 5 minutes:
  1. Find all email tasks where:
     - type = 'email'
     - completed = false
     - step_id IS NOT NULL
     - (due_date + scheduled_time) <= NOW()

  2. For each task:
     a. Fetch contact data (first_name, last_name, email, title)
     b. Fetch account data (company name, industry)
     c. Fetch salesplay and check if active/paused
     d. Fetch step content (subject template, body template)
     e. Check for active email account

  3. Replace template variables:
     - {{firstName}} → Contact's first_name
     - {{lastName}} → Contact's last_name
     - {{email}} → Contact's email
     - {{title}} → Contact's title
     - {{companyName}} → Account's name
     - {{industry}} → Account's industry

  4. Send email via HTTP to send-email edge function

  5. Mark task as completed

  6. Update salesplay statistics
```

### 5. Template Variable Replacement

The `replace_template_variables()` function handles personalization:

```sql
CREATE FUNCTION replace_template_variables(
  template_text text,
  contact_data jsonb,
  account_data jsonb
)
RETURNS text

Example:
  Template: "Hey {{firstName}} {{lastName}}, I noticed {{companyName}} is in {{industry}}"
  Contact: {first_name: "Satoshi", last_name: "Araki"}
  Account: {name: "SALab", industry: "Technology"}

  Result: "Hey Satoshi Araki, I noticed SALab is in Technology"
```

### 6. Email Sending

```typescript
// File: supabase/functions/send-email/index.ts

process_due_email_tasks() makes HTTP call to edge function with:
{
  to: "satoshi@example.com",           // Contact's email
  subject: "Hey Satoshi Araki",        // Template replaced
  content: "Hi Satoshi...",            // Template replaced
  contactId: "...",
  salesplayId: "...",
  userId: "...",
  emailAccountId: "..."                // User's email account
}

Edge function:
1. Gets user's email account credentials
2. Sends via SMTP2Go API
3. Logs email to email_sync_logs table
```

### 7. Email Logging

```sql
-- Table: email_sync_logs

INSERT INTO email_sync_logs (
  from_email: "nate@salesplay.io",
  to_email: "satoshi@example.com",
  subject: "Hey Satoshi Araki",        -- Final personalized subject
  body_text: "Hi Satoshi...",          -- Final personalized body
  direction: 'sent',
  contact_id: "...",
  salesplay_id: "...",
  received_at: NOW()
);
```

## Supported Template Variables

| Variable | Source | Example |
|----------|--------|---------|
| `{{firstName}}` | contacts.first_name | "Satoshi" |
| `{{lastName}}` | contacts.last_name | "Araki" |
| `{{email}}` | contacts.email | "satoshi@example.com" |
| `{{title}}` | contacts.title | "Software Engineer" |
| `{{companyName}}` | accounts.name | "SALab" |
| `{{industry}}` | accounts.industry | "Technology" |

## Verification

To verify the workflow is working:

```sql
-- 1. Check contacts in salesplay
SELECT * FROM salesplay_contacts WHERE salesplay_id = 'xxx';

-- 2. Check tasks created for contacts
SELECT
  t.id,
  t.contact_id,
  t.step_id,
  t.due_date,
  t.scheduled_time,
  t.completed,
  c.email,
  ss.subject as template_subject
FROM tasks t
JOIN contacts c ON c.id = t.contact_id
JOIN salesplay_steps ss ON ss.id = t.step_id
WHERE t.salesplay_id = 'xxx' AND t.type = 'email';

-- 3. Check sent emails with replaced variables
SELECT
  esl.subject,
  esl.body_preview,
  esl.to_email,
  c.first_name,
  c.last_name
FROM email_sync_logs esl
JOIN contacts c ON c.id = esl.contact_id
WHERE esl.direction = 'sent'
ORDER BY esl.received_at DESC;
```

## Example End-to-End Flow

1. User creates salesplay "Q1 Outreach"
2. Adds step: Email with subject "Hey {{firstName}}, let's connect!"
3. Selects contact: Satoshi Araki (satoshi@example.com)
4. System creates:
   - salesplay_contacts entry (salesplay_id + contact_id)
   - task entry (contact_id + step_id + due_date)
5. Cron job runs and finds due task
6. Fetches Satoshi's data: {first_name: "Satoshi"}
7. Replaces template: "Hey Satoshi, let's connect!"
8. Sends email to satoshi@example.com
9. Logs in email_sync_logs with final content
10. Marks task as completed

## Troubleshooting

### Emails not being sent?
1. Check if tasks exist: `SELECT * FROM tasks WHERE type='email' AND completed=false`
2. Check due dates: `SELECT due_date, scheduled_time FROM tasks WHERE type='email'`
3. Check salesplay status: `SELECT status FROM salesplays WHERE id='xxx'` (must be 'active')
4. Check contact status: `SELECT status FROM salesplay_contacts WHERE ...` (must be 'active')

### Template variables not replaced?
- FIXED: As of migration `add_template_replacement_to_email_sending`
- All template variables are now replaced before sending
- Check `email_sync_logs` to verify personalized content

### Emails going to wrong address?
- Contact email comes from `contacts.email` field
- Task links to contact via `task.contact_id`
- Verify: `SELECT c.email FROM tasks t JOIN contacts c ON c.id = t.contact_id WHERE t.id='xxx'`
