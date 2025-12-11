import type {DashboardConfig} from '@sanity/dashboard'
import NimbusStatus from './NimbusStatus'
import QuickActions from './QuickActions'
import EditorialAI from './EditorialAI'
import EngagementMetrics from './EngagementMetrics'

export const nimbusDashboardConfig: DashboardConfig = {
  widgets: [
    {
      name: 'nimbus-status',
      layout: {width: 'full'},
      component: NimbusStatus,
    },
    {
      name: 'nimbus-editorial-ai',
      layout: {width: 'medium'},
      component: EditorialAI,
    },
    {
      name: 'nimbus-quick-actions',
      layout: {width: 'medium'},
      component: QuickActions,
    },
    {
      name: 'nimbus-engagement-metrics',
      layout: {width: 'full'},
      component: EngagementMetrics,
    },
  ],
}

export default nimbusDashboardConfig
