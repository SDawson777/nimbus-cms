# Nimbus Admin E2E Test Suite

Complete "record-every-flow" end-to-end testing with Playwright that captures video, traces, screenshots, and logs for every test run.

## 🎯 Overview

This E2E suite exercises all major user flows in the Nimbus Admin SPA and records comprehensive evidence for:

- Buyer due diligence
- Demo walkthroughs
- Bug reproduction
- Performance analysis
- Compliance auditing

## 📦 What's Included

### Test Suites

1. **Auth Flows** (`e2e-auth-flows.spec.ts`)
   - Valid admin login
   - Invalid login attempts
   - Logout functionality
   - RBAC - non-admin access control
   - Password reset request
   - Invitation acceptance

2. **Org/Tenant Management** (`e2e-org-tenant-flows.spec.ts`)
   - Tenant/workspace switching
   - Selection persistence across reloads
   - Multi-store data scoping

3. **Content/CMS** (`e2e-content-flows.spec.ts`)
   - Create articles
   - Edit FAQs
   - View products
   - Manage deals

4. **Legal/Compliance** (`e2e-legal-compliance-flows.spec.ts`)
   - View legal documents
   - Create document versions
   - Version history
   - Compliance dashboard
   - Snapshot functionality

5. **Theme/Settings** (`e2e-theme-settings-flows.spec.ts`)
   - Change theme tokens/colors
   - Preview and save changes
   - Settings persistence
   - Field updates

6. **Personalization** (`e2e-personalization-flows.spec.ts`)
   - Create rules
   - Enable/disable rules
   - Rule list management
   - State persistence

7. **Analytics & Users** (`e2e-analytics-users-flows.spec.ts`)
   - Analytics dashboard with widgets
   - Period filtering (7/30/90 days)
   - Geographic heatmap with Leaflet
   - Store marker interactions
   - Admin user management
   - Orders list
   - Undo/version control

8. **Flow Index** (`e2e-flow-index.spec.ts`)
   - Comprehensive route checking (all 15+ routes)
   - Suite Map navigation
   - Deep link access
   - Performance metrics
   - Error boundary testing
   - Browser compatibility

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/admin
pnpm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure test credentials:

```env
E2E_BASE_URL=http://localhost:5174
E2E_ADMIN_EMAIL=demo@nimbus.app
E2E_ADMIN_PASSWORD=Nimbus!Demo123
```

### 3. Start the Dev Server

In one terminal:

```bash
cd apps/admin
pnpm run dev
```

### 4. Run All Tests (Headless with Recording)

In another terminal:

```bash
cd apps/admin
pnpm run e2e:all
```

This will:

- Run all E2E tests in headless Chrome
- Record video for every test
- Capture traces on every test
- Take screenshots at key steps
- Log console messages, network errors, and page errors
- Generate artifacts in `demo-artifacts/<timestamp>/`

## 📋 Available Commands

### Run All Tests

```bash
# Headless (default)
pnpm run e2e:all

# Headed mode (see browser)
pnpm run e2e:all:headed
```

### Run Individual Test Suites

```bash
# Auth flows only
pnpm run e2e:auth

# Content/CMS flows
pnpm run e2e:content

# Legal/compliance
pnpm run e2e:legal

# Theme/settings
pnpm run e2e:theme

# Analytics/users
pnpm run e2e:analytics

# Comprehensive route check
pnpm run e2e:flows
```

### View Test Report

```bash
pnpm run e2e:report
```

## 📁 Artifacts Structure

After running tests, artifacts are organized in timestamped folders:

```
apps/admin/demo-artifacts/
└── 20260108-143025/          # YYYYMMDD-HHmmss timestamp
    ├── test-results.json     # JSON report
    ├── auth-valid-login/
    │   ├── video.webm        # Full video recording
    │   ├── trace.zip         # Playwright trace file
    │   ├── screenshots/      # Step-by-step screenshots
    │   └── logs/
    │       ├── console.log   # Browser console output
    │       ├── network-errors.log
    │       ├── page-errors.log
    │       └── summary.log
    ├── analytics-dashboard/
    │   ├── video.webm
    │   ├── trace.zip
    │   └── logs/
    └── ...
```

