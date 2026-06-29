import { TravelPlan, TravelPreferences, PlanStop } from "../../src/types";
import { findCityPlaces } from "../lib/cms/placeRepository";
import { estimateTravelMinutes, haversineDistanceKm } from "../lib/distance";
import { Place, PlaceCategory, TransportMode } from "../types/place";
import { getPlanStopDescription, getStoryDescription, getStoryLocalTips, getVisitDuration } from "./placeKnowledge";
import { getWeatherForPlan, WeatherSnapshot } from "./weather";
import { weatherCompatibilityBonus } from "./weatherScoring";
import { getDaylightForPlan, DaylightSnapshot } from "./daylight";
import { buildTimeOfDayNote } from "./daylightScoring";
import { optimizeRouteForDaylight } from "./daylightOptimizer";

const TIME_LIMIT_TO_MINUTES: Record<string, number> = {
  "2h": 120,
  "4h": 240,
  "6h": 360,
  "1day": 480,
};

const LANDMARK_CATEGORIES: PlaceCategory[] = ["history", "culture"];
const EXPERIENCE_CATEGORIES: PlaceCategory[] = ["food", "nature"];
const MAX_STOPS = 7;
const MIN_STOPS = 4;
const START_HOUR = 10;
const START_MINUTE = 0;

const INTEREST_TO_CATEGORIES: Record<string, PlaceCategory[]> = {
  history: ["history", "culture", "viewpoint"],
  nature: ["nature", "viewpoint"],
  food: ["food"],
  culture: ["culture", "history"],
  viewpoint: ["viewpoint", "nature"],
  mixed: ["history", "nature", "food", "viewpoint", "culture"],
};

function normalizeCity(city: string): string {
  return city.trim().charAt(0).toUpperCase() + city.trim().slice(1).toLowerCase();
}

export const normalizeCityName = normalizeCity;

export function resolveTotalMinutes(timeLimit: string): number {
  return TIME_LIMIT_TO_MINUTES[timeLimit] ?? 240;
}

export function filterPlacesForRequest(city: string, interests: string[]): Place[] {
  return filterPlaces(city, interests);
}

function resolveInterestCategories(interests: string[]): PlaceCategory[] {
  if (interests.length === 0 || interests.includes("mixed")) {
    return INTEREST_TO_CATEGORIES.mixed;
  }

  const categories = new Set<PlaceCategory>();
  for (const interest of interests) {
    const mapped = INTEREST_TO_CATEGORIES[interest.toLowerCase()];
    if (mapped) {
      mapped.forEach((c) => categories.add(c));
    }
  }

  return categories.size > 0 ? [...categories] : INTEREST_TO_CATEGORIES.mixed;
}

function placeMatchesInterests(place: Place, categories: PlaceCategory[]): boolean {
  return categories.includes(place.category);
}

function filterPlaces(city: string, interests: string[]): Place[] {
  const cityPlaces = findCityPlaces(city);
  if (cityPlaces.length === 0) {
    return [];
  }

  const interestCategories = resolveInterestCategories(interests);
  const matched = cityPlaces.filter((p) => placeMatchesInterests(p, interestCategories));

  return matched.length > 0 ? matched : cityPlaces;
}

function cityCenter(places: Place[]): { lat: number; lng: number } {
  const lat = places.reduce((sum, p) => sum + p.lat, 0) / places.length;
  const lng = places.reduce((sum, p) => sum + p.lng, 0) / places.length;
  return { lat, lng };
}

function distancePenalty(distanceKm: number, transport: TransportMode): number {
  const multiplier = transport === "walk" ? 4 : transport === "car" ? 0.8 : 2;
  return distanceKm * multiplier;
}

function interestMatchBonus(place: Place, interests: string[]): number {
  if (interests.includes("mixed") || interests.length === 0) {
    return 3;
  }
  const categories = resolveInterestCategories(interests);
  return categories.includes(place.category) ? 5 : 0;
}

function categoryBalanceBonus(place: Place, usedCategories: Set<PlaceCategory>): number {
  return usedCategories.has(place.category) ? -3 : 2;
}

function scorePlace(
  place: Place,
  fromLat: number,
  fromLng: number,
  transport: TransportMode,
  interests: string[],
  usedCategories: Set<PlaceCategory>,
  weather: WeatherSnapshot
): number {
  const distance = haversineDistanceKm(fromLat, fromLng, place.lat, place.lng);
  return (
    place.popularityScore * 2 +
    interestMatchBonus(place, interests) -
    distancePenalty(distance, transport) +
    categoryBalanceBonus(place, usedCategories) +
    weatherCompatibilityBonus(place, weather)
  );
}

