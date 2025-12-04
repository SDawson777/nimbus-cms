import { v4 as uuid } from "uuid";
import {
  readControlPlaneState,
  writeControlPlaneState,
  PersistedControlPlaneState,
} from "./controlPlanePersistence";
import { defaultControlPlaneState } from "./controlPlaneDefaults";
import {
  AuditLogEntry,
  BehaviorSettings,
  FeatureFlags,
  StoreRecord,
  TenantRecord,
  TenantStatus,
  ThemeSettings,
} from "./controlPlaneTypes";

type ControlPlaneState = PersistedControlPlaneState<
  TenantRecord,
  StoreRecord,
  ThemeSettings,
  BehaviorSettings,
  AuditLogEntry
>;

const state: ControlPlaneState = {
  tenants: [],
  stores: [],
  themes: [],
  behaviors: [],
  auditLog: [],
};

let hydrated = false;

function now() {
  return new Date().toISOString();
}

async function persist() {
  await writeControlPlaneState(state);
}

async function recordAudit(
  action: string,
  subject: string,
  subjectId: string,
  actor?: string,
) {
  const entry: AuditLogEntry = {
    id: uuid(),
    action,
    subject,
    subjectId,
    actor,
    at: now(),
  };
  state.auditLog.unshift(entry);
  state.auditLog = state.auditLog.slice(0, 500);
}

async function hydrateIfNeeded() {
  if (hydrated) return;
  const loaded = await readControlPlaneState<
    TenantRecord,
    StoreRecord,
    ThemeSettings,
    BehaviorSettings,
    AuditLogEntry
  >(defaultControlPlaneState);
  state.tenants = loaded.tenants || [];
  state.stores = loaded.stores || [];
  state.themes = loaded.themes || [];
  state.behaviors = loaded.behaviors || [];
  state.auditLog = loaded.auditLog || [];
  hydrated = true;
}

function assertSlugUnique(
  slug: string,
  tenantId?: string,
  excludeId?: string,
  subject: "tenant" | "store" = "tenant",
) {
  const slugValue = slug.trim().toLowerCase();
  if (subject === "tenant") {
    if (
      state.tenants.some(
        (t) =>
          !t.deletedAt &&
          t.slug.toLowerCase() === slugValue &&
          t.id !== excludeId,
      )
    )
      throw new Error("TENANT_SLUG_CONFLICT");
  } else {
    if (
      state.stores.some(
        (s) =>
          !s.deletedAt &&
          s.slug.toLowerCase() === slugValue &&
          s.tenantId === tenantId &&
          s.id !== excludeId,
      )
    )
      throw new Error("STORE_SLUG_CONFLICT");
  }
}

function sanitizeDomains(domains: string[]) {
  return domains
    .map((d) => d.trim())
    .filter(Boolean)
    .filter((d, idx, arr) => arr.indexOf(d) === idx);
}

export async function listTenants(includeDeleted = false) {
  await hydrateIfNeeded();
  return state.tenants.filter((t) => includeDeleted || !t.deletedAt);
}

export type UpsertTenantOptions = {
  actorId?: string;
  expectedVersion?: number;
};

export async function upsertTenant(
  input: Omit<
    TenantRecord,
    "id" | "createdAt" | "updatedAt" | "version" | "deletedAt"
  > & {
    id?: string;
    version?: number;
  },
  options: UpsertTenantOptions = {},
): Promise<TenantRecord> {
  await hydrateIfNeeded();
  assertSlugUnique(input.slug, undefined, input.id, "tenant");
  const ts = now();
  const version = (input.version ?? 0) + 1;

  if (input.id) {
    const existingIdx = state.tenants.findIndex((t) => t.id === input.id);
    if (existingIdx >= 0) {
      const existing = state.tenants[existingIdx];
      if (
        options.expectedVersion &&
        existing.version !== options.expectedVersion
      )
        throw new Error("VERSION_CONFLICT");
      const updated: TenantRecord = {
        ...existing,
        ...input,
        domains: sanitizeDomains(input.domains || []),
        id: existing.id,
        updatedAt: ts,
        updatedBy: options.actorId,
        version,
        deletedAt: null,
      };
      state.tenants[existingIdx] = updated;
      await recordAudit(
        "tenant.updated",
        "tenant",
        updated.id,
        options.actorId,
      );
      await persist();
      return updated;
    }
  }

  const record: TenantRecord = {
    ...input,
    domains: sanitizeDomains(input.domains || []),
    id: input.id || uuid(),
    createdAt: ts,
    updatedAt: ts,
    updatedBy: options.actorId,
    version,
    deletedAt: null,
  };
  state.tenants.push(record);
  await recordAudit("tenant.created", "tenant", record.id, options.actorId);
  await persist();
  return record;
}

export async function deleteTenant(id: string, actorId?: string) {
  await hydrateIfNeeded();
  const idx = state.tenants.findIndex((t) => t.id === id && !t.deletedAt);
  if (idx === -1) return false;
  const ts = now();
  state.tenants[idx].deletedAt = ts;
  state.tenants[idx].version += 1;
  state.tenants[idx].updatedAt = ts;
  state.tenants[idx].updatedBy = actorId;
  state.stores
    .filter((s) => s.tenantId === id && !s.deletedAt)
    .forEach((s) => {
      s.deletedAt = ts;
      s.version += 1;
      s.updatedAt = ts;
      s.updatedBy = actorId;
    });
  await recordAudit("tenant.deleted", "tenant", id, actorId);
  await persist();
  return true;
}

