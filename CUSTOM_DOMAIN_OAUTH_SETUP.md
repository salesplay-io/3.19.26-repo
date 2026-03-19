# Custom Domain for OAuth (Production Setup)

## Problem

When users connect their Gmail account via Google OAuth, the consent screen shows:
```
"to continue to ssixqnqacffswtbiteyv.supabase.co"
```

For production, you want it to show your brand domain instead:
```
"to continue to salesplay.io"
```

---

## How OAuth Redirect URIs Work

The domain shown in Google's consent screen comes from the **redirect_uri** parameter in the OAuth request. Google extracts and displays this domain to users.

Currently:
- Redirect URI: `https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/google-oauth-callback`
- Google shows: "ssixqnqacffswtbiteyv.supabase.co"

To show your brand:
- Redirect URI: `https://salesplay.io/functions/v1/google-oauth-callback`
- Google shows: "salesplay.io"

---

## Solution: Configure Custom Domain in Supabase

### Step 1: Configure Custom Domain in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to Project Settings → Custom Domains
   - Click "Set up a custom domain"

2. **Add Your Domain**
   - Enter your domain (e.g., `salesplay.io` or `api.salesplay.io`)
   - Supabase will provide DNS records to configure

3. **Configure DNS**
   - Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
   - Add the DNS records provided by Supabase
   - Common setup:
     ```
     Type: CNAME
     Name: api (or @ for apex domain)
     Value: ssixqnqacffswtbiteyv.supabase.co
     ```

4. **Wait for SSL Certificate**
   - Supabase will automatically provision an SSL certificate
   - This can take a few minutes to several hours
   - You'll see a green checkmark when ready

