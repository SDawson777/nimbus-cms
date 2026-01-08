# Admin User Management

## Overview

Complete admin user management system with email invitations, password reset, CRUD operations, and audit logging.

## Features

### 1. Admin Invitation Flow
- **Endpoint**: `POST /api/admin/admin-users/invite`
- **Access**: OWNER or ORG_ADMIN roles
- **Flow**:
  1. Admin invites new user via email with role and scope
  2. System generates secure token (32-byte random hex, 7-day expiry)
  3. Invitation stored in `AdminInvitation` table
  4. Email sent with invitation link (TODO: implement email service)
  5. Invitee clicks link → `/accept-invitation?token=xxx`
  6. Invitee sets password → account activated

### 2. Admin CRUD Operations

#### List Admin Users
- **Endpoint**: `GET /api/admin/admin-users`
- **Access**: ORG_ADMIN (sees own org) or OWNER (sees all)
- **Returns**: List of admins with email, role, scope, timestamps

#### Update Admin Role/Scope
- **Endpoint**: `PATCH /api/admin/admin-users/:id`
- **Access**: OWNER only
- **Fields**: role, organizationSlug, brandSlug, storeSlug
- **Protection**: Cannot modify self

#### Revoke Admin Access
- **Endpoint**: `DELETE /api/admin/admin-users/:id`
- **Access**: OWNER only
- **Behavior**: Soft delete (sets deletedAt timestamp)
- **Protection**: Cannot delete self

#### Resend Invitation
- **Endpoint**: `POST /api/admin/admin-users/:id/resend-invitation`
- **Access**: ORG_ADMIN or OWNER
- **Behavior**: Creates new invitation if none pending, or resends existing

### 3. Password Reset Flow
- **Request Endpoint**: `POST /api/admin/admin-users/request-password-reset`
- **Reset Endpoint**: `POST /api/admin/admin-users/reset-password`
- **Flow**:
  1. Admin requests reset via email
  2. System generates secure token (32-byte random hex, 1-hour expiry)
  3. Reset request stored in `AdminPasswordReset` table
  4. Email sent with reset link (TODO: implement email service)
  5. Admin clicks link → `/reset-password?token=xxx`
  6. Admin sets new password → password updated, token marked used

### 4. Accept Invitation
- **Endpoint**: `POST /api/admin/admin-users/accept-invitation`
- **Access**: Public (token-based)
- **Behavior**: 
  - Validates token (not expired, not used)
  - Creates or updates AdminUser with hashed password
  - Marks invitation as accepted
  - Sets role and scope from invitation

## Database Schema

### AdminInvitation
```prisma
model AdminInvitation {
  id               String    @id @default(cuid())
  email            String
  token            String    @unique
  role             AdminRole
  organizationSlug String?
  brandSlug        String?
  storeSlug        String?
  invitedBy        String?
  expiresAt        DateTime
  acceptedAt       DateTime?
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  
  @@index([token])
}
```

### AdminPasswordReset
```prisma
model AdminPasswordReset {
  id        String    @id @default(cuid())
  adminId   String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  
  admin     AdminUser @relation(fields: [adminId], references: [id], onDelete: Cascade)
  
  @@index([token])
}
```

## UI Components

### Admin Management Page (`/admins`)
- List all admins with role, organization, brand, store
- **Invite Admin** button (opens modal)
- Inline role editor (dropdown select)
- **Resend** invitation button
- **Revoke** access button (soft delete)

### Invite Modal
- Email input (required)
- Role select (OWNER, ORG_ADMIN, EDITOR, VIEWER)
- Organization slug (optional, limits access)
- Brand slug (optional, limits access)
- Store slug (optional, limits access)
- Submit → generates invitation URL (shown in success message)

### Accept Invitation Page (`/accept-invitation`)
- Token-based (from URL query param)
- Password input (min 8 chars)
- Confirm password
- Submit → creates account, redirects to login

### Reset Password Page (`/reset-password`)
- Two modes:
  1. Request reset (email input)
  2. Reset password (token from URL, new password inputs)
- Redirects to login after success

## Security Features

1. **Token Security**
   - 32-byte random hex tokens (crypto.randomBytes)
   - Stored with bcrypt hash for password reset
   - Unique indexes on token fields
   - Expiry timestamps enforced

2. **Role-Based Access Control**
   - OWNER: Full access (invite, edit, revoke all admins)
   - ORG_ADMIN: Can invite/manage admins in own organization
   - Self-modification protection (cannot edit/delete self)

3. **Audit Logging**
   - All admin changes logged with actor info
   - Log events: invite, accept, role change, revoke, password reset

4. **Password Requirements**
   - Minimum 8 characters
   - Bcrypt hashing with cost factor 10
   - No password reuse validation (can be added)

## Development Notes

### Email Integration ✅ IMPLEMENTED

Email sending is implemented using SendGrid. Emails are sent for:
- Admin invitations (with accept link)
- Password reset requests (with reset link)
- Account activation confirmations
- Password changed confirmations

