# SendGrid Email Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# From the root directory
npm install

# Or if using pnpm workspaces
pnpm install
```

This will install `@sendgrid/mail` which was added to `server/package.json`.

### 2. Get SendGrid API Key

1. Sign up at [SendGrid.com](https://sendgrid.com)
2. Go to Settings → API Keys
3. Create a new API key with "Mail Send" permissions
4. Copy the API key (starts with `SG.`)

### 3. Verify Sender Email

**IMPORTANT**: SendGrid requires sender verification before you can send emails.

1. Go to Settings → Sender Authentication
2. Choose one of:
   - **Single Sender Verification** (easiest for testing)
     - Add your email (e.g., `admin@nimbus.app`)
     - Click verification link sent to your email
   - **Domain Authentication** (recommended for production)
     - Add DNS records for your domain
     - Verify domain ownership

### 4. Configure Environment Variables

Add to Railway (or local `.env`):

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=admin@nimbus.app  # Must match verified sender
SENDGRID_FROM_NAME=Nimbus Admin

# Admin App URL (for email links)
ADMIN_URL=https://admin.nimbus.app  # Production
# ADMIN_URL=http://localhost:5173    # Development
```

### 5. Test Email Sending

#### Test Invitation Email:

```bash
# Login as admin, then:
curl -X POST https://your-api.railway.app/api/admin/users/invite \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=YOUR_SESSION_COOKIE" \
  -d '{
    "email": "test@example.com",
    "role": "EDITOR",
    "organizationSlug": "demo-operator"
  }'
```

Check the recipient's inbox for the invitation email.

#### Test Password Reset:

```bash
curl -X POST https://your-api.railway.app/api/admin/admin-users/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com"
  }'
```

Check the admin's inbox for the password reset email.

## Email Templates

The following emails are automatically sent:

### 1. **Invitation Email**
- **Sent when**: Admin invites a new user via `/admins` page
- **Contains**: Welcome message, accept invitation button, 7-day expiry notice
- **Triggers**: Account activation flow

### 2. **Password Reset Email**
- **Sent when**: Admin requests password reset via "Forgot password?"
- **Contains**: Reset password button, 1-hour expiry notice
- **Triggers**: Password reset flow

### 3. **Account Activated Email**
- **Sent when**: Invitee accepts invitation and sets password
- **Contains**: Welcome message, role info, login link

### 4. **Password Changed Confirmation**
- **Sent when**: Admin successfully resets password
- **Contains**: Confirmation message, security warning

## Troubleshooting

### Emails not sending?

1. **Check SendGrid API key is set**:
   ```bash
   # In Railway, verify environment variable exists
   echo $SENDGRID_API_KEY
   ```

2. **Check sender is verified**:
   - Go to SendGrid → Settings → Sender Authentication
   - Ensure email/domain is verified
   - Check `SENDGRID_FROM_EMAIL` matches verified sender

3. **Check SendGrid Activity Feed**:
   - Go to SendGrid → Activity Feed
   - Look for recent sends and any errors
   - Common errors:
     - `Sender not verified` - Verify your sender email
     - `Invalid API key` - Check API key is correct
     - `Quota exceeded` - Upgrade SendGrid plan

4. **Check server logs**:
   ```bash
   # Railway logs will show:
   # "Email sent to user@example.com: You've been invited..."
   # OR
   # "SendGrid error: ..."
   ```

### Emails in spam?

- **Authenticate your domain** (SendGrid → Settings → Sender Authentication → Domain Authentication)
- Add SPF, DKIM, and DMARC records to your DNS
- Use a professional email domain (not @gmail.com)
- Keep sending volume consistent to build reputation

### Testing locally?

If `SENDGRID_API_KEY` is not set, the system will:
- Log a warning: `"SendGrid API key not configured. Email not sent: ..."`
- Still return invitation/reset URLs in API response for testing
- Continue to function normally

**For local testing without email:**
1. Don't set `SENDGRID_API_KEY`
2. Copy invitation/reset URLs from API response
3. Paste URLs directly in browser

## Production Checklist

- [ ] SendGrid account created
- [ ] API key generated with "Mail Send" permission
- [ ] Sender email/domain verified
- [ ] Domain authentication configured (SPF, DKIM, DMARC)
- [ ] `SENDGRID_API_KEY` set in Railway
- [ ] `SENDGRID_FROM_EMAIL` set and verified
- [ ] `ADMIN_URL` set to production admin URL
- [ ] Test invitation flow end-to-end
- [ ] Test password reset flow end-to-end
- [ ] Check SendGrid Activity Feed for successful delivery
- [ ] Monitor SendGrid quota usage

## SendGrid Free Tier Limits

- **100 emails/day** free forever
- Upgrade to Essentials plan for more:
  - $19.95/month for 50,000 emails
  - $89.95/month for 100,000 emails

For most admin systems, 100 emails/day is plenty for invitations and password resets.

## Custom Email Templates (Advanced)

To customize email templates, edit [server/src/lib/email.ts](../server/src/lib/email.ts):

```typescript
export async function sendInvitationEmail(
  email: string,
  token: string,
  inviterName?: string
): Promise<void> {
  // Modify HTML template here
  await sendEmail({
    to: email,
    subject: 'Your custom subject',
    html: `Your custom HTML template...`,
  });
}
```

You can also use SendGrid's Dynamic Templates:
1. Create template in SendGrid dashboard
2. Get template ID
3. Update `sgMail.send()` to use `templateId` instead of `html`

## Environment-Specific Behavior

### Development (`NODE_ENV=development` or `APP_ENV=demo`)
- Emails are sent via SendGrid
- Invitation/reset URLs included in API responses for easy testing
- Console logs show email send status

### Production (`NODE_ENV=production`)
- Emails are sent via SendGrid
- Invitation/reset URLs NOT included in API responses (security)
- Only generic success messages returned

This prevents leaking invitation tokens in production logs/responses.
