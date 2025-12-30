# Contributing to Nimbus CMS

## Monorepo Structure

- `server/` – Express + TypeScript API (Railway)
- `apps/admin/` – React + Vite Admin SPA (Vercel)
- `apps/studio/` – Sanity Studio v4 (Vercel)

## Package Manager

Use pnpm workspaces.

```bash
npm install -g pnpm
pnpm install
```

## Development

```bash
# API
pnpm --filter server dev

# Admin
pnpm --filter admin dev

# Studio
pnpm --filter studio dev
```

## Builds

```bash
pnpm --filter server build
pnpm --filter admin build
pnpm --filter studio build
```

## Testing

If test scripts exist, run via pnpm filters per workspace.

## Code Style & Types

- TypeScript strict in `server/`.
- Prefer Zod for validation.
- Centralized error handling.
- Do not introduce `any`; use `unknown` + narrowing.

## CI Expectations

- PRs must pass CI builds for all workspaces.

## Secrets & environment variables

- Client-visible environment variables are prefixed with `VITE_` and are embedded
	into browser JavaScript by the build. Do NOT place secrets (API tokens, private
	Mapbox tokens, JWT secrets, preview secrets) in `VITE_` variables.
- Keep sensitive values on the server side (no `VITE_` prefix). Example: set
	`PREVIEW_SECRET`, `JWT_SECRET`, `MAPBOX_TOKEN` in your deployment environment
	(Kubernetes secret, Railway/Render secret, GitHub Action secret), not in
	client env files.
- Use `pnpm run validate-env` locally to check your environment and to detect
	accidentally exposed `VITE_` secrets. CI already runs `pnpm audit:client-envs`
	to catch common misconfigurations.