5. **Verify Custom Domain**
   - Test that your custom domain works:
     ```
     https://api.salesplay.io/functions/v1/google-oauth-init
     ```
   - Should respond (even if with an error - that's fine, it means routing works)

### Step 2: Update Environment Variables

Update the redirect URIs in your Supabase Edge Function secrets:

1. **Go to Supabase Dashboard**
   - Project Settings → Edge Functions → Manage secrets

2. **Update Google OAuth Redirect URI**
   ```
   GOOGLE_REDIRECT_URI=https://api.salesplay.io/functions/v1/google-oauth-callback
   ```

3. **Update Microsoft OAuth Redirect URI**
   ```
   MICROSOFT_REDIRECT_URI=https://api.salesplay.io/functions/v1/microsoft-oauth-callback
   ```

### Step 3: Update Google Cloud Console

1. **Go to Google Cloud Console**
   - Navigate to APIs & Services → Credentials
   - Click on your OAuth 2.0 Client ID

2. **Update Authorized Redirect URIs**
   - Add the new redirect URI:
     ```
     https://api.salesplay.io/functions/v1/google-oauth-callback
     ```
   - **Keep the old one temporarily** for testing:
     ```
     https://ssixqnqacffswtbiteyv.supabase.co/functions/v1/google-oauth-callback
     ```
   - Click "Save"

3. **Test the New Flow**
   - Try connecting a Gmail account
   - Google should now show: "to continue to api.salesplay.io"
   - Verify the OAuth flow completes successfully

4. **Remove Old Redirect URI** (after testing)
   - Once confirmed working, remove the Supabase URL
   - Keep only your custom domain

### Step 4: Update Microsoft Azure Portal

1. **Go to Azure Portal**
   - Navigate to App registrations → Your app → Authentication

2. **Update Redirect URIs**
   - Add the new redirect URI:
     ```
     https://api.salesplay.io/functions/v1/microsoft-oauth-callback
     ```
   - Keep the old one temporarily for testing
   - Click "Save"

3. **Test and Remove Old URI**
   - Test the Microsoft OAuth flow
   - Remove the old Supabase URL after confirmation

---

## Alternative Approaches

### Option 1: Subdomain for API
Use a subdomain specifically for API/backend:
- Domain: `api.salesplay.io`
- Consent screen shows: "api.salesplay.io"
- Benefit: Separates frontend and backend domains

### Option 2: Main Domain
Use the main domain:
- Domain: `salesplay.io`
- Consent screen shows: "salesplay.io"
- Benefit: Cleaner branding
- Challenge: Requires apex domain configuration (some DNS providers don't support CNAME for apex)

### Option 3: Keep Supabase Domain (Development)
For development or internal tools:
- Keep using: `ssixqnqacffswtbiteyv.supabase.co`
- No custom domain needed
- Users will see the Supabase domain

---

## Custom Domain Checklist

- [ ] Purchase domain (salesplay.io)
- [ ] Configure custom domain in Supabase Dashboard
- [ ] Add DNS records at domain registrar
- [ ] Wait for SSL certificate provisioning
- [ ] Verify custom domain is accessible
- [ ] Update `GOOGLE_REDIRECT_URI` environment variable
- [ ] Update `MICROSOFT_REDIRECT_URI` environment variable
- [ ] Add new redirect URI to Google Cloud Console
- [ ] Add new redirect URI to Azure Portal
- [ ] Test Gmail OAuth flow
- [ ] Test Microsoft OAuth flow
- [ ] Remove old Supabase redirect URIs from Google/Microsoft
- [ ] Update documentation with new domain

---

## Important Notes

1. **SSL/HTTPS Required**
   - OAuth requires HTTPS
   - Supabase automatically provides SSL for custom domains
   - Never use HTTP for OAuth

2. **Exact Match Required**
   - Redirect URIs must match exactly (case-sensitive)
   - No trailing slashes
   - Include the full path: `/functions/v1/google-oauth-callback`

3. **Multiple Redirect URIs**
   - You can have multiple redirect URIs configured
   - Useful for staging/production environments
   - Each must be explicitly added to Google/Microsoft consoles

4. **DNS Propagation**
   - DNS changes can take 24-48 hours to propagate globally
   - Use DNS checker tools to verify propagation
   - Test from different networks

5. **Environment Variables**
   - Update all edge functions that reference the URLs
   - Redeploy edge functions after changing environment variables
   - Test thoroughly before removing old configurations

---

## Frontend Configuration

You may also need to update your frontend code if it references the Supabase URL:

**Current:**
```typescript
const SUPABASE_URL = "https://ssixqnqacffswtbiteyv.supabase.co"
```

**With Custom Domain:**
```typescript
const SUPABASE_URL = "https://api.salesplay.io"
```

However, for Supabase client initialization, you typically keep using the Supabase URL. Only the edge function URLs would use the custom domain.

---

## Testing

After setup, test the following:

1. **Google OAuth Flow**
   ```
   1. Go to Settings → Email
   2. Click "Connect Email"
   3. Enter Gmail address
   4. Click "Connect with Google"
   5. Verify consent screen shows your custom domain
   6. Complete authorization
   7. Verify email account is connected
   ```

2. **Microsoft OAuth Flow**
   ```
   1. Go to Settings → Email
   2. Click "Connect Email"
   3. Enter Outlook/Hotmail address
   4. Click "Connect with Microsoft"
   5. Verify consent screen shows your custom domain
   6. Complete authorization
   7. Verify email account is connected
   ```

3. **Edge Function Endpoints**
   ```bash
   # Test that your custom domain routes correctly
   curl https://api.salesplay.io/functions/v1/google-oauth-init
   curl https://api.salesplay.io/functions/v1/microsoft-oauth-init
   ```

---

## Cost Considerations

- **Custom Domain**: Usually free if you own the domain
- **Supabase**: Custom domains are included in all plans (Free, Pro, Team)
- **SSL Certificate**: Automatically provided by Supabase at no extra cost
- **DNS Hosting**: May have costs depending on your DNS provider

---

## Summary

The consent screen domain comes from your OAuth redirect URI. To show "salesplay.io":

1. Configure custom domain in Supabase
2. Update environment variables with new redirect URIs
3. Add new redirect URIs to Google/Microsoft OAuth apps
4. Test and verify the flow works
5. Remove old Supabase redirect URIs

This gives you professional branding in the OAuth consent screens while maintaining all functionality.
