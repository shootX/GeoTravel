import {
  PrecipitationLevel,
  WeatherCondition,
  WeatherProvider,
  WeatherScenario,
  WeatherSnapshot,
} from "./types";

const SCENARIO_PRESETS: Record<
  WeatherScenario,
  { condition: WeatherCondition; precipitation: PrecipitationLevel; temperatureC: number; summary: string }
> = {
  clear: {
    condition: "clear",
    precipitation: "none",
    temperatureC: 22,
    summary: "Clear skies — all stops available.",
  },
  cloudy: {
    condition: "cloudy",
    precipitation: "none",
    temperatureC: 18,
    summary: "Overcast but dry — standard routing.",
  },
  "light-rain": {
    condition: "light-rain",
    precipitation: "light",
    temperatureC: 15,
    summary: "Light rain expected — indoor and covered stops prioritized.",
  },
  "heavy-rain": {
    condition: "heavy-rain",
    precipitation: "heavy",
    temperatureC: 12,
    summary: "Heavy rain — outdoor viewpoints avoided, indoor focus.",
  },
};

/** Deterministic city → scenario mapping for demo variety without API calls. */
const CITY_DEFAULT_SCENARIO: Record<string, WeatherScenario> = {
  Tbilisi: "light-rain",
  Paris: "cloudy",
  Rome: "clear",
  Tokyo: "light-rain",
  "New York": "heavy-rain",
};

function resolveScenario(city: string, override?: WeatherScenario): WeatherScenario {
  if (override) {
    return override;
  }

  const envScenario = process.env.WEATHER_MOCK_SCENARIO as WeatherScenario | undefined;
  if (envScenario && envScenario in SCENARIO_PRESETS) {
    return envScenario;
  }

  const normalized = city.trim();
  const match = Object.entries(CITY_DEFAULT_SCENARIO).find(
    ([name]) => name.toLowerCase() === normalized.toLowerCase()
  );
  return match?.[1] ?? "clear";
}

export class MockWeatherProvider implements WeatherProvider {
  getWeather(city: string, scenario?: WeatherScenario): WeatherSnapshot {
    const resolved = resolveScenario(city, scenario);
    const preset = SCENARIO_PRESETS[resolved];

    const isRaining = preset.precipitation !== "none";
    const isHeavyRain = preset.precipitation === "heavy";

    return {
      city,
      condition: preset.condition,
      precipitation: preset.precipitation,
      temperatureC: preset.temperatureC,
      isRaining,
      isHeavyRain,
      summary: preset.summary,
      simulated: true,
    };
  }
}
