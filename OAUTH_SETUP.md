# OAuth Email Integration Setup Guide

This guide explains how to set up OAuth authentication for Gmail and Microsoft email accounts in your application.

## Overview

The application supports OAuth 2.0 authentication for:
- **Gmail** accounts (@gmail.com)
- **Microsoft** accounts (@outlook.com, @hotmail.com, @live.com)

For other email providers, manual SMTP/IMAP configuration is required.

## Redirect URIs

When configuring OAuth applications in Google Cloud Console and Azure Portal, you need to add the following redirect URIs:

### For Development
- Not applicable - OAuth flows use production URLs only

### For Production
Your Supabase project URL: `https://ssixqnqacffswtbiteyv.supabase.co`

**Google OAuth Redirect URI:**
```
https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/google-oauth-callback
```

**Microsoft OAuth Redirect URI:**
```
https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/microsoft-oauth-callback
```

---

## Google Cloud Console Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "YourApp Email Integration")
4. Click "Create"

### 2. Enable Gmail API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click "Enable"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Click "Create"
4. Fill in required fields:
   - App name: Your app name
   - User support email: Your email
   - Developer contact email: Your email
5. Click "Save and Continue"
6. Add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
7. Click "Save and Continue"
8. Add test users (if in testing mode)
9. Click "Save and Continue"

### 4. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Add a name (e.g., "Email Integration")
5. Under "Authorized redirect URIs", add:
   ```
   https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/google-oauth-callback
   ```
6. Click "Create"
7. **Save your Client ID and Client Secret**

### 5. Set Environment Variables in Supabase

The secrets are automatically configured, but you need to add these values in your Supabase dashboard:

1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add the following secrets:
   - `GOOGLE_CLIENT_ID`: Your Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Client Secret
   - `GOOGLE_REDIRECT_URI`: `https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/google-oauth-callback`

---

## Azure Portal Setup (Microsoft)

### 1. Register an Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Fill in:
   - Name: Your app name (e.g., "YourApp Email Integration")
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Select "Web" and enter:
     ```
     https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/microsoft-oauth-callback
     ```
5. Click "Register"

### 2. Configure API Permissions

**IMPORTANT:** You must use the **Office 365 Exchange Online API**, NOT Microsoft Graph.

1. In your app registration, go to "API permissions"
2. Click "Add a permission"
3. **DO NOT** select Microsoft Graph. Instead:
   - Click on "APIs my organization uses"
   - Search for "**Office 365 Exchange Online**"
   - Select it from the results
4. Select "Delegated permissions"
5. Add these permissions:
   - `SMTP.Send` - Allows the app to send mail as the signed-in user
   - `IMAP.AccessAsUser.All` - Allows the app to read and write email as the signed-in user
6. Click "Add permissions"
7. Now add Microsoft Graph permissions for user info:
   - Click "Add a permission" again
   - Select "Microsoft Graph"
   - Select "Delegated permissions"
   - Add these permissions:
     - `openid`
     - `profile`
     - `email`
     - `offline_access`
   - Click "Add permissions"
8. Click "Grant admin consent" (if you have admin rights)

