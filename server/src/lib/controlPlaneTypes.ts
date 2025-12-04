export type TenantStatus = "active" | "trial" | "suspended";
export type FeatureFlags = Record<string, boolean>;

export type TenantRecord = {
  id: string;
  name: string;
  slug: string;
  domains: string[];
  dataset: string;
  status: TenantStatus;
  featureFlags: FeatureFlags;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  version: number;
  deletedAt?: string | null;
};

export type StoreRecord = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  address?: string;
  timezone?: string;
  region?: string;
  live: boolean;
  delivery: boolean;
  pickup: boolean;
  pos?: { provider?: string; endpoint?: string; token?: string };
  hours?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
  version: number;
  deletedAt?: string | null;
};

export type ThemeSettings = {
  tenantId: string;
  storeId?: string | null;
  palette: {
    primaryColor: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    surfaceColor?: string;
    textColor?: string;
  };
  typography?: { fontFamily?: string; headingFont?: string; baseSize?: string };
  mode?: "light" | "dark" | "auto";
  assets?: { logoUrl?: string; iconUrl?: string };
  updatedAt: string;
  updatedBy?: string;
  version: number;
};

export type BehaviorSettings = {
  tenantId: string;
  featureFlags: FeatureFlags;
  notifications: {
    delivery: string[];
    frequency: "realtime" | "hourly" | "daily";
    triggers: string[];
  };
  personalization: {
    strategy: "deals-first" | "education-first" | "hybrid";
    weightPurchaseHistory: number;
    weightBrowsing: number;
    weightContext: number;
  };
  legal: {
    reacceptOnUpdate: boolean;
    ageGate: number;
  };
  caching: {
    aggressive: boolean;
    previewMode: boolean;
  };
  updatedAt: string;
  updatedBy?: string;
  version: number;
};

export type AuditLogEntry = {
  id: string;
  action: string;
  subject: string;
  subjectId: string;
  actor?: string;
  at: string;
};
