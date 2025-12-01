import React from 'react'
import Card from '@/design-system/ui/Card'
import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts'

const data = [
  {name:'Week 1', engagement:520}, {name:'Week 2', engagement:780}, {name:'Week 3', engagement:690},
  {name:'Week 4', engagement:950}
]

export default function EngagementChart(){
  return (
    <Card>
      <div style={{marginBottom:8,fontWeight:600}}>Engagement (30d)</div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="engagement" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
