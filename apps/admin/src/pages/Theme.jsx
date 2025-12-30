import React, { useEffect, useState } from "react";
import { t } from '../lib/i18n';
import { apiJson } from "../lib/api";

export default function ThemePage() {
  const [theme, setTheme] = useState({
    primaryColor: "#3b82f6",
    accentColor: "#22c55e",
    backgroundColor: "#020617",
    surfaceColor: "#0f172a",
    fontColor: "#e5e7eb",
  });

  useEffect(() => {
    const controller = new AbortController();
    apiJson("/admin/theme", { signal: controller.signal })
      .then(({ ok, data, aborted }) => {
        if (aborted || controller.signal.aborted) return;
        if (ok && data) setTheme((t) => ({ ...t, ...data }));
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const update = (key, value) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    apiJson("/admin/theme", {
      method: "POST",
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
        <div
          className="preview-logo"
          style={{ background: theme.primaryColor }}
        />
        <div className="preview-text">
          <div className="preview-title">{t('suite_title')}</div>
          <div className="preview-sub">{t('preview_live')}</div>
        </div>
      </div>
      <div className="theme-grid">
        <label>
          {t('label_primary_color')}
          <input
            type="color"
            value={theme.primaryColor}
            onChange={(e) => update("primaryColor", e.target.value)}
          />
        </label>
        <label>
          {t('label_accent_color')}
          <input
            type="color"
            value={theme.accentColor}
            onChange={(e) => update("accentColor", e.target.value)}
          />
        </label>
        <label>
          {t('label_background_color')}
          <input
            type="color"
            value={theme.backgroundColor}
            onChange={(e) => update("backgroundColor", e.target.value)}
          />
        </label>
        <label>
          {t('label_surface_color')}
          <input
            type="color"
            value={theme.surfaceColor}
            onChange={(e) => update("surfaceColor", e.target.value)}
          />
        </label>
        <label>
          {t('label_font_color')}
          <input
            type="color"
            value={theme.fontColor}
            onChange={(e) => update("fontColor", e.target.value)}
          />
        </label>
      </div>
      <button className="btn primary" onClick={save}>
        {t('save_theme')}
      </button>
    </div>
  );
}
