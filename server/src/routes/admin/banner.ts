import { Router } from "express";
import axios from "axios";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.toString().split(",")[0] ?? "0.0.0.0";

    // Location lookup (fallback-safe)
    let city = "Unknown";
    let region = "";
    try {
      const loc = await axios.get(`https://ipapi.co/${ip}/json/`);
      city = loc.data.city;
      region = loc.data.region;
    } catch (_) {}

    // Weather
    let weather = null;
    try {
      const apiUrl = process.env.OPENWEATHER_API_URL || "https://api.openweathermap.org/data/2.5/weather";
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (apiKey) {
        const w = await axios.get(
          `${apiUrl}?q=${city}&appid=${apiKey}&units=imperial`,
        );
        weather = {
          temp: w.data.main.temp,
          desc: w.data.weather[0].description,
        };
      }
    } catch (_) {}

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
    res.status(500).json({ error: "Failed to load banner" });
  }
});

export default router;
