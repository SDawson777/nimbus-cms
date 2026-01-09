# Local E2E Testing & Evidence Generation Guide

## 🎯 Purpose

This guide explains how to generate the comprehensive 44MB evidence package for buyer demonstrations and due diligence.

**Important**: CI/CD validates code quality (fast, ~15min). Local testing generates buyer evidence (comprehensive, ~45min).

---

## Quick Start

### 1. Prerequisites

```bash
# Ensure dependencies installed
cd /Users/user288522/Documents/nimbus-cms
npx pnpm install

# Ensure backend is running
cd server
pnpm run dev  # Keep this terminal open
```

### 2. Generate Evidence Package

```bash
# In new terminal
cd apps/admin

# Generate fresh evidence (recommended before buyer meetings)
pnpm run e2e:evidence:clean

# This will:
# - Delete old test results
# - Run all 36 flows with full recording
# - Generate videos, traces, and screenshots
# - Create HTML report
# Duration: ~45 minutes
```

### 3. Create Downloadable Package

```bash
cd apps/admin
pnpm run e2e:package

# Creates: ../nimbus-e2e-evidence-YYYYMMDD-HHMMSS.tar.gz (~44MB)
```

---

## What Gets Generated

### Directory Structure

```
apps/admin/
├── demo-artifacts/          # Timestamped test outputs
│   └── 20260108-123456/
│       ├── *.webm          # Individual test videos
│       └── *.zip           # Playwright traces
├── test-results/            # Playwright test results
│   ├── flow-01-login/
│   │   ├── video.webm
│   │   ├── trace.zip
│   │   └── screenshots/
│   └── ... (36 flows total)
└── playwright-report/       # Interactive HTML report
    └── index.html
```

### Evidence Package Contents

When you run `pnpm run e2e:package`, it creates:

```
nimbus-e2e-evidence-<timestamp>.tar.gz (44MB)
├── demo-artifacts/      # Raw test outputs
├── test-results/        # Organized by flow
├── playwright-report/   # HTML report
└── *.md                # Documentation files
```

---

## Available Commands

### Quick Tests (5 minutes)

```bash
# Run smoke tests (flows 1-5 only)
pnpm run e2e:smoke

# Good for: Quick validation before pushing code
```

### Comprehensive Tests (45 minutes)

```bash
# Run all 36 flows with recordings
pnpm run e2e:evidence

# Run all flows (alternative)
pnpm run e2e:all

# Good for: Pre-release validation, buyer evidence
```

### Clean Slate

```bash
# Delete old results and generate fresh
pnpm run e2e:evidence:clean

# Good for: Before important demos, quarterly reviews
```

### View Results

```bash
# Open HTML report in browser
pnpm run e2e:report

# Or manually:
open playwright-report/index.html
```

---

## CI vs Local Testing

### What Runs in GitHub Actions (CI)

✅ **Smoke Tests Only** (flows 1-5)
- NO video recording
- NO trace files
- Only screenshots on failure
- Duration: ~15 minutes
- Purpose: Fast code quality validation

### What Runs Locally

✅ **Full Test Suite** (flows 1-36)
- WITH video recording
- WITH trace files
- WITH all screenshots
- Duration: ~45 minutes
- Purpose: Comprehensive buyer evidence

---

## Viewing Evidence

### HTML Report (Recommended)

```bash
cd apps/admin
pnpm run e2e:report

# Opens interactive report with:
# - Pass/fail status for each test
# - Screenshots
# - Error messages
# - Links to videos and traces
```

### Individual Videos

```bash
# Find all videos
find test-results -name "*.webm"

# Play specific flow
open test-results/flow-33-heatmap-interaction-*/video.webm
```

### Interactive Traces

```bash
# View trace for debugging
npx playwright show-trace test-results/flow-34-multi-tenant-*/trace.zip

# Traces include:
# - Timeline of all actions
# - Network requests
# - Console logs
# - Screenshots at each step
```

### Screenshots

```bash
# View all screenshots for a flow
open test-results/flow-35-order-lifecycle-*/screenshots/*.png
```

---

## Pre-Buyer Meeting Checklist

### 1 Week Before Meeting

