⚠️ LEGACY: This folder is an older mobile app implementation used as a reference. The canonical mobile app contract is represented in the production mobile repo; focus on `server/` + `apps/studio/` for current behavior. See `../docs/ARCHITECTURE.md` for details.

# Jars Mobile App

## Environment Setup

This app expects a CMS base URL to be provided through the `EXPO_PUBLIC_CMS_BASE_URL` environment variable. Define it in a `.env` file or your Expo config before running the app:

```
EXPO_PUBLIC_CMS_BASE_URL=https://your-cms.example.com
```

If the variable is missing the app will throw an error on startup. In development the resolved URL is logged to help with troubleshooting.