### Viewing Artifacts

**Videos**: Open `.webm` files in Chrome, Firefox, or VLC

**Traces**: Use Playwright trace viewer

```bash
npx playwright show-trace demo-artifacts/20260108-143025/test-name/trace.zip
```

**Logs**: Plain text files, open with any editor

## 🎬 One-Liner for Complete Test Run

```bash
pnpm run e2e:all && echo "✅ Artifacts: $(ls -d apps/admin/demo-artifacts/* | tail -1)"
```

This will:

1. Run all E2E tests with full recording
2. Print the path to the artifacts folder

To create a shareable package:

```bash
cd apps/admin
LATEST=$(ls -d demo-artifacts/* | tail -1)
zip -r e2e-evidence.zip $LATEST
echo "📦 Created: e2e-evidence.zip"
```

## 🔧 Configuration

### Playwright Config

The test configuration is in `playwright.config.ts`:

```typescript
use: {
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:5174',
  headless: process.env.E2E_HEADED !== 'true',
  viewport: { width: 1280, height: 800 },
  trace: 'on',           // Always record traces
  screenshot: 'on',      // Always take screenshots
  video: 'on',           // Always record video
}
```

### Environment Variables

| Variable              | Required | Default                 | Description                    |
| --------------------- | -------- | ----------------------- | ------------------------------ |
| `E2E_BASE_URL`        | No       | `http://localhost:5174` | Admin SPA URL                  |
| `E2E_ADMIN_EMAIL`     | Yes      | `demo@nimbus.app`       | Admin login email              |
| `E2E_ADMIN_PASSWORD`  | Yes      | `Nimbus!Demo123`        | Admin password                 |
| `E2E_VIEWER_EMAIL`    | No       | -                       | Non-admin user for RBAC tests  |
| `E2E_VIEWER_PASSWORD` | No       | -                       | Non-admin password             |
| `E2E_TENANT_ID`       | No       | `test-tenant`           | Tenant ID for scoping          |
| `E2E_ORG_SLUG`        | No       | `demo-org`              | Organization slug              |
| `E2E_SEED_ENDPOINT`   | No       | -                       | Backend endpoint to reset data |
| `E2E_SEED_TOKEN`      | No       | -                       | Auth token for seed endpoint   |
| `E2E_DEBUG_COOKIES`   | No       | `0`                     | Log cookie details             |
| `E2E_HEADED`          | No       | `false`                 | Run in headed mode             |

## 🎯 Test Coverage

### Routes Tested (15+)

✅ /login  
✅ /dashboard  
✅ /analytics  
✅ /heatmap  
✅ /products  
✅ /orders  
✅ /articles  
✅ /faqs  
✅ /deals  
✅ /compliance  
✅ /legal  
✅ /theme  
✅ /personalization  
✅ /settings  
✅ /admins  
✅ /undo

### Features Tested

✅ Authentication & Authorization  
✅ RBAC (Role-Based Access Control)  
✅ Multi-tenant/workspace switching  
✅ Content creation & editing  
✅ Legal document management  
✅ Theme customization  
✅ Personalization rules  
✅ Analytics dashboard  
✅ Geographic heatmap  
✅ Admin user management  
✅ Settings persistence  
✅ Error handling  
✅ Navigation (direct & menu)  
✅ Performance metrics

## 🐛 Debugging

### View Trace for Failed Test

```bash
# Find the test folder
ls demo-artifacts/20260108-143025/

# Open trace viewer
npx playwright show-trace demo-artifacts/20260108-143025/failed-test-name/trace.zip
```

### Run Single Test in Headed Mode

```bash
E2E_HEADED=true npx playwright test e2e-auth-flows.spec.ts --headed
```

