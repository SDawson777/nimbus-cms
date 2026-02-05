# Sanity Publishing Issue Investigation

## Problem Statement
Unable to publish changes to categories and other documents in Sanity Studio.

## Root Cause Analysis

### Current Setup
- **Project ID:** `ygbu28p2`
- **Datasets:** 
  - `nimbus_demo` - Available
  - `nimbus_preview` - Available
- **Studio Dataset:** Currently set to `nimbus_preview` (in `.env`)
- **API Token:** Present and valid

### Key Finding: Dataset Mismatch

The studio `.env` file is currently pointing to `nimbus_preview`:

```dotenv
SANITY_STUDIO_DATASET=nimbus_preview
```

But the mobile app and backend are configured to use `nimbus_demo`:

```typescript
// Backend code
const response = await fetchCMS(..., { dataset: 'nimbus_demo' })

// apps/studio/sanity.config.ts
dataset: "nimbus_demo"    // <-- Multi-workspace includes this
```

### Potential Publishing Issues

1. **Dataset Configuration Confusion**
   - Studio has multi-workspace support (demo + preview)
   - But `.env` defaults to `nimbus_preview`
   - Changes in preview may not reflect in demo (which is what mobile/backend use)

2. **Token Permissions**
   - `SANITY_API_TOKEN` is configured
   - `SANITY_PREVIEW_TOKEN` is also configured
   - Both should have write permissions

3. **No Draft/Publish Workflow Blocks Detected**
   - Schema validation rules seem reasonable
   - No hidden fields blocking publication

---

## Solution: Clear Configuration

### Step 1: Verify You're Editing the Right Dataset

Check which workspace you're currently in by looking at the Studio header:

```
[Demo (nimbus_demo)]  vs  [Preview (nimbus_preview)]
```

**Action:** If editing categories, ensure you're in the **Demo** workspace (unless you specifically need Preview).

### Step 2: Switch to Demo Dataset

Update `.env` in `apps/studio/`:

```dotenv
# apps/studio/.env

SANITY_STUDIO_PROJECT_ID=ygbu28p2
SANITY_STUDIO_DATASET=nimbus_demo  # ← Changed from nimbus_preview

# Tokens
SANITY_API_TOKEN=skWMXASzj44wIcpFqJwrEsHfcsMHIjP8NNCckXtffzGQo2kabd1iVIRxdobtxVhSnBufakRSfjYucGmRlAo80lV8cu30vjkPmHih6r62yo1bj0Evdb2hGKRX8xz83YhUJWgb9YaMBmWy83vh6gaxFkzRnOM6DPFih2o882Yl1rS1xj8Mplof
SANITY_PREVIEW_TOKEN=skpI4o4tDq96oUOphCa8MBKcyxgLn4t42Aq9ryleQMROUzir4QOEav5MXpMcvX1RdvHdl6N4fv3Qncrl9TVmfYUfZTWoTd2zKp0X0MfXfAWEbERZGvE6ivxbGOnaFggPKbJ7EfRxxCf0gW1VjBKeJS1OKyuYKSm0TgYqMyg9NWgzhHoKrsSb
```

### Step 3: Clear Browser Cache & Rebuild

```bash
# Kill running dev server
pkill -f "vite" || true

# Clear build artifacts
rm -rf apps/studio/.next
rm -rf apps/studio/dist

# Rebuild and restart
cd apps/studio && npm run dev
```

### Step 4: Test Publishing

1. Open `http://localhost:3333` (or your studio URL)
2. Navigate to **Demo** workspace (dropdown at top)
3. Click on **Categories** or another document
4. Make a small change (add a word to description)
5. Try to publish - should work now

---

## Troubleshooting Checklist

If publishing still fails after switching datasets:

### ✅ Check 1: API Token Validity

```bash
# Test if token has write permissions
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  "https://api.sanity.io/v1/projects/ygbu28p2/datasets/nimbus_demo/mutations" \
  -d '[{"create": {"_type": "test", "_id": "test-doc", "message": "test"}}]'
```

