import {apiJson, apiBaseUrl} from './api'

export const DEFAULT_LAYOUT = {
  order: ['traffic', 'revenue', 'engagement', 'demand', 'products', 'faqs', 'stores', 'heatmap'],
  hidden: [],
  favorites: ['traffic', 'revenue', 'engagement'],
}

export const DEFAULT_NOTIFICATION_PREFS = {
  channels: {sms: false, email: true, inApp: true},
  frequency: 'daily',
  triggers: ['revenue_spike', 'error_rate', 'store_offline'],
}

export async function fetchDashboardLayout() {
  if (!apiBaseUrl()) return {layout: DEFAULT_LAYOUT, defaults: DEFAULT_LAYOUT}
  const {ok, data} = await apiJson('/api/admin/preferences/dashboard')
  if (!ok || !data) return {layout: DEFAULT_LAYOUT, defaults: DEFAULT_LAYOUT}
  return {layout: data.layout || DEFAULT_LAYOUT, defaults: data.defaults || DEFAULT_LAYOUT}
}

export async function saveDashboardLayout(layout) {
  if (!apiBaseUrl()) return {ok: true, layout}
  const {ok, data} = await apiJson('/api/admin/preferences/dashboard', {
    method: 'POST',
    body: JSON.stringify(layout),
  })
  return {ok, layout: data?.layout || layout}
}

export async function fetchNotificationPrefs() {
  if (!apiBaseUrl()) return {preferences: DEFAULT_NOTIFICATION_PREFS, defaults: DEFAULT_NOTIFICATION_PREFS}
  const {ok, data} = await apiJson('/api/admin/preferences/notifications')
  if (!ok || !data)
    return {preferences: DEFAULT_NOTIFICATION_PREFS, defaults: DEFAULT_NOTIFICATION_PREFS}
  return {preferences: data.preferences || DEFAULT_NOTIFICATION_PREFS, defaults: data.defaults || DEFAULT_NOTIFICATION_PREFS}
}

export async function saveNotificationPrefs(preferences) {
  if (!apiBaseUrl()) return {ok: true, preferences}
  const {ok, data} = await apiJson('/api/admin/preferences/notifications', {
    method: 'POST',
    body: JSON.stringify(preferences),
  })
  return {ok, preferences: data?.preferences || preferences}
}
