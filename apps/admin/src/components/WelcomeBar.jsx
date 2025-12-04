import React, { useEffect, useState } from 'react';
import { apiJson } from '../lib/api';
import './welcome-bar.css';

// Simple arrow icons for up/down metrics
const UpArrow = () => <span style={{ color: '#4ade80', fontWeight: 600 }}>▲</span>;
const DownArrow = () => <span style={{ color: '#f87171', fontWeight: 600 }}>▼</span>;

const FALLBACK_BANNER = {
  weather: { tempF: 72, condition: 'Clear' },
  analytics: { activeUsers: '--', change: null },
  serverTime: new Date().toISOString(),
  city: null,
  region: null,
};

export default function WelcomeBar() {
  const [data, setData] = useState(FALLBACK_BANNER);

  useEffect(() => {
    let mounted = true;
    apiJson('/admin/banner')
      .then(({ ok, data }) => {
        if (mounted && ok) setData(data || FALLBACK_BANNER);
        else if (mounted) setData(FALLBACK_BANNER);
      })
      .catch(() => {
        if (mounted) setData(FALLBACK_BANNER);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const now = data?.serverTime ? new Date(data.serverTime) : new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const weatherTemp = Math.round(data?.weather?.tempF ?? 72);
  const weatherDesc = data?.weather?.condition || 'Clear';
  const locationLabel = data?.city
    ? `${data.city}${data.region ? `, ${data.region}` : ''}`
    : null;

  const change = data?.analytics?.change ?? null;
  const hasChange = typeof change === 'number';
  const changeValue = hasChange ? Math.abs(change) : null;

  return (
    <div className="welcome-bar">
      <div className="wb-section left">
        <div className="wb-greet">Welcome, Admin</div>
        <div className="wb-meta">
          {dateStr} · {timeStr}
          {locationLabel ? ` · ${locationLabel}` : ''}
        </div>
      </div>

      <div className="wb-section center">
        {data?.weather && (
          <div className="wb-weather fade-in">
            <span className="wb-temp" aria-label="Current temperature">
              {weatherTemp}°F
            </span>
            <span className="wb-desc">{weatherDesc}</span>
          </div>
        )}
      </div>

      <div className="wb-section right">
        {data?.analytics && (
          <div className="wb-ticker slide-up">
            <span className="wb-label">Active users</span>
            <span className="wb-value">
              {data.analytics.activeUsers ?? "--"}
            </span>
            {hasChange && (
              <span className="wb-change">
                {change >= 0 ? <UpArrow /> : <DownArrow />} {changeValue}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
