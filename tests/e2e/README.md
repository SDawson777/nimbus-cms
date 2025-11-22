# E2E tests (skeleton)

This folder is reserved for end-to-end tests (for example, Playwright or Cypress) that exercise the Admin SPA and API together.

Recommended initial scenarios:

- Admin login flow (JWT + CSRF issuance).
- Viewing analytics overview dashboard.
- Triggering a compliance snapshot from the Admin UI and verifying the overview updates.
- Editing theme settings and verifying the stored config through the content API.

These tests are not yet implemented but can be added without changing the core application code.
