import React from 'react'
import Card from '@/design-system/ui/Card'
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts'

const data = [
  {name:'Jan', value:400}, {name:'Feb', value:300}, {name:'Mar', value:600},
  {name:'Apr', value:800}, {name:'May', value:700}, {name:'Jun', value:900}
]

export default function TrafficChart(){
  return (
    <Card>
      <div style={{marginBottom:8,fontWeight:600}}>Traffic (30d)</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3F7AFC" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
