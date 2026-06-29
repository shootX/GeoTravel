/**
 * Weather domain types — provider-agnostic.
 * Real API providers (OpenWeather, etc.) implement {@link WeatherProvider}.
 */

export type PrecipitationLevel = "none" | "light" | "moderate" | "heavy";

export type WeatherCondition =
  | "clear"
  | "partly-cloudy"
  | "cloudy"
  | "light-rain"
  | "rain"
  | "heavy-rain";

/** Preset scenarios for mock weather and optional client override. */
export type WeatherScenario =
  | "clear"
  | "cloudy"
  | "light-rain"
  | "heavy-rain";

export interface WeatherSnapshot {
  city: string;
  condition: WeatherCondition;
  precipitation: PrecipitationLevel;
  temperatureC: number;
  isRaining: boolean;
  isHeavyRain: boolean;
  /** Human-readable line for route summary / UI. */
  summary: string;
  /** True when the snapshot came from mock data (not a live API). */
  simulated: boolean;
}

export interface WeatherProvider {
  getWeather(city: string, scenario?: WeatherScenario): WeatherSnapshot;
}
