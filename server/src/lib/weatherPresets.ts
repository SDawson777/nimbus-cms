/**
 * Weather Preset Mapping Library
 * Maps weather conditions to visual presets and modifiers for Apple-like atmosphere rendering
 */

export type WeatherPreset =
  | "clearDay"
  | "clearNight"
  | "partlyCloudyDay"
  | "partlyCloudyNight"
  | "overcast"
  | "rain"
  | "snowOvercast"
  | "fog"
  | "windyClouds";

export type DayPart = "day" | "night" | "dawn" | "dusk";

export interface WeatherModifiers {
  cloudDensity: number; // 0-1
  wind: number; // 0-1
  precipIntensity: number; // 0-1
  brightness: number; // 0-1
  timeTone: DayPart;
}

export interface VisualConfig {
  visualStyle?: string;
  motionIntensity?: number;
  particlesEnabled?: boolean;
  parallaxEnabled?: boolean;
  paletteMode?: string;
  brandTintStrength?: number;
}

export interface WeatherPresetResult {
  preset: WeatherPreset;
  modifiers: WeatherModifiers;
}

/**
 * Map OpenWeather-style condition codes to presets
 * Reference: https://openweathermap.org/weather-conditions
 */
const CONDITION_TO_PRESET: Record<string, WeatherPreset> = {
  // Clear
  clear: "clearDay",
  sunny: "clearDay",
  "01d": "clearDay",
  "01n": "clearNight",

  // Partly Cloudy
  "partly-cloudy": "partlyCloudyDay",
  "partly-cloudy-day": "partlyCloudyDay",
  "partly-cloudy-night": "partlyCloudyNight",
  "02d": "partlyCloudyDay",
  "02n": "partlyCloudyNight",

  // Cloudy
  cloudy: "overcast",
  overcast: "overcast",
  "03d": "overcast",
  "03n": "overcast",
  "04d": "overcast",
  "04n": "overcast",

  // Rain
  rain: "rain",
  rainy: "rain",
  drizzle: "rain",
  "09d": "rain",
  "09n": "rain",
  "10d": "rain",
  "10n": "rain",
  "11d": "rain", // thunderstorm
  "11n": "rain",

  // Snow
  snow: "snowOvercast",
  snowy: "snowOvercast",
  "13d": "snowOvercast",
  "13n": "snowOvercast",

  // Fog/Mist
  fog: "fog",
  mist: "fog",
  haze: "fog",
  "50d": "fog",
  "50n": "fog",

  // Windy
  windy: "windyClouds",
  storm: "rain",
  thunderstorm: "rain",
  hot: "clearDay",
  cold: "overcast",
};

/**
 * Determine day/night based on hour (0-23)
 */
function getDayPart(hour?: number): DayPart {
  if (hour === undefined) {
    const now = new Date();
    hour = now.getHours();
  }

  if (hour >= 5 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 19) return "day";
  if (hour >= 19 && hour < 21) return "dusk";
  return "night";
}

/**
 * Map weather condition to preset and modifiers
 */
export function mapWeatherToPreset(
  conditionCode: string,
  dayPart?: DayPart,
  config?: VisualConfig,
  weatherData?: {
    temp?: number;
    feelsLike?: number;
    wind?: number;
    precipProb?: number;
    cloudCover?: number;
  },
): WeatherPresetResult {
  const normalizedCondition = conditionCode.toLowerCase().trim();
  let preset =
    CONDITION_TO_PRESET[normalizedCondition] ||
    CONDITION_TO_PRESET["clear"] ||
    "clearDay";

  // Determine time of day
  const timeTone = dayPart || getDayPart();

  // Adjust preset for day/night if needed
  if (timeTone === "night" || timeTone === "dusk") {
    if (preset === "clearDay") preset = "clearNight";
    if (preset === "partlyCloudyDay") preset = "partlyCloudyNight";
  }

  // Calculate modifiers from weather data
  const cloudDensity = weatherData?.cloudCover !== undefined
    ? weatherData.cloudCover / 100
    : preset.includes("overcast")
    ? 0.8
    : preset.includes("partly")
    ? 0.5
    : 0.2;

  const wind = weatherData?.wind !== undefined
    ? Math.min(weatherData.wind / 30, 1) // normalize 0-30mph to 0-1
    : preset === "windyClouds"
    ? 0.7
    : 0.3;

  const precipIntensity = weatherData?.precipProb !== undefined
    ? weatherData.precipProb / 100
    : preset === "rain"
    ? 0.6
    : preset === "snowOvercast"
    ? 0.5
    : 0.0;

  const brightness = timeTone === "day"
    ? 0.9
    : timeTone === "dawn" || timeTone === "dusk"
    ? 0.6
    : 0.3;

  const modifiers: WeatherModifiers = {
    cloudDensity,
    wind,
    precipIntensity,
    brightness,
    timeTone,
  };

  return {
    preset,
    modifiers,
  };
}