function isLandmark(place: Place): boolean {
  return LANDMARK_CATEGORIES.includes(place.category);
}

function isExperience(place: Place): boolean {
  return EXPERIENCE_CATEGORIES.includes(place.category);
}

function hasLandmark(stops: Place[]): boolean {
  return stops.some(isLandmark);
}

function hasExperience(stops: Place[]): boolean {
  return stops.some(isExperience);
}

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

function fitsTimeBudget(stops: Place[], totalMinutes: number, transport: TransportMode): boolean {
  const visit = routeVisitMinutes(stops);
  const travel = routeTravelMinutes(stops, transport);
  return visit + travel <= totalMinutes;
}

function pickStartingPlace(
  candidates: Place[],
  center: { lat: number; lng: number },
  transport: TransportMode,
  interests: string[],
  weather: WeatherSnapshot
): Place {
  const scored = candidates
    .map((place) => ({
      place,
      score: scorePlace(place, center.lat, center.lng, transport, interests, new Set(), weather),
    }))
    .sort((a, b) => b.score - a.score);

  const landmark = scored.find(({ place }) => isLandmark(place));
  return landmark?.place ?? scored[0].place;
}

function buildGreedyRoute(
  candidates: Place[],
  totalMinutes: number,
  transport: TransportMode,
  interests: string[],
  weather: WeatherSnapshot
): Place[] {
  if (candidates.length === 0) {
    return [];
  }

  const center = cityCenter(candidates);
  const available = new Map(candidates.map((p) => [p.id, p]));
  const route: Place[] = [];

  const start = pickStartingPlace(candidates, center, transport, interests, weather);
  route.push(start);
  available.delete(start.id);

  const usedCategories = new Set<PlaceCategory>([start.category]);
  let current = start;

  while (route.length < MAX_STOPS && available.size > 0) {
    const remaining = [...available.values()];
    const scored = remaining
      .map((place) => ({
        place,
        score: scorePlace(
          place,
          current.lat,
          current.lng,
          transport,
          interests,
          usedCategories,
          weather
        ),
      }))
      .sort((a, b) => b.score - a.score);

    let picked: Place | null = null;

    for (const { place } of scored) {
      const tentative = [...route, place];
      if (!fitsTimeBudget(tentative, totalMinutes, transport)) {
        continue;
      }

      const lastCategory = route[route.length - 1].category;
      if (place.category === lastCategory && route.length >= MIN_STOPS - 1) {
        continue;
      }

      picked = place;
      break;
    }

    if (!picked) {
      break;
    }

    route.push(picked);
    available.delete(picked.id);
    usedCategories.add(picked.category);
    current = picked;
  }

  return ensureMandatoryStops(route, candidates, totalMinutes, transport, weather);
}

function sortByWeatherAwarePopularity(places: Place[], weather: WeatherSnapshot): Place[] {
  return [...places].sort((a, b) => {
    const scoreA = a.popularityScore + weatherCompatibilityBonus(a, weather) * 0.5;
    const scoreB = b.popularityScore + weatherCompatibilityBonus(b, weather) * 0.5;
    return scoreB - scoreA;
  });
}

function ensureMandatoryStops(
  route: Place[],
  allCandidates: Place[],
  totalMinutes: number,
  transport: TransportMode,
  weather: WeatherSnapshot
): Place[] {
  let result = [...route];

  if (!hasLandmark(result)) {
    const landmark = sortByWeatherAwarePopularity(
      allCandidates.filter((p) => isLandmark(p) && !result.some((r) => r.id === p.id)),
      weather
    )[0];

    if (landmark) {
      const withLandmark = insertBestPosition(result, landmark, totalMinutes, transport);
      if (withLandmark) {
        result = withLandmark;
      }
    }
  }

  if (!hasExperience(result)) {
    const experience = sortByWeatherAwarePopularity(
      allCandidates.filter((p) => isExperience(p) && !result.some((r) => r.id === p.id)),
      weather
    )[0];

    if (experience) {
      const withExperience = insertBestPosition(result, experience, totalMinutes, transport);
      if (withExperience) {
        result = withExperience;
      }
    }
  }

  return result;
}

