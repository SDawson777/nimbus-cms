import React from 'react'
import {Card, Stack, Heading, Button, Inline, Text} from '@sanity/ui'
import {useRouter} from 'sanity/router'

export function QuickActionsWidget() {
  const router = useRouter()
  const go = (structurePath: string) => () => {
    router.navigateIntent('edit', {id: structurePath})
  }

  return (
    <Card padding={4} radius={3} shadow={1} tone="transparent">
      <Stack space={3}>
        <Heading size={2}>Quick Actions</Heading>
        <Text size={1} muted>
          Single-click access to high-signal areas for daily operations.
        </Text>
        <Inline space={2} wrap>
          <Button
            mode="ghost"
            padding={3}
            text="Manage Homepage"
            onClick={() => router.navigateUrl('/structure/page-home')}
          />
          <Button
            mode="ghost"
            padding={3}
            text="Edit Deals"
            onClick={() => router.navigateUrl('/structure/deals')}
          />
          <Button
            mode="ghost"
            padding={3}
            text="FAQs"
            onClick={() => router.navigateUrl('/structure/faqs')}
          />
          <Button
            mode="ghost"
            padding={3}
            text="Legal & Compliance"
            onClick={() => router.navigateUrl('/structure/legal')}
          />
        </Inline>
      </Stack>
    </Card>
  )
}