export async function listStores(tenantId?: string, includeDeleted = false) {
  await hydrateIfNeeded();
  return state.stores.filter(
    (s) =>
      (includeDeleted || !s.deletedAt) &&
      (!tenantId || s.tenantId === tenantId),
  );
}

export type UpsertStoreOptions = { actorId?: string; expectedVersion?: number };

export async function upsertStore(
  input: Omit<
    StoreRecord,
    "id" | "createdAt" | "updatedAt" | "version" | "deletedAt"
  > & {
    id?: string;
    version?: number;
  },
  options: UpsertStoreOptions = {},
): Promise<StoreRecord> {
  await hydrateIfNeeded();
  const tenant = state.tenants.find(
    (t) => t.id === input.tenantId && !t.deletedAt,
  );
  if (!tenant) throw new Error("TENANT_NOT_FOUND");
  if (tenant.status === "suspended") throw new Error("TENANT_SUSPENDED");
  assertSlugUnique(input.slug, input.tenantId, input.id, "store");
  const ts = now();
  const version = (input.version ?? 0) + 1;

  if (input.id) {
    const existingIdx = state.stores.findIndex((s) => s.id === input.id);
    if (existingIdx >= 0) {
      const existing = state.stores[existingIdx];
      if (
        options.expectedVersion &&
        existing.version !== options.expectedVersion
      )
        throw new Error("VERSION_CONFLICT");
      const updated: StoreRecord = {
        ...existing,
        ...input,
        id: existing.id,
        updatedAt: ts,
        updatedBy: options.actorId,
        version,
        deletedAt: null,
      };
      state.stores[existingIdx] = updated;
      await recordAudit("store.updated", "store", updated.id, options.actorId);
      await persist();
      return updated;
    }
  }

  const record: StoreRecord = {
    ...input,
    id: input.id || uuid(),
    createdAt: ts,
    updatedAt: ts,
    updatedBy: options.actorId,
    version,
    deletedAt: null,
  };
  state.stores.push(record);
  await recordAudit("store.created", "store", record.id, options.actorId);
  await persist();
  return record;
}

export async function deleteStore(id: string, actorId?: string) {
  await hydrateIfNeeded();
  const idx = state.stores.findIndex((s) => s.id === id && !s.deletedAt);
  if (idx === -1) return false;
  const ts = now();
  state.stores[idx].deletedAt = ts;
  state.stores[idx].version += 1;
  state.stores[idx].updatedAt = ts;
  state.stores[idx].updatedBy = actorId;
  await recordAudit("store.deleted", "store", id, actorId);
  await persist();
  return true;
}

export async function getTheme(tenantId: string, storeId?: string | null) {
  await hydrateIfNeeded();
  return state.themes.find(
    (t) =>
      t.tenantId === tenantId && (storeId ? t.storeId === storeId : !t.storeId),
  );
}

export async function saveTheme(
  payload: ThemeSettings,
  options: { actorId?: string; expectedVersion?: number } = {},
) {
  await hydrateIfNeeded();
  const ts = now();
  const version = (payload.version ?? 0) + 1;
  const existing = await getTheme(payload.tenantId, payload.storeId || null);
  if (existing) {
    if (options.expectedVersion && existing.version !== options.expectedVersion)
      throw new Error("VERSION_CONFLICT");
    Object.assign(existing, payload, {
      updatedAt: ts,
      updatedBy: options.actorId,
      version,
    });
    await recordAudit(
      "theme.updated",
      "theme",
      `${payload.tenantId}:${payload.storeId || "root"}`,
      options.actorId,
    );
    await persist();
    return existing;
  }
  const next = {
    ...payload,
    updatedAt: ts,
    updatedBy: options.actorId,
    version,
  };
  state.themes.push(next);
  await recordAudit(
    "theme.created",
    "theme",
    `${payload.tenantId}:${payload.storeId || "root"}`,
    options.actorId,
  );
  await persist();
  return next;
}

export async function getBehavior(tenantId: string) {
  await hydrateIfNeeded();
  return state.behaviors.find((b) => b.tenantId === tenantId);
}

export async function saveBehavior(
  payload: BehaviorSettings,
  options: { actorId?: string; expectedVersion?: number } = {},
) {
  await hydrateIfNeeded();
  const ts = now();
  const version = (payload.version ?? 0) + 1;
  const existing = await getBehavior(payload.tenantId);
  if (existing) {
    if (options.expectedVersion && existing.version !== options.expectedVersion)
      throw new Error("VERSION_CONFLICT");
    Object.assign(existing, payload, {
      updatedAt: ts,
      updatedBy: options.actorId,
      version,
    });
    await recordAudit(
      "behavior.updated",
      "behavior",
      payload.tenantId,
      options.actorId,
    );
    await persist();
    return existing;
  }
  const next = {
    ...payload,
    updatedAt: ts,
    updatedBy: options.actorId,
    version,
  };
  state.behaviors.push(next);
  await recordAudit(
    "behavior.created",
    "behavior",
    payload.tenantId,
    options.actorId,
  );
  await persist();
  return next;
}

export async function getAuditLog(limit = 100) {
  await hydrateIfNeeded();
  return state.auditLog.slice(0, limit);
}

export type {
  TenantRecord,
  StoreRecord,
  ThemeSettings,
  BehaviorSettings,
  TenantStatus,
  FeatureFlags,
  AuditLogEntry,
} from "./controlPlaneTypes";
