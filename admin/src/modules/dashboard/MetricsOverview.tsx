import React from 'react'
import Card from '@/design-system/ui/Card'

const KPI = ({label, value}: {label: string; value: string}) => (
  <Card>
    <div style={{fontSize: 12, color: 'var(--color-neutral500)'}}>{label}</div>
    <div style={{fontSize: 24, fontWeight: 700}}>{value}</div>
  </Card>
)

export default function MetricsOverview() {
  return (
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 16, marginBottom: 16}}>
      <KPI label="Daily Active Users" value="1,245" />
      <KPI label="Conversion Rate" value="3.2%" />
      <KPI label="Avg Order Value" value="$58.40" />
      <KPI label="Retention 30d" value="42%" />
      <KPI label="Articles Published" value="216" />
      <KPI label="Deal Engagement" value="1.8k" />
    </div>
  )
}