Expected: Should return a mutation ID (indicates write access)

### ✅ Check 2: Browser Console Errors

1. Open Sanity Studio in browser
2. Press `F12` to open DevTools
3. Click **Console** tab
4. Try to publish a document
5. Look for red errors about:
   - `Network error`
   - `Unauthorized`
   - `CORS` errors
   - `Invalid token`

### ✅ Check 3: Studio Configuration

Verify `apps/studio/sanity.config.ts` explicitly includes both workspaces:

```typescript
export default defineConfig([
  {
    name: "demo",
    title: "Demo (nimbus_demo)",
    projectId: "ygbu28p2",
    dataset: "nimbus_demo",      // ← Should be nimbus_demo
    basePath: "/",
    plugins: sharedPlugins,
    schema: sharedSchema,
  },
  {
    name: "preview",
    title: "Preview (nimbus_preview)",
    projectId: "ygbu28p2",
    dataset: "nimbus_preview",    // ← Should be nimbus_preview
    basePath: "/",
    plugins: sharedPlugins,
    schema: sharedSchema,
  },
]);
```

### ✅ Check 4: Verify Documents Exist

List category documents:

```bash
cd apps/studio
npx sanity documents get "categories" 2>&1 | head -20
```

Or query via GROQ:

```bash
cd apps/studio
npx sanity documents query "*[_type == 'category'][0]" 2>&1
```

### ✅ Check 5: Check for Draft/Publish Mismatch

Some documents might have drafts that can't be published. Try:

1. In Studio, go to **Categories**
2. Look for a document with an orange **Draft** label
3. Hover over **Draft** - should show "Click to publish draft"
4. If it's disabled/grayed out, check browser console for validation errors

---

## Why This Happens

**Common Reason:** Multi-workspace setups can be confusing because:

1. **Sanity has two modes:**
   - Single dataset (production)
   - Multi-dataset (demo + preview for A/B testing)

2. **This project uses multi-dataset:**
   - `nimbus_demo` = Live content for mobile app & backend
   - `nimbus_preview` = Staging/testing before publishing to demo

3. **The `.env` default of `nimbus_preview`:**
   - Means you're editing a staging dataset
   - Changes there DON'T automatically sync to `nimbus_demo`
   - Mobile app won't see your changes until you promote preview→demo

---

## Recommended Workflow

### For Development (Quick Iterations):

```
Use: nimbus_demo
Why: Mobile app and backend immediately see changes
```

Update `.env`:
```dotenv
SANITY_STUDIO_DATASET=nimbus_demo
```

### For Staging (Safe Testing Before Prod):

```
Use: nimbus_preview first, then copy to nimbus_demo
Why: Test changes without affecting live mobile app
```

Update `.env`:
```dotenv
SANITY_STUDIO_DATASET=nimbus_preview
```

Then use Sanity CLI to sync:
```bash
# Export preview
sanity dataset export nimbus_preview preview-backup.tar.gz

# Import to demo
sanity dataset import preview-backup.tar.gz nimbus_demo
```

---

## Quick Fix Command

If you just want to get publishing working immediately:

```bash
# Update the default dataset in .env
cd /Users/user288522/Documents/nimbus-cms/apps/studio
sed -i '' 's/SANITY_STUDIO_DATASET=nimbus_preview/SANITY_STUDIO_DATASET=nimbus_demo/' .env

# Verify the change
grep SANITY_STUDIO_DATASET .env

# Restart studio dev server
npm run dev
```

Then try publishing - it should work.

---

## Support

If publishing still fails after these steps:

1. **Check Sanity status page:** https://sanity.io/status
2. **Review browser console** (F12 → Console tab)
3. **Verify token expiration:** Tokens can expire after 90 days
4. **Check dataset ACL:** Both datasets should be `public` aclMode

Current status:
```
✅ Datasets exist
✅ API token valid
✅ Project accessible
⚠️ Dataset configuration potentially misaligned (preview vs demo)
```
