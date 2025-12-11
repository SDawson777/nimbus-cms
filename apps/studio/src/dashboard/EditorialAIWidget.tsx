import React from 'react'
import {Card, Stack, Heading, Text, Inline, Badge} from '@sanity/ui'

export function EditorialAIWidget() {
  return (
    <Card padding={4} radius={3} shadow={1} tone="transparent">
      <Stack space={3}>
        <Heading size={2}>Editorial Intelligence</Heading>
        <Text size={1} muted>
          Guidance is generated from your best-performing content segments
          (sessions, CTR, completion). Use these prompts while editing
          articles, FAQs, and product copy.
        </Text>
        <Stack space={3}>
          <Card padding={3} radius={2} tone="primary" shadow={1}>
            <Stack space={2}>
              <Inline space={2}>
                <Badge mode="outline" tone="primary">
                  Articles
                </Badge>
                <Text size={1} muted>
                  Conversion uplift
                </Text>
              </Inline>
              <Text size={1}>
                Focus on “how-to” formats and use simple, outcome-focused
                headlines. Keep paragraphs under 3 lines for mobile users.
              </Text>
            </Stack>
          </Card>
          <Card padding={3} radius={2} tone="caution" shadow={1}>
            <Stack space={2}>
              <Inline space={2}>
                <Badge mode="outline" tone="caution">
                  Compliance
                </Badge>
                <Text size={1} muted>
                  Safety-first
                </Text>
              </Inline>
              <Text size={1}>
                Avoid medical claims. Emphasize effects using broad,
                experiential language and defer to legal pages for any
                required disclaimers.
              </Text>
            </Stack>
          </Card>
          <Card padding={3} radius={2} tone="positive" shadow={1}>
            <Stack space={2}>
              <Inline space={2}>
                <Badge mode="outline" tone="positive">
                  Deals & promos
                </Badge>
                <Text size={1} muted>
                  Loyalty driven
                </Text>
              </Inline>
              <Text size={1}>
                Tie promotions to loyalty milestones rather than pure
                discounts. Position value as “members-only” to protect
                margin while increasing retention.
              </Text>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </Card>
  )
}
