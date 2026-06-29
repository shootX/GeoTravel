/**
 * Daylight domain types — provider-agnostic.
 * Real providers (sunrise-sunset.org, etc.) implement {@link DaylightProvider}.
 */

export interface TimeWindow {
  startMinutes: number;
  endMinutes: number;
  label: string;
}

export interface GoldenHourWindow {
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
}

export interface DaylightSnapshot {
  city: string;
  sunrise: string;
  sunset: string;
  sunriseMinutes: number;
  sunsetMinutes: number;
  goldenHourMorning: GoldenHourWindow;
  goldenHourEvening: GoldenHourWindow;
  /** Human-readable line for route summary / UI. */
  summary: string;
  simulated: boolean;
}

export interface DaylightProvider {
  getDaylight(city: string): DaylightSnapshot;
}