function insertBestPosition(
  route: Place[],
  place: Place,
  totalMinutes: number,
  transport: TransportMode
): Place[] | null {
  if (route.length >= MAX_STOPS) {
    return null;
  }

  let bestRoute: Place[] | null = null;
  let bestTravel = Infinity;

  for (let i = 0; i <= route.length; i++) {
    const tentative = [...route.slice(0, i), place, ...route.slice(i)];
    if (!fitsTimeBudget(tentative, totalMinutes, transport)) {
      continue;
    }

    const travel = routeTravelMinutes(tentative, transport);
    if (travel < bestTravel) {
      bestTravel = travel;
      bestRoute = tentative;
    }
  }

  return bestRoute;
}

function trimToTimeBudget(
  route: Place[],
  totalMinutes: number,
  transport: TransportMode
): Place[] {
  let trimmed = [...route];

  while (trimmed.length > 0 && !fitsTimeBudget(trimmed, totalMinutes, transport)) {
    const removable = trimmed
      .map((place, index) => ({ place, index }))
      .filter(({ place }) => {
        const without = trimmed.filter((p) => p.id !== place.id);
        return hasLandmark(without) && hasExperience(without);
      })
      .sort((a, b) => a.place.popularityScore - b.place.popularityScore);

    if (removable.length === 0) {
      trimmed.pop();
      continue;
    }

    const { index } = removable[0];
    trimmed = trimmed.filter((_, i) => i !== index);
  }

  return trimmed;
}

function buildFallbackPlan(
  city: string,
  totalMinutes: number,
  transport: TransportMode,
  interests: string[],
  weather: WeatherSnapshot
): Place[] {
  const cityPlaces = findCityPlaces(city);
  if (cityPlaces.length === 0) {
    return [];
  }

  const sorted = sortByWeatherAwarePopularity(cityPlaces, weather);
  const route: Place[] = [];

  for (const place of sorted) {
    if (route.length >= MAX_STOPS) {
      break;
    }

    const tentative = [...route, place];
    if (fitsTimeBudget(tentative, totalMinutes, transport)) {
      route.push(place);
    }
  }

  return ensureMandatoryStops(route, cityPlaces, totalMinutes, transport, weather);
}

