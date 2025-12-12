import React, { useEffect, useMemo, useState } from "react";
import { useAdmin } from "../lib/adminContext";
import { apiJson, apiBaseUrl } from "../lib/api";
import { motion } from "framer-motion";

const FALLBACK_BANNER = {
  weather: {
    tempF: 72,
    condition: "Partly Cloudy",
    icon: "⛅️",
    mood: "cloudy",
  },
  ticker: [
    { label: "Active users", value: "1,204", delta: 12, direction: "up" },
    { label: "Conversion", value: "4.8%", delta: -3, direction: "down" },
    {
      label: "Top store",
      value: "Detroit – 8 Mile",
      delta: 19,
      direction: "up",
    },
  ],
  serverTime: new Date().toISOString(),
};

function formatTime(date, format) {
  const opts = {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: format === "12h",
  };
  return new Intl.DateTimeFormat(undefined, opts).format(date);
}

export default function AdminBanner() {
  const { admin } = useAdmin();
  const [banner, setBanner] = useState(FALLBACK_BANNER);
  const [clockFormat, setClockFormat] = useState("24h");
  const [now, setNow] = useState(() => new Date());
  const [geo, setGeo] = useState(null);
  const tickerItems = useMemo(
    () => banner.ticker || FALLBACK_BANNER.ticker,
    [banner],
  );

  const openWeatherToken =
    import.meta.env.VITE_OPENWEATHER_API_TOKEN ||
    import.meta.env.VITE_WEATHER_API_KEY;
  const openWeatherCity = import.meta.env.VITE_OPENWEATHER_CITY || "Detroit,US";
  const openWeatherUrl = useMemo(() => {
    const token = (openWeatherToken || "").trim();
    const baseUrl =
      import.meta.env.VITE_OPENWEATHER_API_URL ||
      import.meta.env.VITE_WEATHER_API_URL ||
      "https://api.openweathermap.org/data/2.5/weather";
    const search = new URLSearchParams({ units: "imperial" });

    if (geo?.lat && geo?.lon) {
      search.set("lat", geo.lat);
      search.set("lon", geo.lon);
    } else {
      search.set("q", openWeatherCity);
    }

    if (token) {
      search.set("appid", token);
    }

    return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${search.toString()}`;
  }, [geo, openWeatherCity, openWeatherToken]);

  useEffect(() => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setGeo({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setGeo(null),
        { enableHighAccuracy: false, timeout: 4000 },
      );
    }

    let mounted = true;
    async function load() {
      try {
        // Prefer server banner when API base is configured
        if (apiBaseUrl()) {
          const { ok, data } = await apiJson("/api/admin/banner");
          if (mounted && ok && data) {
            setBanner({ ...FALLBACK_BANNER, ...data });
            return;
          }
        }

        // Client-side preview weather fallback using OpenWeather when API base is absent (e.g., Vercel preview)
        if (!apiBaseUrl() && openWeatherToken) {
          const res = await fetch(openWeatherUrl);
          const json = await res.json().catch(() => null);
          if (json) {
            const condition = json?.weather?.[0]?.main || "Clear";
            const mood = normalizeCondition(condition);
            const icon = iconForMood(mood);
            const tempF = Math.round(json?.main?.temp ?? 72);
            setBanner({
              ...FALLBACK_BANNER,
              adminName: admin?.email || "Nimbus Admin",
              weather: { tempF, condition, icon, mood },
            });
            return;
          }
        }

        setBanner((prev) => ({
          ...prev,
          adminName: admin?.email || "Nimbus Admin",
        }));
      } catch (e) {
        // ignore and keep fallback
      }
    }
    load();
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [admin, openWeatherUrl]);

  function normalizeCondition(condition) {
    const text = String(condition || "").toLowerCase();
    if (text.includes("rain")) return "rain";
    if (text.includes("cloud")) return "cloudy";
    if (text.includes("storm")) return "storm";
    if (text.includes("snow")) return "snow";
    return "sunny";
  }

  function iconForMood(mood) {
    switch (mood) {
      case "rain":
        return "🌧️";
      case "cloudy":
        return "⛅️";
      case "storm":
        return "⛈️";
      case "snow":
        return "❄️";
      default:
        return "☀️";
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`admin-banner ${banner.weather?.mood ? `weather-${banner.weather.mood}` : ""}`}
      role="banner"
      aria-label="Admin welcome and system status"
    >
      <div className="banner-left">
        <div className="banner-welcome">
          Welcome back, {banner.adminName || admin?.email || "Admin"}
        </div>
        <div className="banner-weather" aria-label="Current weather">
          <span className="banner-weather__icon" aria-hidden="true">
            {banner.weather?.icon || iconForMood(banner.weather?.mood)}
          </span>
          <span className="banner-weather__temp">
            {banner.weather?.tempF ?? 72}°F
          </span>
          <span className="banner-weather__cond">
            {banner.weather?.condition || "Clear"}
          </span>
        </div>
      </div>
      <div className="banner-center" aria-label="Key momentum metrics">
        <div className="ticker" role="list" aria-live="polite">
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <motion.span
              layout
              key={`${item.label}-${idx}`}
              className="ticker-item"
              role="listitem"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="ticker-label">{item.label}:</span>
              <strong>{item.value}</strong>
              <span
                className={
                  item.direction === "up" ? "ticker-up" : "ticker-down"
                }
                aria-hidden="true"
              >
                {item.direction === "up" ? "▲" : "▼"} {Math.abs(item.delta)}%
              </span>
            </motion.span>
          ))}
        </div>
      </div>
      <div className="banner-right" aria-label="Clock">
        <button
          className="ghost ghost-link"
          aria-label="Toggle time format"
          onClick={() => setClockFormat((f) => (f === "24h" ? "12h" : "24h"))}
        >
          {clockFormat === "24h" ? "24h" : "12h"} ·{" "}
          {formatTime(now, clockFormat)}
        </button>
      </div>
    </motion.div>
  );
}
