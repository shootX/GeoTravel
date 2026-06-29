export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role?: "admin" | "user";
}

export type WeatherScenario = "clear" | "cloudy" | "light-rain" | "heavy-rain";

export interface TravelPreferences {
  city: string;
  timeLimit: string;
  transport: "walk" | "car" | "mixed";
  interests: string[];
  /** Optional mock weather override — omitted in normal client requests. */
  weatherScenario?: WeatherScenario;
}

export interface PlanDaylight {
  sunrise: string;
  sunset: string;
  summary: string;
  simulated: boolean;
}

export interface PlanWeather {
  condition: string;
  precipitation: string;
  temperatureC: number;
  summary: string;
  simulated: boolean;
}

export interface PlanStop {
  name: string;
  category: string;
  lat: number;
  lng: number;
  duration: number;
  startTime: string;
  /** Short summary — unchanged for existing UI. */
  description: string;
  /** Rich narrative for Story Mode; optional for backward-compatible API responses. */
  fullDescription?: string;
  /** Local insider tip for Story Mode. */
  localTips?: string;
  /** Daylight optimizer note — e.g. golden hour timing. */
  timeOfDayNote?: string;
}

export interface TravelPlan {
  title: string;
  city: string;
  totalTime: number;
  center: { lat: number; lng: number };
  stops: PlanStop[];
  routeSummary: string;
  /** Present when weather-aware routing was applied. */
  weather?: PlanWeather;
  /** Present when daylight optimization was applied. */
  daylight?: PlanDaylight;
  /** Present when AI route planning was used. */
  ai?: {
    provider: string;
    model: string;
    modelId: string;
    theme?: string;
  };
}
