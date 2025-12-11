import React from 'react'
import {Card, Stack, Button, Text} from '@sanity/ui'
import {useRouter} from 'sanity'

const QuickActions: React.FC = () => {
  const router = useRouter()

  const goCreate = (type: string) => {
    router.navigateIntent('create', {type})
  }

  return (
    <Card padding={4} radius={3}>
      <Stack space={3}>
        <Text size={2} weight="semibold">
          Quick actions
        </Text>
        <Button text="New Product" mode="default" onClick={() => goCreate('product')} />
        <Button text="New Greenhouse Article" mode="ghost" onClick={() => goCreate('contentPage')} />
        <Button text="New Deal" mode="ghost" onClick={() => goCreate('deal')} />
        <Button text="New Legal Document" mode="ghost" onClick={() => goCreate('legalDocument')} />
      </Stack>
    </Card>
  )
}

export default QuickActions
