# Multi-User Support Setup Guide

## Overview

This application now supports multiple users within the same account organization. Users can collaborate by sharing contacts and accounts while keeping their personal work (salesplays, tasks, etc.) private.

## Data Sharing Model

### Shared Data (All users in the organization can view and edit)
- **Contacts** - All contacts are shared across the organization
- **Accounts** - All accounts are shared across the organization
- **Outbound Activities** - All activities are visible to the organization (but only the creator can edit)

### Private Data (Only visible to the user who created them)
- **Salesplays** - Private to each user
- **Tasks** - Private to each user
- **Contact Lists** - Private to each user
- **Templates** - Private to each user
- **Call Sheets** - Private to each user
- **Leads** - Private to each user
- **Call Logs** - Private to each user

## Setup Instructions

### Step 1: Run the Database Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ssixqnqacffswtbiteyv
2. Navigate to the SQL Editor
3. Copy the contents of `MULTI_USER_MIGRATION.sql`
4. Paste into the SQL Editor and run the migration

### Step 2: Add Users to Your Organization

After running the migration:

1. Each existing user will automatically have their own organization
2. To add new users to your organization:
   - Have an admin user create them via the Admin Panel
   - Or, you can manually update the `user_profiles` table to assign users to the same `account_organization_id`

### Step 3: Inviting Team Members

To invite team members to your organization:

1. Go to the Admin Panel in the app
2. Click "Add User"
3. Deploy the `create-user` Edge Function (if not already deployed):
   ```bash
   supabase functions deploy create-user
   ```
4. Enter the new user's email
5. The new user will receive an email and be automatically added to your organization

### Step 4: Managing Organization Members

Admins can:
- View all users in the Settings page
- See which users belong to the same organization
- Manage user permissions (admin/non-admin)

## How It Works

### Account Organizations

- Each user belongs to one `account_organization`
- Multiple users can belong to the same organization
- When a new user signs up, they automatically get their own organization
- Admins can reassign users to different organizations via the database

### Row Level Security (RLS)

The application uses Supabase RLS policies to enforce data access:

1. **Shared Data (Contacts & Accounts)**:
   - Users can view/edit any contact or account created by anyone in their organization
   - The `get_user_account_org_id()` function determines which organization the user belongs to
   - RLS policies check if the data's creator is in the same organization

2. **Private Data (Salesplays, Tasks, etc.)**:
   - Users can only see their own salesplays, tasks, contact lists, etc.
   - RLS policies check `auth.uid() = user_id`

3. **Semi-Shared Data (Outbound Activities)**:
   - Users can view all outbound activities in their organization
   - Users can only edit/delete their own activities

### Dashboard Behavior

The dashboard automatically shows:
- **Active SalesPlays**: Only the current user's active salesplays
- **Recent Replies**: Only from the current user's salesplays
- **Active Tasks**: Only the current user's tasks
- **Contact Lists**: Only the current user's contact lists

While contacts and accounts are shared organization-wide.

## Database Schema

### New Table: `account_organizations`
```sql
CREATE TABLE account_organizations (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz,
  updated_at timestamptz
);
```

### Updated Table: `user_profiles`
Added column:
- `account_organization_id` - Links user to their organization

### Helper Function: `get_user_account_org_id()`
Returns the current user's organization ID for use in RLS policies.

## Testing Multi-User Functionality

1. Create a second user account via the Admin Panel
2. Manually assign them to your organization:
   ```sql
   UPDATE user_profiles
   SET account_organization_id = '<your_org_id>'
   WHERE email = '<new_user_email>';
   ```
3. Log in as the second user
4. Verify:
   - They can see shared contacts and accounts
   - They cannot see the first user's salesplays
   - They can see outbound activities from both users

## Troubleshooting

### Users can't see shared data
- Verify both users have the same `account_organization_id` in `user_profiles`
- Check RLS policies are enabled on the tables
- Ensure the migration ran successfully

### Data showing incorrectly
- Clear browser cache and refresh
- Check the Supabase logs for RLS policy violations
- Verify the `get_user_account_org_id()` function returns the correct value

## Future Enhancements

Potential improvements:
- Organization management UI
- Invite system with email confirmation
- Role-based permissions within organizations
- Organization settings and preferences
- Audit log for organization-wide activities
