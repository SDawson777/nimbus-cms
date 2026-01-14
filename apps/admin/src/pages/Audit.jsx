import React, { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../lib/adminContext';
import { t } from '../lib/i18n';

const API_BASE = import.meta.env.VITE_NIMBUS_API_URL || '';

/**
 * Audit & Security Logs Page
 * Displays system audit trail, security events, and activity logs
 */
export default function Audit() {
  const { capabilities } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filter, setFilter] = useState({
    type: 'all',
    dateRange: '7',
    search: ''
  });
  const [stats, setStats] = useState({
    totalEvents: 0,
    securityAlerts: 0,
    adminActions: 0,
    systemEvents: 0
  });

  const loadAuditData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // In demo/development mode, use mock data
      const demoLogs = generateDemoAuditLogs();
      setAuditLogs(demoLogs);
      setStats({
        totalEvents: demoLogs.length,
        securityAlerts: demoLogs.filter(l => l.category === 'security').length,
        adminActions: demoLogs.filter(l => l.category === 'admin').length,
        systemEvents: demoLogs.filter(l => l.category === 'system').length
      });
    } catch (err) {
      console.error('Audit data error:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadAuditData();
  }, [loadAuditData]);

  const filteredLogs = auditLogs.filter(log => {
    if (filter.type !== 'all' && log.category !== filter.type) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.user.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="card" style={{ margin: '2rem auto', maxWidth: 1200 }}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ margin: '2rem auto', maxWidth: 1200 }}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
          <h2>Error Loading Audit Data</h2>
          <p>{error}</p>
          <button onClick={loadAuditData} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Audit & Security Logs
        </h1>
        <p style={{ color: '#6b7280' }}>
          Track system activity, security events, and administrative actions
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <StatCard 
          label="Total Events" 
          value={stats.totalEvents} 
          icon="📊" 
          color="#3b82f6" 
        />
        <StatCard 
          label="Security Alerts" 
          value={stats.securityAlerts} 
          icon="🔒" 
          color="#ef4444" 
        />
        <StatCard 
          label="Admin Actions" 
          value={stats.adminActions} 
          icon="👤" 
          color="#8b5cf6" 
        />
        <StatCard 
          label="System Events" 
          value={stats.systemEvents} 
          icon="⚙️" 
          color="#10b981" 
        />
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
              Event Type
            </label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                minWidth: '150px'
              }}
            >
              <option value="all">All Events</option>
              <option value="security">Security</option>
              <option value="admin">Admin Actions</option>
              <option value="system">System</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
              Date Range
            </label>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                minWidth: '150px'
              }}
            >
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search logs..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}
            />
          </div>

          <button 
            onClick={loadAuditData}
            style={{
              marginTop: '1.25rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: '#3b82f6',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: 0, fontWeight: 600 }}>Activity Log</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            Showing {filteredLogs.length} of {auditLogs.length} events
          </p>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Details</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No audit events found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <CategoryBadge category={log.category} />
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500 }}>{log.action}</span>
                    </td>
                    <td style={tdStyle}>{log.user}</td>
                    <td style={{ ...tdStyle, maxWidth: '300px' }}>
                      <span style={{ 
                        display: 'block', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {log.details}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Summary */}
      <div className="card" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Security Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <SecurityItem 
            title="Last Security Scan"
            value="2 hours ago"
            status="success"
          />
          <SecurityItem 
            title="Failed Login Attempts (24h)"
            value="3"
            status="warning"
          />
          <SecurityItem 
            title="Active Sessions"
            value="12"
            status="info"
          />
          <SecurityItem 
            title="Compliance Status"
            value="Compliant"
            status="success"
          />
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color }}>{value}</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }) {
  const colors = {
    security: { bg: '#fef2f2', text: '#dc2626' },
    admin: { bg: '#f5f3ff', text: '#7c3aed' },
    system: { bg: '#ecfdf5', text: '#059669' },
    compliance: { bg: '#fffbeb', text: '#d97706' }
  };
  const style = colors[category] || { bg: '#f3f4f6', text: '#4b5563' };
  
  return (
    <span style={{
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 500,
      background: style.bg,
      color: style.text,
      textTransform: 'capitalize'
    }}>
      {category}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    success: { bg: '#ecfdf5', text: '#059669' },
    warning: { bg: '#fffbeb', text: '#d97706' },
    error: { bg: '#fef2f2', text: '#dc2626' },
    info: { bg: '#eff6ff', text: '#2563eb' }
  };
  const style = colors[status] || colors.info;
  
  return (
    <span style={{
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 500,
      background: style.bg,
      color: style.text,
      textTransform: 'capitalize'
    }}>
      {status}
    </span>
  );
}

function SecurityItem({ title, value, status }) {
  const colors = {
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2563eb'
  };
  
  return (
    <div style={{ 
      padding: '1rem', 
      background: '#f9fafb', 
      borderRadius: '8px',
      borderLeft: `4px solid ${colors[status] || colors.info}`
    }}>
      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: colors[status] }}>{value}</div>
    </div>
  );
}

// Styles
const thStyle = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#6b7280',
  letterSpacing: '0.05em'
};

const tdStyle = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem'
};

// Helpers
function formatTimestamp(ts) {
  const date = new Date(ts);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

// Demo data generator
function generateDemoAuditLogs() {
  const actions = [
    { category: 'security', action: 'Login Success', details: 'User authenticated via password' },
    { category: 'security', action: 'Login Failed', details: 'Invalid credentials attempt' },
    { category: 'security', action: 'Password Reset', details: 'Password reset email sent' },
    { category: 'security', action: 'Session Expired', details: 'Session timeout after 30 minutes' },
    { category: 'admin', action: 'User Created', details: 'New admin user account created' },
    { category: 'admin', action: 'Role Updated', details: 'User role changed from EDITOR to ADMIN' },
    { category: 'admin', action: 'Product Updated', details: 'Product inventory levels modified' },
    { category: 'admin', action: 'Order Status Changed', details: 'Order #12345 marked as fulfilled' },
    { category: 'admin', action: 'Content Published', details: 'Article published to production' },
    { category: 'system', action: 'Backup Completed', details: 'Daily backup completed successfully' },
    { category: 'system', action: 'Cache Cleared', details: 'System cache purged' },
    { category: 'system', action: 'API Rate Limit', details: 'Rate limit threshold reached for /api/products' },
    { category: 'compliance', action: 'Recall Initiated', details: 'Product batch #PH-2024-12 recall initiated' },
    { category: 'compliance', action: 'Compliance Check', details: 'Automated compliance scan completed' },
    { category: 'compliance', action: 'License Verified', details: 'State license renewal verified' },
  ];
  
  const users = [
    'admin@nimbuscannabis.com',
    'operations@nimbuscannabis.com',
    'support@nimbuscannabis.com',
    'system',
    'compliance-bot'
  ];
  
  const logs = [];
  const now = Date.now();
  
  for (let i = 0; i < 50; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const hoursAgo = Math.floor(Math.random() * 168); // Up to 7 days
    
    logs.push({
      id: `audit-${i + 1}`,
      timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
      category: action.category,
      action: action.action,
      user: users[Math.floor(Math.random() * users.length)],
      details: action.details,
      status: action.action.includes('Failed') ? 'warning' : 'success',
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    });
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
