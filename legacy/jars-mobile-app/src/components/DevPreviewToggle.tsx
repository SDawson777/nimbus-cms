import React from 'react'
import {Pressable, Text} from 'react-native'
type Props = {active: boolean; onToggle: () => void}
export default function DevPreviewToggle({active, onToggle}: Props) {
  return (
    <Pressable
      accessibilityLabel="Toggle CMS Preview"
      onPress={onToggle}
      style={{padding: 8, alignSelf: 'flex-end'}}
    >
      <Text>{active ? 'Preview ON' : 'Preview OFF'}</Text>
    </Pressable>
  )
}
