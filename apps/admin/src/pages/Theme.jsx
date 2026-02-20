import React, { useEffect, useState } from "react";
import { t } from '../lib/i18n';
import { apiJson } from "../lib/api";
import { useAdmin } from "../lib/adminContext";

function screenBorderPatternBackground(pattern, borderColor) {
  if (!borderColor || pattern === "none") return "none";
  if (pattern === "stripes") {
    return `repeating-linear-gradient(45deg, ${borderColor}, ${borderColor} 8px, transparent 8px, transparent 14px)`;
  }
  if (pattern === "dots") {
    return `radial-gradient(${borderColor} 1.5px, transparent 1.5px)`;
  }
  if (pattern === "grid") {
    return `linear-gradient(${borderColor} 1px, transparent 1px), linear-gradient(90deg, ${borderColor} 1px, transparent 1px)`;
  }
  return "none";
}

export default function ThemePage() {
  const { capabilities } = useAdmin();
  const scopedBrand = capabilities?.scopes?.brandSlug || "";
  const scopedStore = capabilities?.scopes?.storeSlug || "";
  const [theme, setTheme] = useState({
    primaryColor: "#3b82f6",
    accentColor: "#22c55e",
    backgroundColor: "#020617",
    surfaceColor: "#0f172a",
    fontColor: "#e5e7eb",
    screenBorderEnabled: false,
    screenBorderColor: "#ffffff",
    screenBorderPattern: "none",
    heroTitle: "Welcome to Nimbus",
    heroSubtitle: "Curated cannabis experiences",
    heroBackgroundColor: "#020617",
    heroTextColor: "#e5e7eb",
    heroBackgroundImageUrl: "",
  });

  useEffect(() => {
    if (!scopedBrand) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ brand: scopedBrand });
    if (scopedStore) params.set("store", scopedStore);
    apiJson(`/api/admin/theme?${params.toString()}`, { signal: controller.signal })
      .then(({ ok, data, aborted }) => {
        if (aborted || controller.signal.aborted) return;
        if (ok && data) {
          setTheme((t) => ({
            ...t,
            ...data,
            fontColor: data.textColor || t.fontColor,
          }));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [scopedBrand, scopedStore]);

  const update = (key, value) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  const save = () => {
    if (!scopedBrand) return;
    apiJson("/api/admin/theme", {
      method: "POST",
      body: JSON.stringify({
        brand: scopedBrand,
        ...(scopedStore ? { store: scopedStore } : {}),
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        accentColor: theme.accentColor,
        backgroundColor: theme.backgroundColor,
        surfaceColor: theme.surfaceColor,
        textColor: theme.fontColor,
        screenBorderEnabled: !!theme.screenBorderEnabled,
        screenBorderColor: theme.screenBorderColor,
        screenBorderPattern: theme.screenBorderPattern,
        heroTitle: theme.heroTitle,
        heroSubtitle: theme.heroSubtitle,
        heroBackgroundColor: theme.heroBackgroundColor,
        heroTextColor: theme.heroTextColor,
        heroBackgroundImageUrl: theme.heroBackgroundImageUrl,
      }),
    }).catch(() => {});
  };

  return (
    <div className="theme-page">
      <div
        className="theme-preview-bar"
        style={{
          background: theme.backgroundColor,
          color: theme.fontColor,
          border: theme.screenBorderEnabled
            ? `6px solid ${theme.screenBorderColor}`
            : `1px solid ${theme.accentColor}`,
          backgroundImage: screenBorderPatternBackground(
            theme.screenBorderPattern,
            theme.screenBorderEnabled ? theme.screenBorderColor : theme.accentColor,
          ),
          backgroundSize: theme.screenBorderPattern === "dots" ? "12px 12px" : "auto",
        }}
      >
        <div
          className="preview-logo"
          style={{ background: theme.primaryColor }}
        />
        <div className="preview-text">
          <div className="preview-title">{theme.heroTitle || "Welcome to Nimbus"}</div>
          <div className="preview-sub">{theme.heroSubtitle || "Curated cannabis experiences"}</div>
        </div>
        {theme.heroBackgroundImageUrl && (
          <div 
            className="preview-hero-image-indicator"
            style={{ 
              fontSize: "12px", 
              opacity: 0.7,
              marginTop: "8px" 
            }}
          >
            🖼️ Hero Image: {theme.heroBackgroundImageUrl.substring(0, 50)}...
          </div>
        )}
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
        <label>
          {t('label_screen_border_enabled')}
          <input
            type="checkbox"
            checked={!!theme.screenBorderEnabled}
            onChange={(e) => update("screenBorderEnabled", e.target.checked)}
          />
        </label>
        <label>
          {t('label_screen_border_color')}
          <input
            type="color"
            value={theme.screenBorderColor}
            onChange={(e) => update("screenBorderColor", e.target.value)}
          />
        </label>
        <label>
          {t('label_screen_border_pattern')}
          <select
            value={theme.screenBorderPattern || "none"}
            onChange={(e) => update("screenBorderPattern", e.target.value)}
          >
            <option value="none">None</option>
            <option value="stripes">Stripes</option>
            <option value="dots">Dots</option>
            <option value="grid">Grid</option>
          </select>
        </label>
        <label>
          {t('label_hero_title')}
          <input
            type="text"
            value={theme.heroTitle}
            onChange={(e) => update("heroTitle", e.target.value)}
            placeholder="Welcome to Nimbus"
          />
        </label>
        <label>
          {t('label_hero_subtitle')}
          <input
            type="text"
            value={theme.heroSubtitle}
            onChange={(e) => update("heroSubtitle", e.target.value)}
            placeholder="Curated cannabis experiences"
          />
        </label>
        <label>
          {t('label_hero_background_color')}
          <input
            type="color"
            value={theme.heroBackgroundColor}
            onChange={(e) => update("heroBackgroundColor", e.target.value)}
          />
        </label>
        <label>
          {t('label_hero_text_color')}
          <input
            type="color"
            value={theme.heroTextColor}
            onChange={(e) => update("heroTextColor", e.target.value)}
          />
        </label>
        <label>
          {t('label_hero_background_image_url')}
          <input
            type="url"
            value={theme.heroBackgroundImageUrl}
            onChange={(e) => update("heroBackgroundImageUrl", e.target.value)}
            placeholder="https://cdn.sanity.io/..."
          />
        </label>
      </div>
      <button className="btn primary" onClick={save}>
        {t('save_theme')}
      </button>
    </div>
  );
}
