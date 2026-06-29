import { MockDaylightProvider } from "./mockProvider";
import {
  DaylightProvider,
  DaylightSnapshot,
  GoldenHourWindow,
  TimeWindow,
} from "./types";

let activeProvider: DaylightProvider = new MockDaylightProvider();

/** Swap provider when a real daylight API is wired. */
export function setDaylightProvider(provider: DaylightProvider): void {
  activeProvider = provider;
}

export function getDaylightForPlan(city: string): DaylightSnapshot {
  return activeProvider.getDaylight(city);
}

export type { DaylightProvider, DaylightSnapshot, TimeWindow, GoldenHourWindow };
