import React from 'react'
import MetricsOverview from './MetricsOverview'
import TrafficChart from './TrafficChart'
import SalesChart from './SalesChart'
import EngagementChart from './EngagementChart'

export default function Dashboard(){
  return (
    <div style={{padding:24}}>
      <h1 style={{marginBottom:24}}>Dashboard</h1>
      <MetricsOverview />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <TrafficChart />
        <SalesChart />
      </div>
      <div style={{marginTop:16}}>
        <EngagementChart />
      </div>
    </div>
  )
}
