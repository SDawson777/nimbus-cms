import React from 'react'
import Card from '@/design-system/ui/Card'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts'

const data = [
  {name:'Mon', revenue:1200}, {name:'Tue', revenue:1900}, {name:'Wed', revenue:1500},
  {name:'Thu', revenue:2200}, {name:'Fri', revenue:2700}, {name:'Sat', revenue:1800}, {name:'Sun', revenue:1400}
]

export default function SalesChart(){
  return (
    <Card>
      <div style={{marginBottom:8,fontWeight:600}}>Revenue (7d)</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="revenue" fill="#3F7AFC" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
