import React from 'react'
import MetricsOverview from './MetricsOverview'
import TrafficChart from './TrafficChart'
import SalesChart from './SalesChart'
import EngagementChart from './EngagementChart'

export default function Dashboard() {
  return (
    <div>
      <MetricsOverview />
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
        <TrafficChart />
        <SalesChart />
        <EngagementChart />
      </div>
    </div>
  )
}
