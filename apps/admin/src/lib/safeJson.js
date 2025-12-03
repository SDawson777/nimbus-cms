export async function safeJson(res, fallback = null) {
  if (!res) return fallback
  const contentType = res.headers?.get?.('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return await res.json()
    } catch (err) {
      console.warn('Failed to parse JSON response', err)
      return fallback
    }
  }
  const preview = await res.text().catch(() => '')
  console.warn('Expected JSON but received non-JSON content', {
    status: res.status,
    contentType,
    preview: preview.slice(0, 180),
  })
  return fallback
}
