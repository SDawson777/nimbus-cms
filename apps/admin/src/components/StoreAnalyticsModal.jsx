import React, { useState, useEffect } from 'react';
import './StoreAnalyticsModal.css';

const API_BASE = import.meta.env.VITE_NIMBUS_API_URL || '';

export default function StoreAnalyticsModal({ store, onClose }) {
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store) {
      fetchStoreDetails();
    }
  }, [store]);

  const fetchStoreDetails = async () => {
    // For now, show the store data we already have
    // In the future, this could fetch additional detailed analytics
    setLoading(false);
  };

  if (!store) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{store.name}</h2>
            <p className="store-address">
              {store.address.address1}<br />
              {store.address.city}, {store.address.state} {store.address.postalCode}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Summary Metrics */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon">📦</div>
              <div className="metric-value">{store.metrics.orders}</div>
              <div className="metric-label">Total Orders</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-value">${store.metrics.revenue.toFixed(2)}</div>
              <div className="metric-label">Total Revenue</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">👥</div>
              <div className="metric-value">{store.metrics.customers}</div>
              <div className="metric-label">Unique Customers</div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">📊</div>
              <div className="metric-value">${store.metrics.avgOrderValue}</div>
              <div className="metric-label">Avg Order Value</div>
            </div>
          </div>

          {/* Engagement Score */}
          <div className="engagement-section">
            <h3>Engagement Score</h3>
            <div className="engagement-display">
              <div className="engagement-circle" style={{
                background: `conic-gradient(${getColor(store.engagement)} ${(store.engagement / 1000) * 360}deg, #f5f5f7 0deg)`
              }}>
                <div className="engagement-inner">
                  <span className="engagement-score">{store.engagement}</span>
                  <span className="engagement-max">/ 1000</span>
                </div>
              </div>
              <div className="engagement-breakdown">
                <h4>Score Breakdown</h4>
                <div className="breakdown-item">
                  <span>Revenue (40%)</span>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{
                      width: `${Math.min(100, (store.metrics.revenue / 100) * 40)}%`,
                      background: '#007aff'
                    }}></div>
                  </div>
                </div>
                <div className="breakdown-item">
                  <span>Orders (40%)</span>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{
                      width: `${Math.min(100, (store.metrics.orders / 10) * 40)}%`,
                      background: '#34c759'
                    }}></div>
                  </div>
                </div>
                <div className="breakdown-item">
                  <span>Customers (20%)</span>
                  <div className="breakdown-bar">
                    <div className="breakdown-fill" style={{
                      width: `${Math.min(100, (store.metrics.customers / 5) * 20)}%`,
                      background: '#ff9500'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Store Info */}
          <div className="store-info-section">
            <h3>Store Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Store ID</span>
                <span className="info-value">{store.id.slice(0, 8)}...</span>
              </div>
              <div className="info-item">
                <span className="info-label">Slug</span>
                <span className="info-value">{store.slug}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className={`status-badge status-${store.status}`}>
                  {store.status}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Coordinates</span>
                <span className="info-value">
                  {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="action-btn primary">
              📈 View Full Analytics
            </button>
            <button className="action-btn secondary">
              🏪 Manage Store
            </button>
            <button className="action-btn secondary">
              📦 View Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getColor(engagement) {
  if (engagement >= 700) return '#ff3b30';
  if (engagement >= 400) return '#ff9500';
  if (engagement >= 100) return '#34c759';
  return '#007aff';
}
