# 🎬 E2E Test Suite - Quick Start

## ONE-LINER TO RUN EVERYTHING

```bash
cd apps/admin && pnpm run e2e:all && echo "✅ Evidence saved to: $(ls -td demo-artifacts/* 2>/dev/null | head -1)"
```

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Admin dev server running on `http://localhost:5174`
- [ ] Test credentials configured in `.env`

## 🚀 Step-by-Step Setup

### 1. Install Dependencies (if not already done)

```bash
cd apps/admin
pnpm install
```

### 2. Copy Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
E2E_BASE_URL=http://localhost:5174
E2E_ADMIN_EMAIL=demo@nimbus.app
E2E_ADMIN_PASSWORD=Nimbus!Demo123
```

### 3. Start the Dev Server (in one terminal)

```bash
cd apps/admin
pnpm run dev
```

Wait for: `Local: http://localhost:5174/`

### 4. Run E2E Tests (in another terminal)

```bash
cd apps/admin
pnpm run e2e:all
```

### 5. View Results

After tests complete, you'll see:

```
✅ Evidence saved to: apps/admin/demo-artifacts/20260108-143025
```

## 📦 Create Shareable Package

```bash
cd apps/admin
LATEST=$(ls -td demo-artifacts/* | head -1)
zip -r e2e-evidence.zip $LATEST
echo "📦 Package created: e2e-evidence.zip (size: $(du -h e2e-evidence.zip | cut -f1))"
```

Share `e2e-evidence.zip` with buyers or stakeholders.

## 🎯 What Gets Recorded

For **EVERY test**:

- ✅ Full video recording (.webm)
- ✅ Playwright trace file (.zip) - open with `npx playwright show-trace`
- ✅ Screenshots at each step (.png)
- ✅ Console logs (all browser console output)
- ✅ Network errors (failed requests)
- ✅ Page errors (JavaScript exceptions)

## 📊 Test Coverage

✅ **8 test suites** covering:

- Auth (login/logout/RBAC)
- Org/Tenant switching
- Content/CMS (articles, FAQs, products, deals)
- Legal/Compliance (documents, versions)
- Theme/Settings (customization, persistence)
- Personalization (rules management)
- Analytics (dashboard, heatmap, users)
- Flow Index (15+ routes, navigation, performance)

Total: **40+ individual test cases**

## 🎬 Common Commands

```bash
# Run all tests (headless)
pnpm run e2e:all

# Run with visible browser
pnpm run e2e:all:headed

# Run specific suite
pnpm run e2e:auth         # Auth flows only
pnpm run e2e:analytics    # Analytics & users only
pnpm run e2e:flows        # Comprehensive route check

# View HTML report
pnpm run e2e:report

# View a specific trace
npx playwright show-trace demo-artifacts/20260108-143025/test-name/trace.zip
```

## 🐛 Debugging Failed Tests

1. **Check the video** - See exactly what happened:

   ```bash
   open demo-artifacts/20260108-143025/failed-test-name/video.webm
   ```

2. **Review logs** - Find error details:

   ```bash
   cat demo-artifacts/20260108-143025/failed-test-name/logs/page-errors.log
   ```

3. **Open trace viewer** - Interactive debugging:
   ```bash
   npx playwright show-trace demo-artifacts/20260108-143025/failed-test-name/trace.zip
   ```

## 📁 Artifacts Structure

```
demo-artifacts/20260108-143025/
├── test-results.json              # Summary report
├── auth-valid-login/
│   ├── video.webm                 # Video recording
│   ├── trace.zip                  # Playwright trace
│   └── logs/
│       ├── console.log            # Browser console
│       ├── network-errors.log     # Failed requests
│       ├── page-errors.log        # JS errors
│       └── summary.log            # Test summary
├── analytics-dashboard/
│   └── ...
└── (40+ test folders)
```

## ⚡ Performance Tips

- **Parallel execution**: Tests run in parallel by default (faster)
- **Single test**: Run one test to debug faster
  ```bash
  npx playwright test e2e-auth-flows.spec.ts --grep "valid login"
  ```
- **Skip slow tests**: Use `.skip()` for tests you don't need right now

## 🔒 Security Notes

- **Never commit `.env`** with real credentials
- Test credentials in `.env.example` are examples only
- Use test-specific admin accounts with limited permissions
- Review videos before sharing externally (might contain sensitive data)

## ✅ Verification Checklist

After running tests, verify:

- [ ] All tests passed (or expected failures documented)
- [ ] Artifacts folder created with timestamp
- [ ] Video files playable (Chrome/Firefox/VLC)
- [ ] Logs contain expected output
- [ ] No unexpected errors in console logs
- [ ] Screenshots show correct UI state

## 🎯 Next Steps

1. **Review the full documentation**: [E2E_README.md](./E2E_README.md)
2. **Add custom tests**: Follow patterns in existing specs
3. **Integrate with CI/CD**: See GitHub Actions example in main README
4. **Schedule regular runs**: Catch regressions early

## 📞 Need Help?

- 📖 Read full docs: `apps/admin/E2E_README.md`
- 🎭 Playwright docs: https://playwright.dev
- 🔍 Check logs: `demo-artifacts/*/logs/`
- 🎬 View traces: `npx playwright show-trace <trace.zip>`

---

**Ready to test?** Run:

```bash
cd apps/admin && pnpm run e2e:all
```

**Last Updated**: January 8, 2026
