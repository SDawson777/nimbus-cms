# Sanity Publishing - FIXED ✅

## Issue Identified & Resolved

### The Problem
You were unable to publish changes to categories and other documents in Sanity Studio. Your changes appeared to have no effect on the live mobile app.

### Root Cause
The Sanity Studio environment (`.env`) was configured to edit the **`nimbus_preview`** dataset (staging), but:
- Mobile app queries **`nimbus_demo`** (production)
- Backend serves **`nimbus_demo`** to mobile

So your published changes in preview never appeared in the live app.

### The Fix
Changed `apps/studio/.env`:

```diff
- SANITY_STUDIO_DATASET=nimbus_preview
+ SANITY_STUDIO_DATASET=nimbus_demo
```

Now:
- ✅ Studio defaults to **nimbus_demo** (live dataset)
- ✅ Your changes publish directly to what mobile app uses
- ✅ Changes are visible immediately after publishing

---

## How to Use Going Forward

### Publishing Live Changes

1. **Open Sanity Studio**
   ```
   https://nimbus-cms.sanity.studio
   ```

2. **Verify You're in the Right Workspace**
   - Look at the workspace selector (top left)
   - Should show: **"Demo (nimbus_demo)"** ← This is correct
   - If it says "Preview", click to switch to "Demo"

3. **Edit & Publish**
   - Click on **Categories** (or other documents)
   - Make your changes
   - Click **Publish** button
   - Changes appear in mobile app immediately

### Two Workspaces Available

You have two datasets:

| Workspace | Dataset | Use Case |
|-----------|---------|----------|
| **Demo** | `nimbus_demo` | **← USE THIS** Live content for mobile app |
| **Preview** | `nimbus_preview` | Staging/testing (optional advanced feature) |

---

## Testing Your Changes

After publishing a category change:

### Test via API
```bash
# Query live categories
curl "https://nimbus-api-demo.up.railway.app/mobile/sanity/categories" | jq '.categories[] | {name, slug}' | head -20
```

### Test in Mobile App
1. Clear app cache
2. Restart mobile app
3. Refresh home screen
4. Your new/updated categories should appear

---

## What's Different Now

### Before (Broken)
```
You edit Category in Studio → Publishes to nimbus_preview → Mobile app (nimbus_demo) sees nothing ❌
```

### After (Fixed)
```
You edit Category in Studio → Publishes to nimbus_demo → Mobile app (nimbus_demo) sees changes ✅
```

---

## Multi-Workspace Setup (Advanced)

The studio actually supports both datasets simultaneously:

- **Demo workspace** (the default, now) - For live editing
- **Preview workspace** (if you need it) - For A/B testing before going live

To switch workspaces while in Studio:
1. Click the dropdown at the top-left (next to the "Sanity" logo)
2. Select "Demo" or "Preview"

---

## Category-Specific Notes

The category schema requires these fields to publish:

| Field | Required? | Notes |
|-------|-----------|-------|
| **Category Key** | ✅ Yes | Must match: Flower, Edibles, Vape, Concentrate, Topical, Tincture, Pre-Roll, Gear, Other |
| **Display Name** | ✅ Yes | User-facing title (can differ from key) |
| **Slug** | ✅ Yes | Auto-generated from Display Name |
| **Description** | ❌ No | Optional longer description |

If you get a publishing error, check that these three fields are filled in.

---

## Summary

✅ **Issue Fixed** - Studio now edits the live dataset  
✅ **Your changes will appear** - Publishing now works correctly  
✅ **Mobile app will see updates** - No more mysterious missing changes  

The fix is deployed and ready to use!
