import { logger } from "./logger";

export type DashboardLayout = {
  order: string[];
  hidden: string[];
  favorites: string[];
};

export type NotificationPreferences = {
  channels: {
    sms: boolean;
    email: boolean;
    inApp: boolean;
  };
  frequency: "realtime" | "hourly" | "daily" | "weekly";
  triggers: string[];
};

const defaultLayout: DashboardLayout = {
  order: [
    "traffic",
    "revenue",
    "engagement",
    "demand",
    "products",
    "faqs",
    "stores",
    "heatmap",
  ],
  hidden: [],
  favorites: ["traffic", "revenue", "engagement"],
};

const defaultNotifications: NotificationPreferences = {
  channels: { sms: false, email: true, inApp: true },
  frequency: "daily",
  triggers: ["revenue_spike", "error_rate", "store_offline"],
};

const layoutStore = new Map<string, DashboardLayout>();
const notificationStore = new Map<string, NotificationPreferences>();

export function getDashboardLayout(
  adminId: string | null | undefined,
): DashboardLayout {
  if (!adminId) return defaultLayout;
  return layoutStore.get(adminId) || defaultLayout;
}

export function saveDashboardLayout(
  adminId: string | null | undefined,
  layout: DashboardLayout,
) {
  const normalized: DashboardLayout = {
    order: Array.from(
      new Set(layout.order.length ? layout.order : defaultLayout.order),
    ),
    hidden: Array.from(new Set(layout.hidden || [])),
    favorites: Array.from(new Set(layout.favorites || [])),
  };
  if (!adminId) {
    logger.warn("dashboard layout saved without admin id; ignoring");
    return;
  }
  layoutStore.set(adminId, normalized);
}

export function getNotificationPreferences(
  adminId: string | null | undefined,
): NotificationPreferences {
  if (!adminId) return defaultNotifications;
  return notificationStore.get(adminId) || defaultNotifications;
}

export function saveNotificationPreferences(
  adminId: string | null | undefined,
  prefs: NotificationPreferences,
) {
  if (!adminId) {
    logger.warn("notification preferences saved without admin id; ignoring");
    return;
  }
  notificationStore.set(adminId, prefs);
}

export function getDefaults() {
  return { defaultLayout, defaultNotifications };
}