- [ ] Run `pnpm run e2e:evidence:clean`
- [ ] Verify all 36 flows pass
- [ ] Review HTML report for any issues
- [ ] Create package: `pnpm run e2e:package`

### 1 Day Before Meeting

- [ ] Re-run evidence generation (ensure current)
- [ ] Upload package to secure location
- [ ] Test package extraction and viewing
- [ ] Prepare demo script

### During Meeting

- [ ] Have HTML report open in browser
- [ ] Highlight flows 33-36 (visual proof)
- [ ] Show flow 34 for security validation
- [ ] Offer package download for technical review

---

## Troubleshooting

### Backend Not Responding

```bash
# Check if port 8080 is in use
lsof -i :8080

# Kill existing process
kill $(lsof -t -i :8080)

# Restart backend
cd server && pnpm run dev
```

### Tests Timing Out

```bash
# Increase timeout (edit playwright.config.ts)
timeout: 180000, // 3 minutes

# Or run with more retries
playwright test --retries=3
```

### Disk Space Issues

```bash
# Clean old artifacts
rm -rf apps/admin/demo-artifacts
rm -rf apps/admin/test-results
rm -rf apps/admin/playwright-report

# Clean npm cache
pnpm store prune
```

### Videos Not Recording

```bash
# Verify CI mode is OFF
echo $CI  # Should be empty or false

# Check config
grep "video:" apps/admin/playwright.config.ts
# Should see: video: isCI ? 'off' : 'on',

# Ensure ffmpeg installed
which ffmpeg || brew install ffmpeg
```

---

## Best Practices

### For Development

1. **Before every push**: Run `pnpm run e2e:smoke`
2. **Before releases**: Run `pnpm run e2e:evidence`
3. **Weekly**: Regenerate evidence package to keep current

### For Buyer Presentations

1. **24 hours before demo**: Generate fresh evidence
2. **Upload to secure location**: S3, Dropbox, Google Drive
3. **Test extraction**: Verify package integrity
4. **Prepare walkthrough**: Know which flows to highlight

### For Continuous Improvement

1. **Review failures immediately**: Don't let technical debt accumulate
2. **Update tests with features**: Keep coverage current
3. **Document new flows**: Update COMPLETE_BUYER_PACKAGE_MASTER_INDEX.md

---

## Evidence Package Locations

### Gitignored (Not in Repository)

These directories are excluded from git to prevent bloat:

- `apps/admin/demo-artifacts/`
- `apps/admin/test-results/`
- `apps/admin/playwright-report/`

### Storage Recommendations

**For Internal Use:**
- Store on shared drive: `/shared/nimbus-evidence/`
- Version by date: `nimbus-evidence-2026-01-08.tar.gz`
- Keep last 3 months of packages

**For Buyer Distribution:**
- Upload to S3: `s3://nimbus-buyer-packages/`
- Generate signed URL with 7-day expiration
- Send via secure email or data room

**For Licensee Handoff:**
- Include in final delivery package
- Provide instructions for regeneration
- Show them this document

---

## Regenerating Evidence as Licensee

After handoff, licensees can regenerate evidence:

```bash
# 1. Clone repository
git clone https://github.com/SDawson777/nimbus-cms.git
cd nimbus-cms

# 2. Install dependencies
npx pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with production credentials

# 4. Start backend
cd server && pnpm run dev

# 5. Generate evidence
cd ../apps/admin
pnpm run e2e:evidence:clean

# 6. Create package
pnpm run e2e:package
```

---

## Package Distribution

### Creating Shareable Link

```bash
# Upload to S3
aws s3 cp nimbus-e2e-evidence-*.tar.gz s3://buyer-packages/ \
  --metadata "generated=$(date +%Y-%m-%d)"

# Generate presigned URL (7 day expiration)
aws s3 presign s3://buyer-packages/nimbus-e2e-evidence-*.tar.gz \
  --expires-in 604800

# Or use Dropbox
dropbox-cli upload nimbus-e2e-evidence-*.tar.gz /Buyer-Packages/
dropbox-cli share /Buyer-Packages/nimbus-e2e-evidence-*.tar.gz
```

### Verification Checklist

Before sending to buyer:

