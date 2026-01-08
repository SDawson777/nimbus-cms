import React, { useState, useEffect } from 'react';
import { useTenant } from '../lib/tenantContext';
import './Analytics.css';

const API_BASE = import.meta.env.VITE_NIMBUS_API_URL || '';

export default function Analytics() {
  const { tenantId } = useTenant();
  const workspace = tenantId || 'production';
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [workspace, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(
        `${API_BASE}/api/v1/nimbus/analytics/${workspace}/overview?period=${period}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch analytics: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Analytics error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="analytics-error">
          <h2>Error Loading Analytics</h2>
          <p>{error}</p>
          <button onClick={fetchAnalytics} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, charts, topProducts, recentOrders } = data;

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Analytics Dashboard</h1>
          <p className="analytics-subtitle">
            Performance insights for {workspace}
          </p>
        </div>
        
        <div className="period-selector">
          <button
            className={`period-btn ${period === '7' ? 'active' : ''}`}
            onClick={() => setPeriod('7')}
          >
            7 Days
          </button>
          <button
            className={`period-btn ${period === '30' ? 'active' : ''}`}
            onClick={() => setPeriod('30')}
          >
            30 Days
          </button>
          <button
            className={`period-btn ${period === '90' ? 'active' : ''}`}
            onClick={() => setPeriod('90')}
          >
            90 Days
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <MetricCard
          label="Total Revenue"
          value={metrics.revenue.formatted}
          trend={metrics.revenue.trend}
          icon="💰"
        />
        <MetricCard
          label="Orders"
          value={metrics.orders.current}
          trend={metrics.orders.trend}
          icon="📦"
        />
        <MetricCard
          label="Customers"
          value={metrics.customers.current}
          trend={metrics.customers.trend}
          icon="👥"
        />
        <MetricCard
          label="Avg Order Value"
          value={`$${metrics.avgOrderValue.current}`}
          icon="💵"
        />
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Revenue Trend</h3>
            <span className="chart-subtitle">Daily revenue over time</span>
          </div>
          <LineChart data={charts.revenueByDay} dataKey="revenue" />
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Orders Overview</h3>
            <span className="chart-subtitle">Orders by status</span>
          </div>
          <DonutChart data={charts.ordersByStatus} />
        </div>
      </div>

      {/* Full Width Bar Chart */}
      <div className="chart-card chart-full">
        <div className="chart-header">
          <h3>Daily Orders</h3>
          <span className="chart-subtitle">Order volume by day</span>
        </div>
        <BarChart data={charts.ordersByDay} dataKey="count" />
      </div>

      {/* Data Tables */}
      <div className="tables-row">
        <div className="table-card">
          <div className="table-header">
            <h3>Top Products</h3>
            <span className="table-subtitle">Best sellers this period</span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.slice(0, 10).map((product, idx) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-cell">
                        <span className="product-rank">#{idx + 1}</span>
                        <div>
                          <div className="product-name">{product.name}</div>
                          {product.brand && (
                            <div className="product-brand">{product.brand}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="product-type">{product.type}</span>
                    </td>
                    <td>
                      <span className="metric-value">{product.sales}</span>
                    </td>
                    <td>
                      <span className="metric-value">${product.revenue}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-card">
          <div className="table-header">
            <h3>Recent Orders</h3>
            <span className="table-subtitle">Latest transactions</span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Store</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="order-customer">{order.customer}</div>
                    </td>
                    <td>
                      <span className="order-store">{order.store}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span className="metric-value">${order.total.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, trend, icon }) {
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '−';

  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <div className="metric-label">{label}</div>
        <div className="metric-value-row">
          <span className="metric-value-large">{value}</span>
          {trend !== undefined && (
            <span className={`metric-trend trend-${trendDirection}`}>
              {trendIcon} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Line Chart Component
function LineChart({ data, dataKey }) {
  if (!data || data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const width = 100;
  const height = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d[dataKey] - min) / range) * height;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  return (
    <div className="chart-container">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line x1="0" y1="25" x2={width} y2="25" className="grid-line" />
        <line x1="0" y1="50" x2={width} y2="50" className="grid-line" />
        <line x1="0" y1="75" x2={width} y2="75" className="grid-line" />
        
        <path
          d={`${pathD} L ${width},${height} L 0,${height} Z`}
          className="line-chart-area"
        />
        
        <path d={pathD} className="line-chart-path" />
        
        {points.map((point, i) => {
          const [x, y] = point.split(',').map(Number);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1.5"
              className="line-chart-point"
            />
          );
        })}
      </svg>
      
      <div className="chart-labels">
        <span className="chart-label-start">
          {data[0]?.date ? new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
        </span>
        <span className="chart-label-end">
          {data[data.length - 1]?.date ? new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
        </span>
      </div>
    </div>
  );
}

// Bar Chart Component
function BarChart({ data, dataKey }) {
  if (!data || data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  const max = Math.max(...data.map(d => d[dataKey]));

  return (
    <div className="bar-chart-container">
      <div className="bar-chart">
        {data.map((item, i) => {
          const height = max > 0 ? (item[dataKey] / max) * 100 : 0;
          return (
            <div key={i} className="bar-wrapper">
              <div className="bar-value">{item[dataKey]}</div>
              <div className="bar" style={{ height: `${height}%` }}>
                <div className="bar-fill"></div>
              </div>
              <div className="bar-label">
                {item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Donut Chart Component
function DonutChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const colors = {
    PENDING: '#f59e0b',
    PAID: '#10b981',
    FULFILLED: '#0071e3',
    CANCELLED: '#6e6e73',
    REFUNDED: '#dc2626'
  };

  let currentAngle = -90;
  const segments = data.map(item => {
    const percentage = (item.count / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      status: item.status,
      count: item.count,
      percentage: percentage.toFixed(1),
      startAngle,
      endAngle,
      color: colors[item.status] || '#6e6e73'
    };
  });

  return (
    <div className="donut-chart-container">
      <svg className="donut-chart" viewBox="0 0 100 100">
        {segments.map((segment, i) => {
          const path = describeArc(50, 50, 35, segment.startAngle, segment.endAngle);
          return (
            <path
              key={i}
              d={path}
              fill="none"
              stroke={segment.color}
              strokeWidth="10"
              className="donut-segment"
            />
          );
        })}
        
        <text x="50" y="45" textAnchor="middle" className="donut-total-label">Total</text>
        <text x="50" y="58" textAnchor="middle" className="donut-total-value">{total}</text>
      </svg>
      
      <div className="donut-legend">
        {segments.map((segment, i) => (
          <div key={i} className="legend-item">
            <span className="legend-color" style={{ backgroundColor: segment.color }}></span>
            <span className="legend-label">{segment.status}</span>
            <span className="legend-value">{segment.count} ({segment.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  
  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(' ');
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}
