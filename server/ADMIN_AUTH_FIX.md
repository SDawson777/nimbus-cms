# Admin Authentication Fix

## Problem
The admin login at `nimbus-admin-demo.vercel.app` is failing because `server/config/admins.json` has empty `passwordHash` fields.

## Solution Options

### Option 1: Environment Variables (Recommended for Railway)

Set these environment variables in your Railway **demo** service:

```bash
ADMIN_EMAIL=owner@example.com
ADMIN_PASSWORD=NimbusDemo2024!
JWT_SECRET=your-random-secret-key-here
```

This bypasses the `admins.json` file and uses a simple single-admin mode.

### Option 2: Update admins.json with Hashed Passwords

1. Generate password hash:
```bash
cd server
node scripts/hash-password.js "YourSecurePassword123"
```

2. Copy the generated hash to `server/config/admins.json`:
```json
{
  "admins": [
    {
      "id": "1",
      "email": "owner@example.com",
      "passwordHash": "$2a$10$...", // <-- paste hash here
      "role": "OWNER",
      "organizationSlug": "nimbus-org",
      "brandSlug": "nimbus",
      "storeSlug": "nimbus-main"
    }
  ]
}
```

3. Commit and redeploy

## How Authentication Works

1. **POST** `/admin/login` with `{email, password}`
2. System tries to find admin in `admins.json` with matching email
3. If found, validates password with bcrypt: `bcrypt.compare(password, passwordHash)`
4. **Fallback**: If no config file admin found, checks environment variables:
   - `ADMIN_EMAIL` must match
   - `ADMIN_PASSWORD` must match (plain text comparison)
   - Or `ADMIN_PASSWORD_HASH` with bcrypt validation
5. If valid, generates JWT token (4h expiration)
6. Sets cookies: `admin_token` (httpOnly) + `admin_csrf` (CSRF protection)

## Current Setup

- **Demo API**: https://nimbus-api-demo.up.railway.app
- **Demo Admin**: https://nimbus-admin-demo.vercel.app
- **Config File**: `server/config/admins.json` (currently has empty passwordHash)
- **Auth Route**: `server/src/routes/adminAuth.ts`

## Quick Test After Fix

```bash
# Test login endpoint
curl -X POST https://nimbus-api-demo.up.railway.app/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@example.com","password":"NimbusDemo2024!"}'
```

Should return:
```json
{"ok":true,"csrfToken":"..."}
```

## Notes

- `JWT_SECRET` is **required** for token signing
- Cookies use `sameSite: 'none'` + `secure: true` for cross-origin (Vercel → Railway)
- Rate limiting: 8 login attempts per minute per IP
- Session expires after 4 hours
