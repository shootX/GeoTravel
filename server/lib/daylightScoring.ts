import { Place } from "../types/place";
import {
  getPreferredWindowForSlot,
  isEveningOptimal,
  isMorningOptimal,
  isSunriseOptimal,
  isSunsetViewpoint,
  parseBestVisitSlot,
} from "./placeKnowledge";
import { DaylightSnapshot } from "./daylight";
import { minutesInWindow } from "./daylight/timeUtils";

/**
 * Score how well an arrival time matches sunrise-optimal places.
 * Returns 0 when not sunrise-relevant.
 */
export function sunriseScore(place: Place, arrivalMinutes: number, daylight: DaylightSnapshot): number {
  if (!isSunriseOptimal(place)) {
    return 0;
  }

  const golden = daylight.goldenHourMorning;
  if (minutesInWindow(arrivalMinutes, golden.startMinutes, golden.endMinutes)) {
    return 10;
  }
  if (minutesInWindow(arrivalMinutes, daylight.sunriseMinutes, daylight.sunriseMinutes + 120)) {
    return 6;
  }
  if (arrivalMinutes > 12 * 60) {
    return -8;
  }
  return -3;
}

/**
 * Score how well an arrival time matches sunset / evening viewpoints.
 */
export function sunsetScore(place: Place, arrivalMinutes: number, daylight: DaylightSnapshot): number {
  if (!isSunsetViewpoint(place) && !isEveningOptimal(place)) {
    return 0;
  }

  const golden = daylight.goldenHourEvening;
  if (minutesInWindow(arrivalMinutes, golden.startMinutes, golden.endMinutes)) {
    return 12;
  }
  if (minutesInWindow(arrivalMinutes, daylight.sunsetMinutes - 90, daylight.sunsetMinutes + 15)) {
    return 7;
  }
  if (arrivalMinutes < 14 * 60) {
    return -8;
  }
  if (arrivalMinutes < 16 * 60) {
    return -4;
  }
  return -2;
}

/**
 * Golden hour bonus — sunrise places in morning golden hour, sunset places in evening.
 */
export function goldenHourScore(place: Place, arrivalMinutes: number, daylight: DaylightSnapshot): number {
  const slot = parseBestVisitSlot(place);
  const morningGolden = daylight.goldenHourMorning;
  const eveningGolden = daylight.goldenHourEvening;

  if (slot === "sunrise" || slot === "morning") {
    if (minutesInWindow(arrivalMinutes, morningGolden.startMinutes, morningGolden.endMinutes)) {
      return 5;
    }
  }

  if (slot === "sunset" || slot === "evening" || (slot === "flexible" && place.category === "viewpoint")) {
    if (minutesInWindow(arrivalMinutes, eveningGolden.startMinutes, eveningGolden.endMinutes)) {
      return 5;
    }
  }

  return 0;
}

/**
 * Combined daylight compatibility for a scheduled arrival time.
 */
export function daylightCompatibilityScore(
  place: Place,
  arrivalMinutes: number,
  daylight: DaylightSnapshot
): number {
  const slot = parseBestVisitSlot(place);
  const preferred = getPreferredWindowForSlot(slot);
  let score = sunriseScore(place, arrivalMinutes, daylight);
  score += sunsetScore(place, arrivalMinutes, daylight);
  score += goldenHourScore(place, arrivalMinutes, daylight);

  if (preferred && !minutesInWindow(arrivalMinutes, preferred.start, preferred.end)) {
    const midpoint = (preferred.start + preferred.end) / 2;
    const distanceHours = Math.abs(arrivalMinutes - midpoint) / 60;
    score -= Math.min(6, Math.round(distanceHours * 1.5));
  }

  return score;
}

/** Priority for route ordering — lower = earlier in route. */
export function daylightSortPriority(place: Place): number {
  if (isSunriseOptimal(place) || isMorningOptimal(place)) {
    return 0;
  }
  if (isSunsetViewpoint(place) || isEveningOptimal(place)) {
    return 2;
  }
  return 1;
}

export function buildTimeOfDayNote(place: Place, arrivalMinutes: number, daylight: DaylightSnapshot): string | undefined {
  const score = daylightCompatibilityScore(place, arrivalMinutes, daylight);
  const slot = parseBestVisitSlot(place);

  if (score >= 8 && (slot === "sunset" || slot === "evening")) {
    return `Best at ${place.bestVisitTime.toLowerCase()} — scheduled for golden hour`;
  }
  if (score >= 8 && (slot === "sunrise" || slot === "morning")) {
    return `Best in the ${place.bestVisitTime.toLowerCase()} — timed for morning light`;
  }
  if (score >= 5 && slot !== "flexible") {
    return `Recommended ${place.bestVisitTime.toLowerCase()} visit`;
  }
  return undefined;
}
