import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "../design-system/Card";

const trafficData = [
  { month: "Jan", visits: 4000 },
  { month: "Feb", visits: 3000 },
  { month: "Mar", visits: 6000 },
  { month: "Apr", visits: 8000 },
  { month: "May", visits: 7000 },
  { month: "Jun", visits: 9000 },
];

const salesData = [
  { day: "Mon", revenue: 1200 },
  { day: "Tue", revenue: 1900 },
  { day: "Wed", revenue: 1500 },
  { day: "Thu", revenue: 2200 },
  { day: "Fri", revenue: 2700 },
  { day: "Sat", revenue: 2400 },
  { day: "Sun", revenue: 1800 },
];

const engagementData = [
  { week: "Week 1", users: 520 },
  { week: "Week 2", users: 680 },
  { week: "Week 3", users: 750 },
  { week: "Week 4", users: 950 },
];

export function TrafficChart() {
  return (
    <Card>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>
        Traffic Trends
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={trafficData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
          <YAxis stroke="#6B7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
            }}
          />
          <Line
            type="monotone"
            dataKey="visits"
            stroke="#3F7AFC"
            strokeWidth={2}
            dot={{ fill: "#3F7AFC", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function SalesChart() {
  return (
    <Card>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>
        Daily Revenue
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={salesData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
          <YAxis stroke="#6B7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
            }}
          />
          <Bar dataKey="revenue" fill="#3F7AFC" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function EngagementChart() {
  return (
    <Card>
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>
        User Engagement
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={engagementData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="week" stroke="#6B7280" fontSize={12} />
          <YAxis stroke="#6B7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
            }}
          />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#3F7AFC"
            fill="#3F7AFC"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
