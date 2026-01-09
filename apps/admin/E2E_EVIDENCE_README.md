# E2E Evidence Generation

## 📍 You Are Here

This directory structure holds E2E test evidence (videos, traces, screenshots).

**Current Status**: These directories are **gitignored** (not committed to repository).

---

## Why Gitignored?

Evidence packages are ~44MB per generation. Committing them would bloat the repository.

**Instead**: Evidence is generated on-demand locally and stored externally.

---

## How to Generate Evidence

### Quick Start

```bash
# Terminal 1: Start backend
cd server
pnpm run dev

# Terminal 2: Generate evidence
cd apps/admin
pnpm run e2e:evidence:clean
```

**Duration**: ~45 minutes  
**Output**: This directory will be populated with:
- `demo-artifacts/` - Raw test outputs (~5MB)
- `test-results/` - Organized Playwright results (~30MB)
- `playwright-report/` - Interactive HTML report (~9MB)

---

## Create Downloadable Package

```bash
cd apps/admin
pnpm run e2e:package

# Creates: ../nimbus-e2e-evidence-YYYYMMDD-HHMMSS.tar.gz (~44MB)
```

---

## Where Evidence Lives

### Development
- **Local Machine**: Generated in `apps/admin/` (gitignored)
- **Duration**: Regenerate weekly or before important demos

### Distribution
- **Internal**: Store on shared drive `/shared/nimbus-evidence/`
- **Buyers**: Upload to S3 with presigned URLs
- **Licensees**: Provide repository + this guide for regeneration

---

## Directory Structure (When Generated)

```
apps/admin/
├── demo-artifacts/              # ← You are here (when generated)
│   └── 20260108-123456/
│       ├── test-results.json
│       ├── flow-01-video.webm
│       └── ... (36 flows)
├── test-results/                # Playwright organized results
│   ├── flow-01-login/
│   │   ├── video.webm
│   │   ├── trace.zip
│   │   └── screenshots/
│   └── ... (36 flows)
└── playwright-report/           # HTML report
    └── index.html
```

---

## Commands Reference

```bash
# Smoke tests (flows 1-5, 5 min)
pnpm run e2e:smoke

# Full suite (flows 1-36, 45 min)
pnpm run e2e:evidence

# Clean and regenerate
pnpm run e2e:evidence:clean

# View HTML report
pnpm run e2e:report

# Create package
pnpm run e2e:package
```

---

## For More Information

See: **docs/LOCAL_E2E_TESTING.md** - Comprehensive guide

---

## FAQ

**Q: Why is this directory empty in git?**  
A: Evidence is generated locally on-demand, not committed.

**Q: How do buyers get evidence?**  
A: We generate it locally and send them a download link.

**Q: Can licensees regenerate evidence?**  
A: Yes! They get the repository and can run the same commands.

**Q: What about CI/CD?**  
A: CI runs smoke tests WITHOUT recordings (fast). Local generates evidence (comprehensive).

---

**Last Updated**: January 8, 2026
