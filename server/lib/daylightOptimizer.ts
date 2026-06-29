import { Place, TransportMode } from "../types/place";
import { estimateTravelMinutes, haversineDistanceKm } from "./distance";
import { getVisitDuration } from "./placeKnowledge";
import { DaylightSnapshot } from "./daylight";
import { daylightCompatibilityScore, daylightSortPriority } from "./daylightScoring";

const START_HOUR = 10;
const START_MINUTE = 0;
const START_MINUTES = START_HOUR * 60 + START_MINUTE;

function routeTravelMinutes(stops: Place[], transport: TransportMode): number {
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    const dist = haversineDistanceKm(
      stops[i - 1].lat,
      stops[i - 1].lng,
      stops[i].lat,
      stops[i].lng
    );
    total += estimateTravelMinutes(dist, transport);
  }
  return total;
}

function routeVisitMinutes(stops: Place[]): number {
  return stops.reduce((sum, s) => sum + getVisitDuration(s), 0);
}

export function fitsTimeBudget(
  stops: Place[],
  totalMinutes: number,
  transport: TransportMode
): boolean {
  return routeVisitMinutes(stops) + routeTravelMinutes(stops, transport) <= totalMinutes;
}

/** Compute arrival minute (from midnight) for each stop given route order. */
export function computeArrivalMinutes(
  stops: Place[],
  transport: TransportMode,
  startMinutes: number = START_MINUTES
): number[] {
  const arrivals: number[] = [];
  let elapsed = 0;

  for (let i = 0; i < stops.length; i++) {
    if (i > 0) {
      const prev = stops[i - 1];
      const dist = haversineDistanceKm(prev.lat, prev.lng, stops[i].lat, stops[i].lng);
      elapsed += estimateTravelMinutes(dist, transport);
    }
    arrivals.push(startMinutes + elapsed);
    elapsed += getVisitDuration(stops[i]);
  }

  return arrivals;
}

function totalDaylightScore(
  stops: Place[],
  transport: TransportMode,
  daylight: DaylightSnapshot
): number {
  const arrivals = computeArrivalMinutes(stops, transport);
  return stops.reduce(
    (sum, place, i) => sum + daylightCompatibilityScore(place, arrivals[i], daylight),
    0
  );
}

function moveStop(route: Place[], fromIndex: number, toIndex: number): Place[] {
  const next = [...route];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/**
 * Reorder route to align morning places early and sunset viewpoints late.
 * Uses constrained moves that preserve the time budget.
 */
export function optimizeRouteForDaylight(
  route: Place[],
  totalMinutes: number,
  transport: TransportMode,
  daylight: DaylightSnapshot
): Place[] {
  if (route.length <= 2) {
    return route;
  }

  let best = [...route];
  let bestScore = totalDaylightScore(best, transport, daylight);
  let improved = true;

  while (improved) {
    improved = false;

    for (let i = 0; i < best.length; i++) {
      const place = best[i];
      const priority = daylightSortPriority(place);

      if (priority === 2) {
        for (let target = best.length - 1; target > i; target--) {
          const candidate = moveStop(best, i, target);
          if (!fitsTimeBudget(candidate, totalMinutes, transport)) {
            continue;
          }
          const score = totalDaylightScore(candidate, transport, daylight);
          if (score > bestScore) {
            best = candidate;
            bestScore = score;
            improved = true;
            break;
          }
        }
      }

      if (priority === 0) {
        for (let target = 0; target < i; target++) {
          const candidate = moveStop(best, i, target);
          if (!fitsTimeBudget(candidate, totalMinutes, transport)) {
            continue;
          }
          const score = totalDaylightScore(candidate, transport, daylight);
          if (score > bestScore) {
            best = candidate;
            bestScore = score;
            improved = true;
            break;
          }
        }
      }
    }
  }

  return best;
}
