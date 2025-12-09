import React, { useEffect, useState } from 'react';
import { apiJson } from '../lib/api';
import './welcome-bar.css';

const UpArrow = () => <span style={{ color: '#4ade80', fontWeight: 600 }}>▲</span>;
const DownArrow = () => <span style={{ color: '#f87171', fontWeight: 600 }}>▼</span>;

export default function WelcomeBar() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    apiJson('/api/admin/banner')
      .then(({ ok, data }) => {
        if (mounted && ok) setData(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const now = data?.serverTime ? new Date(data.serverTime) : new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="welcome-bar">
      <div className="wb-section left">
        <div className="wb-greet">Welcome, Admin</div>
        <div className="wb-meta">
          {dateStr} · {timeStr}
          {data?.city && ` · ${data.city}, ${data.region}`}
        </div>
      </div>
      <div className="wb-section center">
        {data?.weather && (
          <div className="wb-weather">
            <span className="wb-temp">{Math.round(data.weather.temp)}°F</span>
            <span className="wb-desc">{data.weather.desc}</span>
          </div>
        )}
      </div>
      <div className="wb-section right">
        {data?.analytics && (
          <div className="wb-ticker">
            <span className="wb-label">Active users</span>
            <span className="wb-value">{data.analytics.activeUsers}</span>
            <span className="wb-change">
              {data.analytics.change >= 0 ? <UpArrow /> : <DownArrow />} {Math.abs(data.analytics.change)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
