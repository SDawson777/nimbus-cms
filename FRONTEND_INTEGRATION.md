# Admin Frontend Integration Guide

## Environment Variables

Update your Vercel environment variables for the admin frontend:

```bash
VITE_API_URL=https://nimbus-api-demo.up.railway.app
```

## Login Component

```typescript
async function login(email: string, password: string) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // CRITICAL: Enables cookie handling
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Login failed')
  }

  const data = await response.json()
  return data // { ok: true }
}
```

## Session Check

```typescript
async function checkSession() {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/me`, {
    method: 'GET',
    credentials: 'include', // CRITICAL: Sends session cookie
  })

  if (!response.ok) {
    return null // Not authenticated
  }

  const admin = await response.json()
  return admin // { email: "demo@nimbus.app", role: "admin" }
}
```

## Protected API Calls

```typescript
async function fetchAdminData(endpoint: string) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
    method: 'GET',
    credentials: 'include', // CRITICAL: Sends session cookie
  })

  if (response.status === 401) {
    // Session expired, redirect to login
    window.location.href = '/login'
    return
  }

  return response.json()
}
```

## App Initialization

```typescript
// Check auth on app load
useEffect(() => {
  checkSession()
    .then(admin => {
      if (admin) {
        setCurrentUser(admin)
        // Redirect to dashboard if on login page
        if (location.pathname === '/login') {
          navigate('/dashboard')
        }
      } else {
        // Not authenticated, redirect to login
        if (location.pathname !== '/login') {
          navigate('/login')
        }
      }
    })
}, [])
```

## Axios Configuration (Alternative)

If using Axios:

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Enables cookie handling
})

// Login
await api.post('/admin/login', { email, password })

// Check session
const { data } = await api.get('/admin/me')

// Protected requests
const { data } = await api.get('/api/admin/products')
```

## Important Notes

1. **Always use `credentials: 'include'`** (fetch) or **`withCredentials: true`** (axios)
   - This tells the browser to send cookies with cross-origin requests
   - Without this, the session cookie won't be sent

2. **No need to manually manage tokens**
   - The browser automatically sends the `admin_session` cookie
   - No localStorage or sessionStorage needed

3. **Handle 401 responses**
   - Session expires after 7 days
   - Any 401 response means user needs to login again

4. **No CSRF tokens needed**
   - The new auth system doesn't require CSRF tokens
   - Just include credentials and you're good

5. **CORS is configured**
   - Make sure your frontend domain is in `CORS_ORIGINS` on Railway
   - Cookies work across domains with `sameSite: 'none'` and `secure: true`

## Testing Checklist

- [ ] Login form submits to `/admin/login`
- [ ] Login success redirects to dashboard
- [ ] Dashboard loads and checks `/admin/me` on mount
- [ ] If `/admin/me` returns 401, redirects to login
- [ ] Protected routes check auth before rendering
- [ ] All API requests include `credentials: 'include'`
- [ ] 401 responses trigger redirect to login

## Common Issues

### Cookies not being set
- Verify `credentials: 'include'` in all fetch calls
- Check browser DevTools → Application → Cookies
- Ensure `CORS_ORIGINS` includes your frontend domain

### CORS errors
- Add frontend domain to Railway `CORS_ORIGINS` env var
- Format: `https://domain1.com,https://domain2.com`
- No trailing slashes, no spaces

### Session check always returns 401
- Check if cookie is being sent in Network tab
- Verify `withCredentials` or `credentials: 'include'`
- Clear browser cookies and try fresh login
