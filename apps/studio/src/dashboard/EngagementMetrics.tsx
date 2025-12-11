import React, {useEffect, useState} from 'react'
import {Card, Flex, Stack, Text, Badge} from '@sanity/ui'
import {useClient} from 'sanity'

type MetricState = {
  productCount: number
  contentCount: number
  orderCount: number
}

const EngagementMetrics: React.FC = () => {
  const client = useClient({apiVersion: '2024-08-01'})
  const [metrics, setMetrics] = useState<MetricState | null>(null)

  useEffect(() => {
    const run = async () => {
      // Very lightweight count queries against Sanity content types used in demo
      const [productCount, contentCount] = await Promise.all([
        client.fetch<number>('count(*[_type == "product"])'),
        client.fetch<number>('count(*[_type == "contentPage"])'),
      ])

      // For orders, we assume an API endpoint; demo uses static value
      const orderCount = 48
      setMetrics({productCount, contentCount, orderCount})
    }
    run().catch((err) => {
      console.error('EngagementMetrics error', err)
    })
  }, [client])

  return (
    <Card padding={4} radius={3}>
      <Stack space={3}>
        <Text size={2} weight="semibold">
          Engagement snapshot (demo)
        </Text>
        {!metrics ? (
          <Text size={1} muted>
            Loading metrics…
          </Text>
        ) : (
          <Flex gap={4}>
            <Stack space={1}>
              <Text size={1} muted>
                Products live
              </Text>
              <Text size={3}>{metrics.productCount}</Text>
            </Stack>
            <Stack space={1}>
              <Text size={1} muted>
                Content pages
              </Text>
              <Text size={3}>{metrics.contentCount}</Text>
            </Stack>
            <Stack space={1}>
              <Text size={1} muted>
                Orders (demo 30d)
              </Text>
              <Badge tone="positive">{metrics.orderCount}</Badge>
            </Stack>
          </Flex>
        )}
        <Text size={1} muted>
          This gives buyers an instant sense of catalogue size, editorial depth, and commerce
          activity without leaving the Studio.
        </Text>
      </Stack>
    </Card>
  )
}

export default EngagementMetrics