### View Console Logs

```bash
cat demo-artifacts/20260108-143025/test-name/logs/console.log
```

### Check Network Errors

```bash
cat demo-artifacts/20260108-143025/test-name/logs/network-errors.log
```

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  run: |
    cd apps/admin
    pnpm run e2e:all
  env:
    E2E_BASE_URL: ${{ secrets.E2E_BASE_URL }}
    E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
    E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}

- name: Upload Artifacts
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: e2e-evidence
    path: apps/admin/demo-artifacts/
    retention-days: 30
```

## 🏗️ Architecture

### Helper Utilities

**`helpers/auth.ts`**

- `loginAsAdmin()` - Authenticate via API
- `logoutAdmin()` - Clear session
- `loginAsViewer()` - Non-admin login for RBAC tests

**`helpers/nav.ts`**

- `Navigator` class with methods for all routes
- Automatic URL verification
- Page load waiting
- Suite Map navigation

**`helpers/evidence.ts`**

- `EvidenceCollector` - Captures console, network, and page errors
- Automatic artifact organization
- Screenshot helpers
- Network idle waiting

**`helpers/seed.ts`**

- `clearStorage()` - Reset browser state
- `resetToTestTenant()` - Set deterministic tenant
- `seedBackendData()` - Call backend reset endpoint
- `setupTest()` / `teardownTest()` - Test lifecycle hooks

### Test Structure

Each test follows this pattern:

```typescript
test.describe('Feature Flows', () => {
  let evidence: EvidenceCollector;

  test.beforeEach(async ({ page }, testInfo) => {
    evidence = new EvidenceCollector(testInfo);
    evidence.attachToPage(page); // Start logging
    await setupTest(page);        // Reset state
    await loginAsAdmin(page, ...); // Authenticate
  });

  test.afterEach(async ({ page }) => {
    await evidence.writeLogs();  // Save artifacts
    await teardownTest(page);    // Cleanup
  });

  test('Specific flow', async ({ page }, testInfo) => {
    await test.step('Step 1', async () => {
      // Test actions
      await captureScreenshot(page, 'step-1', testInfo);
    });

    await test.step('Step 2', async () => {
      // More actions
    });
  });
});
```

## 🎯 Best Practices

1. **Use `test.step()` for readability** - Makes traces easier to follow
2. **Capture screenshots at key moments** - Documents test flow
3. **Prefer robust selectors** - Use `data-testid` or semantic roles
4. **Avoid fixed timeouts** - Use `waitForLoadState()`, `expect().toBeVisible()`
5. **Check evidence stats** - Review console/network errors after tests
6. **Keep tests focused** - One feature per test file

## 📝 Adding New Tests

1. Create new spec file in `tests/` folder:

```typescript
// tests/e2e-new-feature.spec.ts
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";
import { Navigator } from "./helpers/nav";
import { EvidenceCollector } from "./helpers/evidence";
import { setupTest, teardownTest } from "./helpers/seed";

test.describe("New Feature", () => {
  // ... setup/teardown ...

  test("Feature flow", async ({ page }, testInfo) => {
    // Test implementation
  });
});
```

2. Add npm script to `package.json`:

```json
"e2e:new-feature": "playwright test e2e-new-feature.spec.ts"
```

3. Run your new tests:

```bash
pnpm run e2e:new-feature
```

## 🔒 Security

- Never commit `.env` with real credentials
- Use test-specific accounts with limited permissions
- Rotate test credentials regularly
- Review recorded videos before sharing externally

## 📞 Support

For issues or questions:

1. Check `demo-artifacts/*/logs/` for error details
2. Open trace viewer for visual debugging
3. Review Playwright documentation: https://playwright.dev
4. Check existing test patterns in this suite

## 📄 License

This test suite is part of the Nimbus CMS Admin project.

---

**Last Updated**: January 8, 2026  
**Playwright Version**: 1.43.0  
**Maintained By**: Nimbus Engineering Team
