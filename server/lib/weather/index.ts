import { MockWeatherProvider } from "./mockProvider";
import {
  PrecipitationLevel,
  WeatherCondition,
  WeatherProvider,
  WeatherScenario,
  WeatherSnapshot,
} from "./types";

let activeProvider: WeatherProvider = new MockWeatherProvider();

/** Swap provider when a real weather API is wired (Phase 2+). */
export function setWeatherProvider(provider: WeatherProvider): void {
  activeProvider = provider;
}

export function getWeatherForPlan(city: string, scenario?: WeatherScenario): WeatherSnapshot {
  return activeProvider.getWeather(city, scenario);
}

export type { WeatherProvider, WeatherScenario, WeatherSnapshot, WeatherCondition, PrecipitationLevel };
