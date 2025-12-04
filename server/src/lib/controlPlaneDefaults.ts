import { PersistedControlPlaneState } from "./controlPlanePersistence";
import {
  TenantRecord,
  StoreRecord,
  ThemeSettings,
  BehaviorSettings,
  AuditLogEntry,
} from "./controlPlaneTypes";

const now = () => new Date().toISOString();

const defaultTenantId = "tenant-demo-001";
const defaultStoreId = "store-demo-001";

const tenants: TenantRecord[] = [
  {
    id: defaultTenantId,
    name: "Nimbus Demo Org",
    slug: "nimbus-demo",
    domains: ["admin.nimbus-demo.test"],
    dataset: "nimbus_demo",
    status: "active",
    featureFlags: { journal: true, aiConcierge: true, loyalty: false },
    createdAt: now(),
    updatedAt: now(),
    version: 1,
    deletedAt: null,
  },
];

const stores: StoreRecord[] = [
  {
    id: defaultStoreId,
    tenantId: defaultTenantId,
    name: "Nimbus Demo - Downtown",
    slug: "nimbus-demo-downtown",
    address: "123 Cloud Ave, Detroit, MI",
    timezone: "America/Detroit",
    region: "MI",
    live: true,
    delivery: true,
    pickup: true,
    pos: { provider: "MockPOS" },
    hours: "9am - 9pm",
    createdAt: now(),
    updatedAt: now(),
    version: 1,
    deletedAt: null,
  },
];

const themes: ThemeSettings[] = [
  {
    tenantId: defaultTenantId,
    palette: {
      primaryColor: "#3b82f6",
      accentColor: "#22c55e",
      backgroundColor: "#0b1222",
      surfaceColor: "#0f172a",
      textColor: "#e5e7eb",
    },
    typography: {
      fontFamily: "Inter, sans-serif",
      headingFont: "Space Grotesk",
    },
    mode: "dark",
    assets: { logoUrl: "/nimbus-icon.svg" },
    updatedAt: now(),
    version: 1,
  },
];

const behaviors: BehaviorSettings[] = [
  {
    tenantId: defaultTenantId,
    featureFlags: {
      aiConcierge: true,
      journaling: true,
      loyalty: false,
      previewMode: false,
    },
    notifications: {
      delivery: ["email", "in-app"],
      frequency: "hourly",
      triggers: ["revenue-spike", "error-spike"],
    },
    personalization: {
      strategy: "hybrid",
      weightPurchaseHistory: 0.5,
      weightBrowsing: 0.3,
      weightContext: 0.2,
    },
    legal: { reacceptOnUpdate: true, ageGate: 21 },
    caching: { aggressive: false, previewMode: false },
    updatedAt: now(),
    version: 1,
  },
];

export const defaultControlPlaneState: PersistedControlPlaneState<
  TenantRecord,
  StoreRecord,
  ThemeSettings,
  BehaviorSettings,
  AuditLogEntry
> = {
  tenants,
  stores,
  themes,
  behaviors,
  auditLog: [],
};

export const defaultDemoTheme = themes[0];
