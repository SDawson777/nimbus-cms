# Railway Environment Variables - Demo Service

Required environment variables for `nimbus-api-demo` Railway service:

```bash
# Node Environment
NODE_ENV=production
PORT=8080

# Database (Railway Postgres - Demo)
DATABASE_URL=postgresql://postgres:YRXSqaJORvZekgVVNjySKzrrKCvRaYDY@switchyard.proxy.rlwy.net:54142/railway

# Admin Authentication
ADMIN_EMAIL=demo@nimbus.app
ADMIN_PASSWORD=Nimbus!Demo123

# JWT Secrets
SESSION_SECRET=1Jt3PQ5eGf8ZC1jHc4l9Wm0uSa8bN/4Hqv7GgYVnE2pfuW3dXk4RbDqzZ0YfCwE2
JWT_SECRET=7e5c0bf766ad5940b5a2c22d83a940ca73da519f9b3bcbb96b5220eabc31cd46

# CORS Origins (comma-separated)
CORS_ORIGINS=https://nimbus-cms-admin.vercel.app,https://nimbus-admin-demo.vercel.app,http://localhost:5173

# Optional: Redis
# REDIS_URL=redis://default:<password>@<host>:6379
```

## How to Apply

1. Go to Railway Dashboard → Select `nimbus-api-demo` service
2. Click **Variables** tab
3. Add each variable above
4. Railway will automatically redeploy

## Login Credentials

After deployment, login at `https://nimbus-admin-demo.vercel.app` with:
- **Email**: demo@nimbus.app
- **Password**: Nimbus!Demo123

## Notes

- `SESSION_SECRET` is used for JWT signing in the new auth system
- `JWT_SECRET` is kept for backward compatibility with existing systems
- `CORS_ORIGINS` must include all admin frontends (Vercel + localhost for dev)
- Port **must** be `8080` for Railway routing
