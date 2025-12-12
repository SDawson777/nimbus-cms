import { defineConfig } from "@sanity/dashboard";
import { DocumentList } from "@sanity/dashboard-widget-document-list";
import NimbusStatus from "./dashboardWidgets/NimbusStatus";
import EditorialAI from "./dashboardWidgets/EditorialAI";
import QuickActions from "./dashboardWidgets/QuickActions";
import EngagementMetrics from "./dashboardWidgets/EngagementMetrics";

export default defineConfig({
  widgets: [
    {
      name: "nimbus-status",
      layout: { width: "full" },
      component: NimbusStatus,
    },
    {
      name: "editorial-ai",
      layout: { width: "medium" },
      component: EditorialAI,
    },
    {
      name: "quick-actions",
      layout: { width: "medium" },
      component: QuickActions,
    },
    {
      name: "recent-documents",
      layout: { width: "full" },
      component: DocumentList,
      options: {
        title: "Recent CMS Activity",
        order: "_updatedAt desc",
        types: [
          "product",
          "article",
          "legalDocument",
          "deal",
          "award",
          "tenant",
        ],
      },
    },
    {
      name: "engagement-metrics",
      layout: { width: "full" },
      component: EngagementMetrics,
    },
  ],
});