/**
 * Generate CSS/style variables from preset and modifiers
 * For mobile, this provides ready-to-use style hints
 */
export function getStyleHints(
  preset: WeatherPreset,
  modifiers: WeatherModifiers,
  config?: VisualConfig,
): Record<string, string | number | boolean> {
  const intensity = config?.motionIntensity ?? 0.35;

  // Base color palettes for each preset
  const palettes: Record<WeatherPreset, { primary: string; secondary: string; accent: string }> = {
    clearDay: { primary: "#87CEEB", secondary: "#FFF8DC", accent: "#FFD700" },
    clearNight: { primary: "#191970", secondary: "#000080", accent: "#C0C0C0" },
    partlyCloudyDay: { primary: "#87CEEB", secondary: "#D3D3D3", accent: "#FFFFFF" },
    partlyCloudyNight: { primary: "#2F4F4F", secondary: "#696969", accent: "#C0C0C0" },
    overcast: { primary: "#808080", secondary: "#A9A9A9", accent: "#FFFFFF" },
    rain: { primary: "#4682B4", secondary: "#708090", accent: "#B0C4DE" },
    snowOvercast: { primary: "#F0F8FF", secondary: "#E0FFFF", accent: "#FFFFFF" },
    fog: { primary: "#DCDCDC", secondary: "#D3D3D3", accent: "#F5F5F5" },
    windyClouds: { primary: "#B0C4DE", secondary: "#778899", accent: "#F0F8FF" },
  };

  const palette = palettes[preset] || palettes.clearDay;

  return {
    primaryColor: palette.primary,
    secondaryColor: palette.secondary,
    accentColor: palette.accent,
    brightness: modifiers.brightness,
    cloudOpacity: modifiers.cloudDensity * 0.7,
    windSpeed: modifiers.wind * intensity,
    precipOpacity: modifiers.precipIntensity * 0.8,
    particlesEnabled: config?.particlesEnabled ?? true,
    parallaxEnabled: config?.parallaxEnabled ?? false,
    transitionMs: 450,
  };
}

/**
 * Get recommendation reasoning based on weather
 */
export function getWeatherReason(
  conditionCode: string,
  temp?: number,
): { primary: string; secondary?: string } {
  const normalized = conditionCode.toLowerCase();

  if (normalized.includes("rain") || normalized.includes("storm")) {
    return {
      primary: "Cozy picks for rainy weather",
      secondary: "Relaxing products perfect for staying in",
    };
  }

  if (normalized.includes("snow") || (temp !== undefined && temp < 32)) {
    return {
      primary: "Warming choices for cold weather",
      secondary: "Comforting products to warm you up",
    };
  }

  if (normalized.includes("clear") || normalized.includes("sunny")) {
    return {
      primary: "Energizing picks for sunny days",
      secondary: "Uplifting products to match the vibe",
    };
  }

  if (normalized.includes("cloud") && !normalized.includes("overcast")) {
    return {
      primary: "Balanced options for partly cloudy days",
      secondary: "Versatile picks for any mood",
    };
  }

  if (temp !== undefined && temp > 85) {
    return {
      primary: "Refreshing choices for hot weather",
      secondary: "Cooling products for warm days",
    };
  }

  return {
    primary: "Recommended for today",
    secondary: "Curated picks based on current conditions",
  };
}
