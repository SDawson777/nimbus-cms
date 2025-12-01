# Nimbus Admin SPA

Enterprise-grade admin panel for Nimbus CMS built with React + TypeScript + Vite.

## Architecture

- **Framework**: Vite + React 18 + TypeScript
- **Routing**: React Router v6
- **Design System**: Custom token-based theming with CSS variables
- **Charts**: Recharts for data visualization
- **Multi-tenant**: Context-based tenant switching with localStorage persistence

## Setup

### Prerequisites
- Node.js 18+
- Backend API running at `http://localhost:3000` (or configure via env)

### Installation

```bash
cd admin
npm install
```

### Environment Configuration

Create `admin/.env.local`:

```env
VITE_NIMBUS_API_URL=http://localhost:3000
```

Adjust the URL to your backend server.

### Development

```bash
npm run dev
```

App runs at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
admin/
├── src/
│   ├── app/              # Core app setup
│   │   ├── App.tsx       # Main app wrapper
│   │   ├── routes.tsx    # Route definitions
│   │   ├── layout/       # Shell components (Sidebar, Topbar)
│   │   └── theme/        # Design tokens & theme provider
│   ├── design-system/    # UI component library
│   │   └── ui/           # Button, Input, Card, Table, etc.
│   ├── modules/          # Feature modules
│   │   ├── dashboard/    # KPI metrics & charts
│   │   ├── content/      # Articles, deals, legal
│   │   ├── tenants/      # Multi-tenant manager
│   │   └── settings/     # Theme, API keys, workspace
│   ├── lib/              # API client, validators, auth
│   ├── hooks/            # Custom hooks (useTheme, useTenant)
│   └── assets/           # Icons, logos
└── public/
```

## Features

### Multi-tenant Support
- Tenant context with localStorage persistence
- Tenant-aware API calls via `api.tenantGet(tenantId, endpoint)`
- Workspace selector UI

### Design System
- Token-based theming (colors, spacing, typography, elevation)
- Light/dark mode ready (via `data-theme` attribute)
- Consistent component library: Button, Input, Select, Tabs, Badge, Modal, Drawer, Tooltip, Dropdown, FormField, Skeleton, Card, Table

### Modules
- **Dashboard**: KPI cards + Recharts (line, bar, area)
- **Content**: Articles, Deals, Legal docs
- **Tenants**: Tenant manager with create/switch
- **Settings**: Theme settings, API keys, workspace config

### Icons
Custom SVG icon set (20/24px, `stroke="currentColor"`):
- Home, Settings, Users, Chart, Document, Alert, Plus, Search, Check, ChevronDown

## API Integration

Base URL configured via `VITE_NIMBUS_API_URL`. Endpoints called:
- `/api/v1/nimbus/content/deals`
- `/admin/legal`
- Additional routes as needed

## Deployment

### Vercel

```bash
npm i -g vercel
vercel --prod
```

Or via Git integration with auto-deploy from `main`.

## Known Issues

- Sanity init: Use `npx sanity init` (not `sanity-innit`)
- Vercel CLI: Install globally or use `npx vercel`

## License

Proprietary — Nimbus CMS
