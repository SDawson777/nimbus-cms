import Home from "../../assets/icons/Home";
import Document from "../../assets/icons/Document";
import Chart from "../../assets/icons/Chart";
import Users from "../../assets/icons/Users";
import Settings from "../../assets/icons/Settings";

const NavigationItems = [
  { group: "Overview", label: "Dashboard", href: "/dashboard", icon: Home },
  {
    group: "Content",
    label: "Articles",
    href: "/content/articles",
    icon: Document,
  },
  { group: "Content", label: "Deals", href: "/content/deals", icon: Document },
  {
    group: "Content",
    label: "Legal Docs",
    href: "/content/legal",
    icon: Document,
  },
  { group: "Tenants", label: "Tenant Manager", href: "/tenants", icon: Users },
  { group: "Analytics", label: "Sales", href: "/analytics/sales", icon: Chart },
  {
    group: "Analytics",
    label: "Traffic",
    href: "/analytics/traffic",
    icon: Chart,
  },
  {
    group: "Analytics",
    label: "Engagement",
    href: "/analytics/engagement",
    icon: Chart,
  },
  { group: "System", label: "Settings", href: "/settings", icon: Settings },
];

export default NavigationItems;