- [ ] Package size is ~44MB (use `ls -lh`)
- [ ] Extract test: `tar -tzf <package> | head -20`
- [ ] Contains all 36 flows
- [ ] HTML report opens correctly
- [ ] Videos play without errors
- [ ] Documentation files included

---

## FAQ

**Q: Why not commit evidence to repository?**  
A: 44MB × multiple runs = bloated repository. Generate on-demand instead.

**Q: How often should I regenerate?**  
A: Weekly for development, fresh before buyer meetings.

**Q: Can buyers run tests themselves?**  
A: Yes! Provide this guide and repository access.

**Q: What if tests fail locally?**  
A: Fix bugs before pushing. CI smoke tests will catch most issues.

**Q: How do I test against staging?**  
A: Set `E2E_BASE_URL='https://staging.example.com'` before running.

**Q: Can I run tests in Docker?**  
A: Yes, see `docs/DOCKER_E2E.md` (if created).

**Q: What's the difference between demo-artifacts and test-results?**  
A: `demo-artifacts` = timestamped raw outputs. `test-results` = Playwright's organized structure. Both are useful.

---

## Advanced Usage

### Running Specific Flows

```bash
# Single flow
playwright test tests/flow-33-heatmap-interaction.spec.ts

# Range of flows
playwright test tests/flow-{01..05}-*.spec.ts

# Pattern match
playwright test tests/flow-*-security-*.spec.ts
```

### Custom Evidence Package

```bash
# Include only critical flows
tar -czf security-evidence.tar.gz \
  test-results/flow-34-multi-tenant-*/ \
  test-results/flow-20-audit-security-*/ \
  test-results/flow-24-multi-tenant-*/

# Include documentation
tar -czf full-buyer-package.tar.gz \
  demo-artifacts/ \
  test-results/ \
  playwright-report/ \
  apps/admin/*.md \
  docs/*.md \
  README.md
```

### Automated Scheduled Generation

```bash
# Add to crontab for weekly generation
0 2 * * 0 cd /path/to/nimbus-cms/apps/admin && \
  pnpm run e2e:evidence:clean && \
  pnpm run e2e:package
```

---

## Performance Tips

### Faster Test Runs

```bash
# Use more workers (if machine has capacity)
playwright test --workers=4

# Run headless (faster than headed)
playwright test # (default is headless)

# Skip slow tests during development
playwright test --grep-invert "@slow"
```

### Reduce Artifact Size

```bash
# Lower video quality
# Edit playwright.config.ts:
video: {
  mode: 'on',
  size: { width: 640, height: 480 } // Smaller resolution
}

# Compress artifacts after generation
tar -czf evidence.tar.gz test-results/
```

---

## Integration with CI/CD

### GitHub Actions (Current Setup)

```yaml
# .github/workflows/enterprise-checks.yml
- name: Run smoke tests (NO recordings)
  run: CI=true pnpm test:e2e
  # CI=true disables video/trace in playwright.config.ts
```

### Future: Nightly Full Suite

If you want to run full suite nightly on external CI:

```yaml
# .github/workflows/nightly-evidence.yml
name: Nightly Evidence Generation
on:
  schedule:
    - cron: '0 2 * * *' # 2 AM daily

jobs:
  full-suite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm -C apps/admin run e2e:evidence
      - uses: actions/upload-artifact@v4
        with:
          name: nightly-evidence
          path: apps/admin/test-results/
          retention-days: 90
```

---

## Related Documentation

- **COMPLETE_BUYER_PACKAGE_MASTER_INDEX.md** - Overview of all flows
- **ENHANCED_VISUAL_PROOF_TESTS_SUMMARY.md** - Flows 33-36 details
- **STRATEGIC_ENTERPRISE_FLOWS_SUMMARY.md** - Flows 23-32 CTO validation
- **CI_CD_STRATEGY.md** - Why we separate CI from evidence generation

---

## Support

**Questions?**  
- Check FAQ above
- Review test files in `apps/admin/tests/`
- Contact DevOps team

**Issues?**  
- Create GitHub issue with `[E2E]` prefix
- Include: error message, flow number, screenshots
- Attach relevant logs from `playwright-report/`

---

**Last Updated**: January 8, 2026  
**Maintained By**: DevOps Team  
**Version**: 1.0.0
