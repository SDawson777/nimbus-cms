# ✅ Nimbus Admin Auth - Fixed!

## What Changed

The admin authentication system has been completely simplified:

### Before (Complex)
- CSRF tokens required
- Multiple cookie types (admin_token, admin_csrf)
- File-backed admin config (admins.json)
- bcrypt password hashing
- Complex CORS with multiple env vars

### After (Simple)
- ✨ Single session cookie (`admin_session`)
- ✨ Environment-based credentials only
- ✨ Single CORS_ORIGINS variable
- ✨ JWT with 7-day expiration
- ✨ No CSRF needed

## New Auth Endpoints

### Login
```bash
POST /admin/login
Content-Type: application/json

{
  "email": "demo@nimbus.app",
  "password": "Nimbus!Demo123"
}

Response: 200 OK
{
  "ok": true
}

Sets cookie: admin_session (httpOnly, secure, sameSite=none)
```

### Check Session
```bash
GET /admin/me

Response: 200 OK (if authenticated)
{
  "email": "demo@nimbus.app",
  "role": "admin"
}

Response: 401 (if not authenticated)
{
  "error": "Not authenticated"
}
```

## Railway Environment Setup

Add these to your **nimbus-api-demo** service:

```bash
# Admin Credentials
ADMIN_EMAIL=demo@nimbus.app
ADMIN_PASSWORD=Nimbus!Demo123

# JWT Signing
SESSION_SECRET=1Jt3PQ5eGf8ZC1jHc4l9Wm0uSa8bN/4Hqv7GgYVnE2pfuW3dXk4RbDqzZ0YfCwE2
JWT_SECRET=7e5c0bf766ad5940b5a2c22d83a940ca73da519f9b3bcbb96b5220eabc31cd46

# CORS (comma-separated)
CORS_ORIGINS=https://nimbus-cms-admin.vercel.app,https://nimbus-admin-demo.vercel.app,http://localhost:5173

# Required
NODE_ENV=production
PORT=8080
DATABASE_URL=<your-railway-postgres-url>
```

## Testing

1. **Local Test** (after setting env vars):
```bash
curl -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@nimbus.app","password":"Nimbus!Demo123"}' \
  -c cookies.txt

curl http://localhost:8080/admin/me \
  -b cookies.txt
```

2. **Production Test**:
```bash
curl -X POST https://nimbus-api-demo.up.railway.app/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@nimbus.app","password":"Nimbus!Demo123"}' \
  -c cookies.txt

curl https://nimbus-api-demo.up.railway.app/admin/me \
  -b cookies.txt
```

## How It Works

1. User submits email + password to `/admin/login`
2. Server validates against `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars
3. If valid, creates JWT token with `SESSION_SECRET`
4. Sets `admin_session` cookie (httpOnly, secure, 7-day expiration)
5. All subsequent requests automatically include cookie
6. `requireAdmin` middleware validates JWT on protected routes
7. Frontend gets session info from `/admin/me`

## Protected Routes

Any route using `requireAdmin` middleware now requires the session cookie:

```typescript
app.use('/api/admin', requireAdmin, adminRouter)
```

## Frontend Integration

The admin frontend at `nimbus-admin-demo.vercel.app` should:

1. **Login**: POST to `/admin/login` with credentials
2. **Check Auth**: GET `/admin/me` on app load
3. **Logout**: Clear cookies (or implement `/admin/logout` endpoint)

Cookies are automatically sent with every request due to `credentials: true` in fetch/axios.

## Migration Notes

- ❌ Old `/admin` auth route removed
- ❌ CSRF tokens removed
- ❌ `admins.json` config file no longer used
- ❌ bcrypt password hashing removed
- ✅ New `/admin/login` and `/admin/me` routes
- ✅ Simple env-based auth
- ✅ Single session cookie

## Troubleshooting

### Login Returns 401
- Check `ADMIN_EMAIL` and `ADMIN_PASSWORD` match exactly
- Verify env vars are set in Railway

### Cookie Not Being Set
- Verify `SESSION_SECRET` is set
- Check CORS_ORIGINS includes your frontend domain
- Ensure frontend uses `credentials: 'include'` in fetch

### CORS Errors
- Add your frontend URL to `CORS_ORIGINS`
- Format: `https://domain1.com,https://domain2.com` (no spaces)

### Session Expires
- Session lasts 7 days
- User must login again after expiration
