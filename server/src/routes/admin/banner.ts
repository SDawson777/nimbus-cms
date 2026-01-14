import { Router } from "express";
import axios from "axios";

const router = Router();

// Fallback weather data when API key is not configured or request fails
const FALLBACK_WEATHER = {
  temp: 72,
  desc: "Clear skies",
  condition: "Clear",
  icon: "☀️",
  mood: "sunny",
};

router.get("/", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ?? "0.0.0.0";

    // Location lookup (fallback-safe)
    let city = "Detroit";
    let region = "Michigan";
    try {
      const loc = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 3000 });
      if (loc.data?.city) city = loc.data.city;
      if (loc.data?.region) region = loc.data.region;
    } catch (_) {
      // Use fallback location
    }

    // Weather - always returns data (real or fallback)
    let weather = { ...FALLBACK_WEATHER };
    try {
      const apiUrl = process.env.OPENWEATHER_API_URL || "https://api.openweathermap.org/data/2.5/weather";
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (apiKey) {
        const w = await axios.get(
          `${apiUrl}?q=${encodeURIComponent(city)}&appid=${apiKey}&units=imperial`,
          { timeout: 5000 }
        );
        const condition = w.data.weather?.[0]?.main || "Clear";
        const mood = normalizeCondition(condition);
        weather = {
          temp: Math.round(w.data.main?.temp ?? 72),
          desc: w.data.weather?.[0]?.description || "clear sky",
          condition,
          icon: iconForMood(mood),
          mood,
        };
      }
    } catch (_) {
      // Use fallback weather
    }

    // Example analytics snapshot (placeholder)
    const analytics = {
      activeUsers: 234,
      change: +8.2,
    };

    // if admin present, include envelope info
    const admin = (req as any).admin || null;
    const tenantSlug = admin?.organizationSlug || admin?.brandSlug || null;

    res.json({
      now: new Date().toISOString(),
      city,
      region,
      weather,
      analytics,
      tenant: tenantSlug,
      admin: admin ? { email: admin.email, role: admin.role } : null,
    });
  } catch (err) {
    // Return fallback data even on error
    res.json({
      now: new Date().toISOString(),
      city: "Detroit",
      region: "Michigan",
      weather: FALLBACK_WEATHER,
      analytics: { activeUsers: 234, change: +8.2 },
      tenant: null,
      admin: null,
    });
  }
});

function normalizeCondition(condition: string): string {
  const text = String(condition || "").toLowerCase();
  if (text.includes("rain")) return "rain";
  if (text.includes("cloud")) return "cloudy";
  if (text.includes("storm")) return "storm";
  if (text.includes("snow")) return "snow";
  return "sunny";
}

function iconForMood(mood: string): string {
  switch (mood) {
    case "rain": return "🌧️";
    case "cloudy": return "⛅️";
    case "storm": return "⛈️";
    case "snow": return "❄️";
    default: return "☀️";
  }
}

export default router;
