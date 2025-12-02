import React, {useEffect, useState} from 'react'
import Table from '@/design-system/ui/Table'
import {api} from '@/lib/api'

export default function DealsIndex() {
  const [items, setItems] = useState<any[]>([])
  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get('/api/v1/nimbus/content/deals')
        setItems(Array.isArray(res) ? res : [])
      } catch (e) {
        console.warn(e)
      }
    })()
  }, [])
  return (
    <div>
      <h1>Deals</h1>
      <Table
        columns={[
          {key: 'title', label: 'Title'},
          {key: 'slug', label: 'Slug'},
          {key: 'priority', label: 'Priority'},
        ]}
        data={items}
      />
    </div>
  )
}