**Configuration required:**
```bash
# .env or Railway variables
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=admin@nimbus.app
SENDGRID_FROM_NAME=Nimbus Admin
ADMIN_URL=https://admin.nimbus.app  # or http://localhost:5173 for dev
```

**Behavior by environment:**
- **Production**: Emails are sent, invitation/reset URLs are NOT included in API responses
- **Demo/Development**: Emails are sent AND URLs are included in responses for easy testing

**Testing email integration:**
1. Set up SendGrid account and create API key
2. Verify sender email/domain in SendGrid
3. Add env vars to Railway or local `.env`
4. Invite admin → check email inbox
5. If email doesn't arrive, check SendGrid logs for delivery status

If SendGrid is not configured (missing `SENDGRID_API_KEY`):
- A warning is logged to console
- Invitation/reset URLs are still returned in API responses for dev/testing
- System continues to function, but emails won't be sent

### Environment Variables
- `ADMIN_URL`: Base URL for admin app (e.g., `https://admin.nimbus.app`)
  - Used to construct invitation/reset links
  - Defaults to `http://localhost:5173` in development

### Testing Flow (Manual)

1. **Invite Admin**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/admin-users/invite \
     -H "Content-Type: application/json" \
     -H "Cookie: admin_session=YOUR_SESSION" \
     -d '{"email":"newadmin@test.com","role":"EDITOR","organizationSlug":"demo-operator"}'
   ```
   - Response includes `invitationUrl`

2. **Accept Invitation**:
   - Open `invitationUrl` in browser
   - Set password → Account created

3. **Login**:
   - Go to `/login`
   - Use new admin credentials

4. **Password Reset**:
   - Go to `/reset-password`
   - Enter email → Reset link shown in response
   - Open reset link
   - Set new password → Login with new password

## Migration

Migration created: `20260108035551_add_admin_invitation_and_password_reset`

Apply migration:
```bash
npx pnpm exec prisma migrate dev
```

## API Reference

### POST /api/admin/admin-users/invite
**Request:**
```json
{
  "email": "admin@example.com",
  "role": "EDITOR",
  "organizationSlug": "demo-operator",
  "brandSlug": "mountain-fresh",
  "storeSlug": "sf-mission"
}
```

**Response:**
```json
{
  "success": true,
  "invitation": {
    "id": "clx123",
    "email": "admin@example.com",
    "role": "EDITOR",
    "expiresAt": "2024-01-15T12:00:00Z"
  },
  "invitationUrl": "http://localhost:5173/accept-invitation?token=abc123..."
}
```

### POST /api/admin/admin-users/accept-invitation
**Request:**
```json
{
  "token": "abc123...",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "email": "admin@example.com"
}
```

### POST /api/admin/admin-users/request-password-reset
**Request:**
```json
{
  "email": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent",
  "resetUrl": "http://localhost:5173/reset-password?token=xyz789..."
}
```

### POST /api/admin/admin-users/reset-password
**Request:**
```json
{
  "token": "xyz789...",
  "password": "NewSecurePassword123"
}
```

**Response:**
```json
{
  "success": true
}
```

### GET /api/admin/admin-users
**Response:**
```json
{
  "admins": [
    {
      "id": "clx456",
      "email": "admin@example.com",
      "role": "EDITOR",
      "organizationSlug": "demo-operator",
      "brandSlug": "mountain-fresh",
      "storeSlug": "sf-mission",
      "createdAt": "2024-01-08T12:00:00Z",
      "updatedAt": "2024-01-08T12:00:00Z",
      "createdBy": "owner@example.com"
    }
  ]
}
```

### PATCH /api/admin/admin-users/:id
**Request:**
```json
{
  "role": "ORG_ADMIN",
  "organizationSlug": "demo-operator"
}
```

**Response:**
```json
{
  "admin": {
    "id": "clx456",
    "email": "admin@example.com",
    "role": "ORG_ADMIN",
    "organizationSlug": "demo-operator",
    "updatedAt": "2024-01-08T13:00:00Z"
  }
}
```

### DELETE /api/admin/admin-users/:id
**Response:**
```json
{
  "success": true
}
```

## Future Enhancements

1. **Email Service Integration** (Priority: HIGH)
   - Implement actual email sending
   - Remove URL from API responses in production

2. **Invitation Expiry Management**
   - Automatic cleanup of expired invitations
   - Resend with new token if expired

3. **Password Policies**
   - Configurable password requirements
   - Password strength meter in UI
   - Password history (prevent reuse)

4. **Two-Factor Authentication**
   - TOTP support for admin accounts
   - Backup codes

5. **Admin Activity Dashboard**
   - View all admin actions
   - Filter by admin, action type, date range

6. **Bulk Operations**
   - Invite multiple admins from CSV
   - Bulk role updates
   - Bulk revoke access

7. **SSO Integration**
   - SAML/OAuth for enterprise customers
   - Auto-provision admins from SSO

8. **Enhanced Audit Logging**
   - Dedicated audit log table
   - IP address tracking
   - User agent logging
   - Export audit logs