### 3. Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add a description (e.g., "Email Integration Secret")
4. Select expiration period (recommended: 24 months)
5. Click "Add"
6. **Copy the secret value immediately** (it won't be shown again)

### 4. Verify API Permissions

After configuring permissions, your "API permissions" page should show:

**Office 365 Exchange Online:**
- SMTP.Send (Delegated)
- IMAP.AccessAsUser.All (Delegated)

**Microsoft Graph:**
- email (Delegated)
- offline_access (Delegated)
- openid (Delegated)
- profile (Delegated)

All should show "Granted for [Your Organization]" in the Status column.

### 5. Get Application ID

1. Go to "Overview"
2. Copy the "Application (client) ID"

### 6. Set Environment Variables in Supabase

The secrets are automatically configured, but you need to add these values in your Supabase dashboard:

1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add the following secrets:
   - `MICROSOFT_CLIENT_ID`: Your Application (client) ID
   - `MICROSOFT_CLIENT_SECRET`: Your Client Secret
   - `MICROSOFT_REDIRECT_URI`: `https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/microsoft-oauth-callback`

---

## Testing the Integration

### 1. Test Gmail OAuth

1. Go to Settings → Email Integration
2. Click "Connect Email"
3. Enter a Gmail address (e.g., yourname@gmail.com)
4. The UI should detect Gmail and show "Connect with Google" button
5. Click the button
6. A popup window should open with Google's authorization page
7. Sign in and authorize the requested permissions
8. The popup should show a success message
9. Close the popup and verify the email account appears in your settings

### 2. Test Microsoft OAuth

1. Go to Settings → Email Integration
2. Click "Connect Email"
3. Enter a Microsoft email address (e.g., yourname@outlook.com)
4. The UI should detect Microsoft and show "Connect with Microsoft" button
5. Click the button
6. A popup window should open with Microsoft's authorization page
7. Sign in and authorize the requested permissions
8. The popup should show a success message
9. Close the popup and verify the email account appears in your settings

### 3. Test Other Providers

1. Go to Settings → Email Integration
2. Click "Connect Email"
3. Enter an email from another provider (e.g., yourname@customdomain.com)
4. The UI should show manual configuration form
5. Fill in SMTP/IMAP settings
6. Click "Connect Account"

---

## Troubleshooting

### "Failed to obtain access token" Error (Microsoft)

**Problem:** Most common cause is using the wrong API for permissions in Azure Portal

**Solution:**
1. Check that you configured **Office 365 Exchange Online API** permissions (NOT Microsoft Graph)
2. Verify you have these exact permissions from Office 365 Exchange Online:
   - `SMTP.Send`
   - `IMAP.AccessAsUser.All`
3. Verify Microsoft Graph permissions are separate:
   - `openid`, `profile`, `email`, `offline_access`
4. Grant admin consent for all permissions
5. If you previously configured Microsoft Graph SMTP/IMAP permissions, remove them

### "Missing Google OAuth credentials" Error

**Problem:** Edge function can't find environment variables

**Solution:**
1. Verify secrets are set in Supabase Dashboard
2. Redeploy the edge functions
3. Check secret names match exactly

### "redirect_uri_mismatch" Error

**Problem:** The redirect URI doesn't match what's configured in Google/Microsoft

**Solution:**
1. Double-check the redirect URI in Google Cloud Console / Azure Portal
2. Ensure it exactly matches: `https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/google-oauth-callback`
3. No trailing slashes
4. Case-sensitive

### OAuth Popup Gets Blocked

**Problem:** Browser blocks the OAuth popup window

**Solution:**
1. Allow popups for your application domain
2. Or use a redirect-based flow instead of popup

### Token Refresh Issues

**Problem:** Access tokens expire after 1 hour

**Solution:**
- The edge functions store refresh tokens in the database
- Implement a token refresh mechanism before making API calls
- Check if `oauth_token_expires_at` has passed and refresh if needed

---

## Security Considerations

1. **Never commit credentials**: Client secrets should never be in version control
2. **Use environment variables**: Always store credentials in Supabase secrets
3. **HTTPS only**: OAuth only works with HTTPS (which Supabase provides)
4. **Scope minimization**: Only request the permissions you actually need
5. **Token storage**: OAuth tokens are stored encrypted in the database
6. **Regular rotation**: Rotate client secrets periodically (every 6-12 months)

---

## Edge Functions Reference

The OAuth integration consists of 4 edge functions:

1. **google-oauth-init**: Initiates Google OAuth flow
2. **google-oauth-callback**: Handles Google OAuth callback
3. **microsoft-oauth-init**: Initiates Microsoft OAuth flow
4. **microsoft-oauth-callback**: Handles Microsoft OAuth callback

All functions are deployed and ready to use. The secrets are configured automatically.

---

## Database Schema

OAuth tokens are stored in the `email_accounts` table:

```sql
- oauth_access_token (text, nullable): Current access token
- oauth_refresh_token (text, nullable): Refresh token for obtaining new access tokens
- oauth_token_expires_at (timestamp, nullable): When the current access token expires
```

---

## Next Steps

After completing this setup:

1. Test the OAuth flow with your own accounts
2. Monitor the edge function logs in Supabase Dashboard
3. Implement token refresh logic for long-running sessions
4. Consider adding error handling for expired tokens in your email sending logic
5. Update your privacy policy to mention third-party email access

---

## Support

If you encounter issues:
1. Check the Supabase edge function logs
2. Verify all environment variables are set correctly
3. Ensure redirect URIs match exactly
4. Check API permissions are granted in Google/Microsoft consoles
