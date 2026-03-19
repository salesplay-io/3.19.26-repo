# Email Provider Detection

## Overview

The email connection flow now automatically detects the email provider based on the domain and presents the appropriate connection method.

## Supported Providers

### Google (OAuth)
**Detected Domains:**
- gmail.com
- googlemail.com

**Connection Method:** OAuth 2.0 (secure, no password required)

### Microsoft (OAuth)
**Detected Domains:**
- outlook.com
- hotmail.com
- live.com
- msn.com
- outlook.co.uk
- outlook.com.au
- hotmail.co.uk
- hotmail.fr
- hotmail.de
- hotmail.it
- hotmail.es

**Connection Method:** OAuth 2.0 (secure, no password required)

### Other Providers (IMAP/SMTP)
**Examples:**
- Custom domains (company email)
- ProtonMail
- Yahoo
- AOL
- FastMail
- Zoho
- Any other email provider

**Connection Method:** Manual IMAP/SMTP configuration

## How It Works

1. **User enters email address**: When the user types their email in the "Connect Email" modal
2. **Automatic detection**: System extracts the domain and checks against known providers
3. **Dynamic UI**: The modal automatically shows:
   - **Google/Microsoft**: OAuth button with provider logo
   - **Other providers**: IMAP/SMTP configuration form

## User Experience

### Gmail/Outlook Users
- Enter email address
- See "OAuth available" notification
- Click "Connect with Google/Microsoft" button
- Securely authenticate without entering passwords
- Automatic configuration

### Other Email Providers
- Enter email address
- See "IMAP/SMTP configuration required" notification
- Fill in server details (SMTP host, port, username, password)
- Optional IMAP settings for reply tracking
- Manual but straightforward setup

## Benefits

1. **Security**: OAuth eliminates need to store passwords for major providers
2. **Ease of use**: One-click setup for Gmail and Outlook users
3. **Flexibility**: Manual IMAP/SMTP for enterprise and custom domains
4. **Clear guidance**: Users know exactly what to expect based on their email provider
