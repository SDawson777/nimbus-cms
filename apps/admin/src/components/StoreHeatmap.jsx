import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { useTenant } from '../lib/tenantContext';
import './StoreHeatmap.css';
import 'leaflet/dist/leaflet.css';

const API_BASE = import.meta.env.VITE_NIMBUS_API_URL || '';

// Pulsing marker component
function PulsingMarker({ position, color, intensity, store, onClick }) {
  return (
    <CircleMarker
      center={position}
      radius={10 + (intensity / 1000) * 20} // Size based on engagement
      pathOptions={{
        fillColor: color,
        fillOpacity: 0.6,
        color: color,
        weight: 2,
        className: 'pulsing-marker'
      }}
      eventHandlers={{
        click: () => onClick(store)
      }}
    >
      <Popup>
        <div className="store-popup">
          <h3>{store.name}</h3>
          <p>{store.address.city}, {store.address.state}</p>
          <div className="popup-metrics">
            <div><strong>{store.metrics.orders}</strong> orders</div>
            <div><strong>${store.metrics.revenue.toFixed(2)}</strong> revenue</div>
            <div><strong>{store.metrics.customers}</strong> customers</div>
          </div>
          <button className="view-details-btn">View Details →</button>
        </div>
      </Popup>
    </CircleMarker>
  );
}

// Map bounds setter
function MapBounds({ stores }) {
  const map = useMap();
  
  useEffect(() => {
    if (stores.length > 0) {
      const bounds = stores.map(s => [s.latitude, s.longitude]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stores, map]);
  
  return null;
}

export default function StoreHeatmap({ onStoreClick }) {
  const { tenantId } = useTenant();
  const workspace = tenantId || 'production';
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchStoreData();
  }, [workspace, period]);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `${API_BASE}/api/v1/nimbus/analytics/${workspace}/stores?period=${period}`,
        {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch store data: ${res.statusText}`);
      }

      const json = await res.json();
      if (json.success) {
        // Filter out stores without coordinates
        const validStores = json.data.stores.filter(
          s => s.latitude != null && s.longitude != null
        );
        setStores(validStores);
      } else {
        throw new Error(json.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Store fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (engagement) => {
    // Red: 700-1000 (most active)
    if (engagement >= 700) return '#ff3b30';
    // Yellow: 400-699 (steady)
    if (engagement >= 400) return '#ff9500';
    // Green: 100-399 (slow)
    if (engagement >= 100) return '#34c759';
    // Blue: 0-99 (no data / minimal)
    return '#007aff';
  };

  const handleStoreClick = (store) => {
    if (onStoreClick) {
      onStoreClick(store);
    }
  };

  if (loading) {
    return (
      <div className="heatmap-container">
        <div className="heatmap-loading">
          <div className="loading-spinner"></div>
          <p>Loading store locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="heatmap-container">
        <div className="heatmap-error">
          <p>⚠️ {error}</p>
          <button onClick={fetchStoreData} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="heatmap-container">
        <div className="heatmap-empty">
          <p>📍 No stores with location data found</p>
        </div>
      </div>
    );
  }

  // Default center (will be overridden by bounds)
  const center = stores.length > 0 
    ? [stores[0].latitude, stores[0].longitude]
    : [37.7749, -122.4194];

  return (
    <div className="heatmap-container">
      <div className="heatmap-header">
        <h2>🗺️ Store Locations</h2>
        <div className="heatmap-controls">
          <div className="period-selector">
            <button
              className={period === '7' ? 'active' : ''}
              onClick={() => setPeriod('7')}
            >
              7 Days
            </button>
            <button
              className={period === '30' ? 'active' : ''}
              onClick={() => setPeriod('30')}
            >
              30 Days
            </button>
            <button
              className={period === '90' ? 'active' : ''}
              onClick={() => setPeriod('90')}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#ff3b30' }}></span>
          <span>High Activity (700-1000)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#ff9500' }}></span>
          <span>Steady (400-699)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#34c759' }}></span>
          <span>Slow (100-399)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: '#007aff' }}></span>
          <span>Minimal (&lt;100)</span>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: '600px', width: '100%' }}
          className="store-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapBounds stores={stores} />

          {stores.map((store) => (
            <PulsingMarker
              key={store.id}
              position={[store.latitude, store.longitude]}
              color={getMarkerColor(store.engagement)}
              intensity={store.engagement}
              store={store}
              onClick={handleStoreClick}
            />
          ))}
        </MapContainer>
      </div>

      <div className="store-list">
        <h3>Store Rankings</h3>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Store</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Engagement</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store, idx) => (
              <tr 
                key={store.id} 
                onClick={() => handleStoreClick(store)}
                className="clickable-row"
              >
                <td className="rank-cell">{idx + 1}</td>
                <td>
                  <div className="store-name">
                    <span 
                      className="status-dot"
                      style={{ backgroundColor: getMarkerColor(store.engagement) }}
                    ></span>
                    {store.name}
                  </div>
                  <div className="store-location">
                    {store.address.city}, {store.address.state}
                  </div>
                </td>
                <td>{store.metrics.orders}</td>
                <td>${store.metrics.revenue.toFixed(2)}</td>
                <td>
                  <div className="engagement-bar">
                    <div 
                      className="engagement-fill"
                      style={{ 
                        width: `${(store.engagement / 1000) * 100}%`,
                        backgroundColor: getMarkerColor(store.engagement)
                      }}
                    ></div>
                    <span className="engagement-value">{store.engagement}</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge status-${store.status}`}>
                    {store.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
