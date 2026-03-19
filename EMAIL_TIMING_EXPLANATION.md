# Email Timing: How It Works

## Your Question
"If the cron job is running every 5 minutes, how can the system keep exact sending time?"

## The Answer

The system **doesn't send at the exact second**, but it sends **within 0-5 minutes** of the scheduled time. Here's how:

## Technical Implementation

### 1. Task Storage with Exact Time

Each email task stores:
- `due_date`: The date (e.g., "2025-01-15")
- `scheduled_time`: The exact time (e.g., "09:30:00")

Combined, this creates: **2025-01-15 09:30:00**

### 2. Cron Job Logic

The pg_cron job runs every 5 minutes and checks:

```sql
WHERE (due_date + scheduled_time) <= NOW()
```

This finds all emails where the scheduled datetime **has already passed**.

### 3. Real-World Examples

**Example 1: Email scheduled for 9:30 AM**
- 9:25 AM: Cron runs → Email time hasn't arrived yet → Skip
- 9:30 AM: Cron runs → Email time exactly matches → **Sent immediately**
- Result: Sent exactly on time ✓

**Example 2: Email scheduled for 9:32 AM**
- 9:30 AM: Cron runs → Email time hasn't arrived yet → Skip
- 9:35 AM: Cron runs → Email time has passed (9:32 < 9:35) → **Sent now**
- Result: Sent 3 minutes late (9:32 → 9:35)

**Example 3: Email scheduled for 9:03 AM**
- 9:00 AM: Cron runs → Email time hasn't arrived yet → Skip
- 9:05 AM: Cron runs → Email time has passed (9:03 < 9:05) → **Sent now**
- Result: Sent 2 minutes late (9:03 → 9:05)

## Timing Guarantees

### Current Setup (5-minute intervals)
- **Best case**: Sent exactly on time (if scheduled time matches a 5-minute interval)
- **Worst case**: Sent up to 5 minutes late
- **Average**: Sent 2-3 minutes after scheduled time

Cron runs at: `:00, :05, :10, :15, :20, :25, :30, :35, :40, :45, :50, :55`

### If You Need Better Accuracy

**Option 1: Run every minute**
```sql
SELECT cron.unschedule('process-due-email-tasks');
SELECT cron.schedule(
  'process-due-email-tasks',
  '* * * * *',  -- Every minute
  $$SELECT process_due_email_tasks()$$
);
```
- **Accuracy**: 0-1 minutes late
- **Trade-off**: More database load (12x more queries)

**Option 2: Run every 2 minutes**
```sql
SELECT cron.schedule(
  'process-due-email-tasks',
  '*/2 * * * *',  -- Every 2 minutes
  $$SELECT process_due_email_tasks()$$
);
```
- **Accuracy**: 0-2 minutes late
- **Trade-off**: Moderate increase in database load

## Why This Approach?

### ✅ Advantages
1. **Reliable**: PostgreSQL pg_cron is battle-tested and reliable
2. **Persistent**: Survives application restarts
3. **Scalable**: Can handle thousands of emails
4. **Simple**: No external queue or worker system needed
5. **Accurate enough**: Most email systems don't need second-level precision

### ❌ Limitations
1. **Not exact**: Can be 0-5 minutes late (configurable)
2. **Database load**: More frequent runs = more database queries

## Best Practices for Email Timing

### For Business Hours Emails
- Schedule at 5-minute intervals: 9:00, 9:05, 9:10, 9:15, etc.
- These will be sent exactly on time

### For Specific Times
- If you schedule for 9:37 AM, it will be sent at 9:40 AM (3 min late)
- Consider adjusting to 9:35 AM or 9:40 AM for predictability

### For High-Volume Campaigns
- Spread emails across multiple time slots
- Example: Instead of 1000 emails at 9:00 AM, schedule:
  - 250 at 9:00 AM
  - 250 at 9:05 AM
  - 250 at 9:10 AM
  - 250 at 9:15 AM

## Comparison with Other Systems

### Traditional Email Marketing Tools
- **Mailchimp, SendGrid, HubSpot**: Similar approach
- They also use scheduled jobs (typically 1-5 minute intervals)
- Not guaranteed to send at exact second

### Real-Time Systems (Overkill for Email)
- **Redis Queue + Workers**: Can send at exact second
- **Trade-off**: Much more complex infrastructure
- **Not necessary**: Emails don't need millisecond precision

## Summary

**Your cron job DOES maintain timing accuracy** within acceptable business constraints:

- ✅ Emails sent within 0-5 minutes of scheduled time
- ✅ Can be improved to 0-1 minutes by changing cron frequency
- ✅ Good enough for 99% of business email use cases
- ✅ Much simpler than complex queue systems

The key insight: **Exact timing isn't checked by looking at a clock every second. Instead, the cron job periodically checks "has this email's time already passed?" If yes, send it immediately.**
