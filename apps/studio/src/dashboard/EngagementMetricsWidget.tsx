import React, {useEffect, useState} from 'react'
import {Card, Stack, Heading, Text, Inline, Badge} from '@sanity/ui'

type EngagementSnapshot = {
  rolling30dSessions: number
  rolling30dOrders: number
  topArticleTitle: string | null
  topArticleCtr: number | null
  topStoreName: string | null
  topStoreShare: number | null
}

const apiBase =
  process.env.SANITY_STUDIO_NIMBUS_API_URL ||
  process.env.SANITY_NIMBUS_API_URL ||
  'https://nimbus-api-demo.up.railway.app'

export function EngagementMetricsWidget() {
  const [snapshot, setSnapshot] = useState<EngagementSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(
          `${apiBase}/api/v1/nimbus/admin/analytics/snapshot`,
        )
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const json = await res.json()
        if (!cancelled) {
          setSnapshot({
            rolling30dSessions: json.rolling30dSessions ?? 0,
            rolling30dOrders: json.rolling30dOrders ?? 0,
            topArticleTitle: json.topArticleTitle ?? null,
            topArticleCtr: json.topArticleCtr ?? null,
            topStoreName: json.topStoreName ?? null,
            topStoreShare: json.topStoreShare ?? null,
          })
          setError(null)
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load metrics')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const id = setInterval(load, 120_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <Card padding={4} radius={3} shadow={1} tone="transparent">
      <Stack space={3}>
        <Heading size={2}>Engagement Snapshot (30 days)</Heading>
        {loading && <Text size={1}>Loading analytics…</Text>}
        {error && (
          <Text size={1} tone="critical">
            {error}
          </Text>
        )}
        {snapshot && (
          <Stack space={3}>
            <Inline space={4} wrap>
              <Stack space={1}>
                <Text size={1} muted>
                  Sessions
                </Text>
                <Text size={3}>{snapshot.rolling30dSessions}</Text>
              </Stack>
              <Stack space={1}>
                <Text size={1} muted>
                  Orders
                </Text>
                <Text size={3}>{snapshot.rolling30dOrders}</Text>
              </Stack>
            </Inline>
            <Inline space={4} wrap>
              <Stack space={1}>
                <Text size={1} muted>
                  Top Article
                </Text>
                <Text size={2}>
                  {snapshot.topArticleTitle || 'No data'}
                </Text>
                {snapshot.topArticleCtr != null && (
                  <Badge tone="primary" padding={2} radius={999}>
                    CTR {snapshot.topArticleCtr.toFixed(1)}%
                  </Badge>
                )}
              </Stack>
              <Stack space={1}>
                <Text size={1} muted>
                  Top Store
                </Text>
                <Text size={2}>
                  {snapshot.topStoreName || 'No data'}
                </Text>
                {snapshot.topStoreShare != null && (
                  <Badge tone="positive" padding={2} radius={999}>
                    {snapshot.topStoreShare.toFixed(1)}% of Orders
                  </Badge>
                )}
              </Stack>
            </Inline>
          </Stack>
        )}
      </Stack>
    </Card>
  )
}
