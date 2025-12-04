import React, { useEffect, useState } from 'react';
import { apiJson } from '../lib/api';

export default function ThemePage() {
  const [theme, setTheme] = useState({
    primaryColor: '#3b82f6',
    accentColor: '#22c55e',
    backgroundColor: '#020617',
    surfaceColor: '#0f172a',
    fontColor: '#e5e7eb',
  });

  useEffect(() => {
    apiJson('/admin/theme')
      .then(({ ok, data }) => {
        if (ok && data) setTheme((t) => ({ ...t, ...data }));
      })
      .catch(() => {});
  }, []);

  const update = (key, value) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    apiJson('/admin/theme', {
      method: 'POST',
      body: JSON.stringify(theme),
    }).catch(() => {});
  };

  return (
    <div className="theme-page">
      <div
        className="theme-preview-bar"
        style={{
          background: theme.backgroundColor,
          color: theme.fontColor,
          borderColor: theme.accentColor,
        }}
      >
        <div className="preview-logo" style={{ background: theme.primaryColor }} />
        <div className="preview-text">
          <div className="preview-title">Nimbus CMS Suite</div>
          <div className="preview-sub">Live theme preview</div>
        </div>
      </div>
      <div className="theme-grid">
        <label>
          Primary color
          <input
            type="color"
            value={theme.primaryColor}
            onChange={(e) => update('primaryColor', e.target.value)}
          />
        </label>
        <label>
          Accent color
          <input
            type="color"
            value={theme.accentColor}
            onChange={(e) => update('accentColor', e.target.value)}
          />
        </label>
        <label>
          Background color
          <input
            type="color"
            value={theme.backgroundColor}
            onChange={(e) => update('backgroundColor', e.target.value)}
          />
        </label>
        <label>
          Surface color
          <input
            type="color"
            value={theme.surfaceColor}
            onChange={(e) => update('surfaceColor', e.target.value)}
          />
        </label>
        <label>
          Font color
          <input type="color" value={theme.fontColor} onChange={(e) => update('fontColor', e.target.value)} />
        </label>
      </div>
      <button className="btn primary" onClick={save}>
        Save theme
      </button>
    </div>
  );
}
