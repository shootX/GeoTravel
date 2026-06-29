import assert from "node:assert/strict";
import { PLACES } from "../data/places";
import { definePlace } from "./placeKnowledge";
import { getWeatherForPlan } from "./weather";
import { weatherCompatibilityBonus } from "./weatherScoring";
import { generatePlan } from "./routeEngine";

function findPlace(id: string) {
  const place = PLACES.find((p) => p.id === id);
  if (!place) throw new Error(`Place ${id} not found`);
  return place;
}

// ── Scoring unit tests ──────────────────────────────────────────────────────

const clear = getWeatherForPlan("Rome", "clear");
const lightRain = getWeatherForPlan("Tbilisi", "light-rain");
const heavyRain = getWeatherForPlan("New York", "heavy-rain");

const narikala = findPlace("tb-01"); // outdoor viewpoint, not rain-friendly
const dezerter = findPlace("tb-09"); // open-air market

assert.equal(weatherCompatibilityBonus(narikala, clear), 0, "clear weather is neutral");

assert.ok(
  weatherCompatibilityBonus(narikala, lightRain) < 0,
  "outdoor viewpoint penalized in light rain"
);

assert.ok(
  weatherCompatibilityBonus(narikala, heavyRain) < weatherCompatibilityBonus(narikala, lightRain),
  "viewpoint penalty increases in heavy rain"
);

const indoorFood = PLACES.find((p) => p.category === "food" && p.indoor && p.rainFriendly);
assert.ok(indoorFood, "fixture: indoor food place");
assert.ok(
  weatherCompatibilityBonus(indoorFood!, lightRain) > 0,
  "covered/indoor dining boosted in rain"
);

assert.ok(
  weatherCompatibilityBonus(dezerter, lightRain) < 0,
  "open-air market penalized in rain"
);

const indoorMuseum = definePlace({
  id: "test-indoor",
  name: "Test Museum",
  city: "Tbilisi",
  category: "culture",
  lat: 41.7,
  lng: 44.8,
  popularityScore: 8,
  indoor: true,
  outdoor: false,
  rainFriendly: true,
});

assert.ok(
  weatherCompatibilityBonus(indoorMuseum, heavyRain) > 0,
  "indoor attraction boosted in heavy rain"
);

// ── Integration: route prefers indoor stops in rain ─────────────────────────

const rainyPlan = generatePlan({
  city: "Tbilisi",
  timeLimit: "4h",
  transport: "walk",
  interests: ["mixed"],
  weatherScenario: "heavy-rain",
});

const outdoorOnlyStops = rainyPlan.stops.filter((stop) => {
  const place = PLACES.find((p) => p.name === stop.name);
  return place && place.outdoor && !place.indoor;
});

const clearPlan = generatePlan({
  city: "Tbilisi",
  timeLimit: "4h",
  transport: "walk",
  interests: ["mixed"],
  weatherScenario: "clear",
});

const outdoorClear = clearPlan.stops.filter((stop) => {
  const place = PLACES.find((p) => p.name === stop.name);
  return place && place.outdoor && !place.indoor;
});

assert.ok(
  outdoorOnlyStops.length <= outdoorClear.length,
  "heavy-rain route has fewer outdoor-only stops than clear weather"
);

assert.equal(rainyPlan.weather?.condition, "heavy-rain");
assert.ok(rainyPlan.routeSummary.includes("Heavy rain"), "route summary mentions rain");

assert.ok(
  !rainyPlan.stops.some((s) => s.name === "Narikala Fortress"),
  "Narikala (exposed viewpoint) avoided in heavy rain"
);

console.log("weatherScoring.test.ts — all assertions passed");
