# Buyer Smoke Test (30 Minutes)

This checklist is designed to be completed in ~30 minutes on the demo or staging environment. It validates the full buyer story: **Admin + CMS + Mobile + API + Sentry + readiness**.

## Before You Start (2 minutes)

- Collect:
  - Admin URL: `__________________________`
  - API Base URL: `__________________________`
  - Mobile build/TestFlight link (or device build): `__________________________`
  - Sentry org/project link(s): `__________________________`
  - Admin credentials (OWNER/ORG_ADMIN recommended): `__________________________`
  - Demo brand slug (if applicable): `__________________________`
  - Demo store slug (if applicable): `__________________________`

## 1) Admin Login + RBAC Verification (5 minutes)

1. Open the Admin URL and log in.
2. Confirm the UI loads without errors and you can navigate to:
   - `Dashboard`
   - `Theme`
   - `Compliance`
   - `Admins`
3. RBAC check:
   - In `Compliance`, confirm the **Run snapshot** button is either enabled (OWNER/ORG_ADMIN) or explicitly disabled with a clear message (non-admin roles).
   - In `Admins`, confirm you can view the list of admins (and, if permitted, invite/edit).

Pass criteria:
- You can log in successfully.
- Restricted actions are clearly enabled/disabled based on role.

## 2) Change Theme Color + Logo and See It Reflected (5 minutes)

1. In Admin, open `Theme`.
2. Change `Primary Color` (pick something obvious) and click **Save**.
3. Verify the theme preview updates immediately.
4. Verify the public theme endpoint returns the updated values:

```bash
curl -s "$API_BASE_URL/api/v1/nimbus/content/theme?brand=$BRAND_SLUG" | cat
```

5. Logo swap (CMS-side): open Studio (from Admin, go to `Deals` → **Open in Studio**, or use your Studio URL), then:
   - Find the buyer’s `themeConfig` document.
   - Upload a new `logo` image (or set `logoUrl` if your workflow uses URL-based logos).
   - Publish.
6. Re-run the theme endpoint and confirm `logoUrl` is present/updated.

Pass criteria:
- Theme colors persist and are returned by the API.
- `logoUrl` updates after publishing the theme config.

## 3) Create a New Deal in CMS and See It in Mobile (7 minutes)

1. Open Sanity Studio.
2. Create a new `deal` document (or duplicate an existing deal), then set:
   - A distinct title (e.g., `Buyer Smoke Test Deal`)
   - `active=true`
   - A valid active window: `startAt` in the past, `endAt` in the future
   - Channels include `mobile` (or leave channels empty for “global”)
   - Ensure brand/store references match the demo tenant if your schema requires it
3. Publish the deal.
4. Verify it appears in the mobile app’s Deals/Promotions view (refresh/relaunch the app if needed).

If a mobile build is not available, use the API as the verification proxy:

```bash
curl -s "$API_BASE_URL/api/v1/nimbus/content/deals?brand=$BRAND_SLUG&store=$STORE_SLUG&channel=mobile" | cat
```

Pass criteria:
- The newly published deal is visible in Mobile (or returned by the deals endpoint).

## 4) Place a Test Order in Mobile and Verify in Admin/API (7 minutes)

1. In the mobile app:
   - Log in (or continue as a demo customer).
   - Add any product to cart.
   - Complete the checkout flow to place a test order.

2. Verify the order exists.

Because the Admin UI in this repo is CMS/content focused and may not include an Orders screen, use one of the following verification methods:

- **Database verification (most direct; requires DB access):**

```bash
psql "$DATABASE_URL" -c 'select id, status, total, "createdAt" from "Order" order by "createdAt" desc limit 5;'
```

- **If your deployment exposes an Orders API:** capture the order ID in the mobile app and verify via that API (deployment-specific).

Pass criteria:
- A new row appears in `"Order"` after checkout, with reasonable `total`.

## 5) Trigger a Test Error and Confirm It Appears in Sentry (3 minutes)

1. Trigger a server-side test error:

```bash
curl -i "$API_BASE_URL/dev/trigger-error"
```

2. If the environment allows it, the response is `500` and (in non-production) may include `sentryEventId`.
3. In Sentry, confirm an event appears for the API project with the message:
   - `Intentional test error from /dev/trigger-error`

Optional (Admin-side): if the Admin banner shows **Trigger Test Error** (non-production builds only), click it and confirm a corresponding Sentry event exists.

Pass criteria:
- Sentry contains a new error event from the API (and optionally Admin) within a minute.

## 6) /healthz + /ready Green Status (1 minute)

```bash
curl -i "$API_BASE_URL/healthz"
curl -i "$API_BASE_URL/ready"
```

Pass criteria:
- Both return `200`.

---

## Notes for the Buyer

- If any step fails, capture:
  - screenshot (Admin/Mobile)
  - the exact curl command + response
  - Sentry event link
  - timestamp (UTC)

For deeper demo-environment validation and troubleshooting, see `docs/BUYER_SMOKE_TEST.md`.