function formatTime(totalMinutesFromStart: number): string {
  const hours = Math.floor((START_HOUR * 60 + START_MINUTE + totalMinutesFromStart) / 60);
  const minutes = (START_MINUTE + totalMinutesFromStart) % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function assignSchedule(
  stops: Place[],
  transport: TransportMode,
  daylight: DaylightSnapshot
): PlanStop[] {
  const scheduled: PlanStop[] = [];
  let elapsed = 0;

  for (let i = 0; i < stops.length; i++) {
    const place = stops[i];

    if (i > 0) {
      const prev = stops[i - 1];
      const dist = haversineDistanceKm(prev.lat, prev.lng, place.lat, place.lng);
      elapsed += estimateTravelMinutes(dist, transport);
    }

    const arrivalMinutes = START_HOUR * 60 + START_MINUTE + elapsed;
    const timeOfDayNote = buildTimeOfDayNote(place, arrivalMinutes, daylight);

    scheduled.push({
      name: place.name,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      duration: getVisitDuration(place),
      startTime: formatTime(elapsed),
      description: getPlanStopDescription(place),
      fullDescription: getStoryDescription(place),
      localTips: getStoryLocalTips(place),
      ...(timeOfDayNote ? { timeOfDayNote } : {}),
    });

    elapsed += getVisitDuration(place);
  }

  return scheduled;
}

function buildTitle(city: string, transport: TransportMode, interests: string[]): string {
  const focus =
    interests.includes("mixed") || interests.length === 0
      ? "Explorer"
      : interests.map((i) => i.charAt(0).toUpperCase() + i.slice(1)).join(" & ");
  const mode =
    transport === "walk" ? "Walking" : transport === "car" ? "Driving" : "Mixed";
  return `${city} ${focus} ${mode} Plan`;
}

function buildRouteSummary(
  city: string,
  stops: PlanStop[],
  transport: TransportMode,
  weather: WeatherSnapshot,
  daylight: DaylightSnapshot
): string {
  const transportLabel =
    transport === "walk" ? "walking" : transport === "car" ? "driving" : "mixed transport";
  let summary = `Optimized ${transportLabel} route through ${city} with ${stops.length} stops`;

  const hasDaylightNotes = stops.some((s) => s.timeOfDayNote);
  if (hasDaylightNotes) {
    summary += `. ${daylight.summary}`;
  }

  if (weather.isRaining) {
    summary += `. ${weather.summary}`;
  }

  return summary;
}

function computeCenter(stops: PlanStop[]): { lat: number; lng: number } {
  if (stops.length === 0) {
    return { lat: 0, lng: 0 };
  }
  return {
    lat: stops.reduce((sum, s) => sum + s.lat, 0) / stops.length,
    lng: stops.reduce((sum, s) => sum + s.lng, 0) / stops.length,
  };
}

export function buildEmptyPlan(
  city: string,
  totalMinutes: number,
  request: TravelPreferences
): TravelPlan {
  const weather = getWeatherForPlan(city, request.weatherScenario);
  const daylight = getDaylightForPlan(city);

  return {
    title: `${city} Day Plan`,
    city,
    totalTime: totalMinutes,
    center: { lat: 0, lng: 0 },
    stops: [],
    routeSummary: `No places found for ${city}. Try a supported city: Tbilisi, Paris, Rome, Tokyo, New York.`,
    weather: {
      condition: weather.condition,
      precipitation: weather.precipitation,
      temperatureC: weather.temperatureC,
      summary: weather.summary,
      simulated: weather.simulated,
    },
    daylight: {
      sunrise: daylight.sunrise,
      sunset: daylight.sunset,
      summary: daylight.summary,
      simulated: daylight.simulated,
    },
  };
}

export function buildPlanFromRoute(
  route: Place[],
  request: TravelPreferences,
  overrides?: { title?: string; routeSummary?: string }
): TravelPlan {
  const city = normalizeCity(request.city);
  const totalMinutes = resolveTotalMinutes(request.timeLimit);
  const transport = request.transport;
  const weather = getWeatherForPlan(city, request.weatherScenario);
  const daylight = getDaylightForPlan(city);

  let optimized = trimToTimeBudget(route, totalMinutes, transport);
  optimized = optimizeRouteForDaylight(optimized, totalMinutes, transport, daylight);
  const stops = assignSchedule(optimized, transport, daylight);

  return {
    title: overrides?.title || buildTitle(city, transport, request.interests),
    city,
    totalTime: totalMinutes,
    center: computeCenter(stops),
    stops,
    routeSummary: overrides?.routeSummary || buildRouteSummary(city, stops, transport, weather, daylight),
    weather: {
      condition: weather.condition,
      precipitation: weather.precipitation,
      temperatureC: weather.temperatureC,
      summary: weather.summary,
      simulated: weather.simulated,
    },
    daylight: {
      sunrise: daylight.sunrise,
      sunset: daylight.sunset,
      summary: daylight.summary,
      simulated: daylight.simulated,
    },
  };
}

export function generatePlan(request: TravelPreferences): TravelPlan {
  const city = normalizeCity(request.city);
  const totalMinutes = resolveTotalMinutes(request.timeLimit);
  const transport = request.transport;
  const weather = getWeatherForPlan(city, request.weatherScenario);

  let candidates = filterPlaces(city, request.interests);

  if (candidates.length === 0) {
    return buildEmptyPlan(city, totalMinutes, request);
  }

  let route = buildGreedyRoute(candidates, totalMinutes, transport, request.interests, weather);
  route = trimToTimeBudget(route, totalMinutes, transport);

  if (route.length === 0 || !hasLandmark(route) || !hasExperience(route)) {
    route = buildFallbackPlan(city, totalMinutes, transport, request.interests, weather);
    route = trimToTimeBudget(route, totalMinutes, transport);
  }

  route = optimizeRouteForDaylight(route, totalMinutes, transport, getDaylightForPlan(city));

  return buildPlanFromRoute(route, request);
}

const VALID_WEATHER_SCENARIOS = new Set(["clear", "cloudy", "light-rain", "heavy-rain"]);

export function validatePlanRequest(body: unknown): TravelPreferences | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { city, timeLimit, transport, interests, weatherScenario } = body as Record<string, unknown>;

  if (typeof city !== "string" || !city.trim()) {
    return null;
  }

  if (typeof timeLimit !== "string" || !TIME_LIMIT_TO_MINUTES[timeLimit]) {
    return null;
  }

  if (transport !== "walk" && transport !== "car" && transport !== "mixed") {
    return null;
  }

  if (!Array.isArray(interests) || interests.some((i) => typeof i !== "string")) {
    return null;
  }

  if (
    weatherScenario !== undefined &&
    (typeof weatherScenario !== "string" || !VALID_WEATHER_SCENARIOS.has(weatherScenario))
  ) {
    return null;
  }

  return {
    city: city.trim(),
    timeLimit,
    transport,
    interests,
    ...(weatherScenario ? { weatherScenario: weatherScenario as TravelPreferences["weatherScenario"] } : {}),
  };
}
