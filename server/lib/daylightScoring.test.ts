import assert from "node:assert/strict";
import { PLACES } from "../data/places";
import { getDaylightForPlan } from "./daylight";
import { computeArrivalMinutes, optimizeRouteForDaylight } from "./daylightOptimizer";
import {
  daylightCompatibilityScore,
  goldenHourScore,
  sunriseScore,
  sunsetScore,
} from "./daylightScoring";
import { parseBestVisitSlot, isSunsetViewpoint, isMorningOptimal } from "./placeKnowledge";
import { generatePlan } from "./routeEngine";

function findPlace(id: string) {
  const place = PLACES.find((p) => p.id === id);
  if (!place) throw new Error(`Place ${id} not found`);
  return place;
}

const daylight = getDaylightForPlan("Tbilisi");
const narikala = findPlace("tb-01");
const metekhi = findPlace("tb-02");

// ── Slot parsing ─────────────────────────────────────────────────────────────

assert.equal(parseBestVisitSlot(narikala), "sunset");
assert.equal(parseBestVisitSlot(metekhi), "morning");

// ── Scoring unit tests ──────────────────────────────────────────────────────

const morningMinutes = 10 * 60;
const sunsetMinutes = daylight.goldenHourEvening.startMinutes + 15;

assert.ok(sunriseScore(metekhi, morningMinutes, daylight) >= 0, "morning place ok in morning");
assert.ok(
  daylightCompatibilityScore(metekhi, sunsetMinutes, daylight) <
    daylightCompatibilityScore(metekhi, morningMinutes, daylight),
  "morning place scores better in morning than at sunset"
);

assert.ok(sunsetScore(narikala, sunsetMinutes, daylight) > 0, "sunset viewpoint scores high at evening");
assert.ok(sunsetScore(narikala, morningMinutes, daylight) < 0, "sunset viewpoint penalized in morning");

assert.ok(
  goldenHourScore(narikala, daylight.goldenHourEvening.startMinutes + 10, daylight) > 0,
  "golden hour bonus for sunset place"
);

assert.ok(
  daylightCompatibilityScore(narikala, sunsetMinutes, daylight) >
    daylightCompatibilityScore(narikala, morningMinutes, daylight),
  "sunset place better scheduled in evening"
);

// ── Reorder integration ─────────────────────────────────────────────────────

const plan = generatePlan({
  city: "Tbilisi",
  timeLimit: "6h",
  transport: "walk",
  interests: ["mixed"],
  weatherScenario: "clear",
});

assert.ok(plan.daylight?.sunrise, "plan includes daylight metadata");
assert.ok(plan.stops.length >= 4, "plan has stops");

const narikalaStop = plan.stops.find((s) => s.name === "Narikala Fortress");
if (narikalaStop) {
  const narikalaIndex = plan.stops.indexOf(narikalaStop);
  assert.ok(
    narikalaIndex >= plan.stops.length - 3,
    "Narikala moved toward end of route"
  );

  const [hours, mins] = narikalaStop.startTime.split(":").map(Number);
  const firstStop = plan.stops[0];
  const [fh, fm] = firstStop.startTime.split(":").map(Number);
  assert.ok(
    hours * 60 + mins > fh * 60 + fm,
    "sunset viewpoint scheduled later than route start"
  );
}

const morningStops = plan.stops.filter((s) => {
  const place = PLACES.find((p) => p.name === s.name);
  return place && isMorningOptimal(place);
});

for (const stop of morningStops) {
  const [h, m] = stop.startTime.split(":").map(Number);
  const mins = h * 60 + m;
  const eveningStops = plan.stops.filter((s) => {
    const p = PLACES.find((pl) => pl.name === s.name);
    return p && isSunsetViewpoint(p);
  });
  for (const ev of eveningStops) {
    const [eh, em] = ev.startTime.split(":").map(Number);
    assert.ok(mins <= eh * 60 + em, "morning stops precede sunset viewpoints");
  }
}

// ── Optimizer preserves budget ────────────────────────────────────────────────

const sampleRoute = [
  findPlace("tb-01"),
  findPlace("tb-02"),
  findPlace("tb-03"),
  findPlace("tb-10"),
];
const optimized = optimizeRouteForDaylight(sampleRoute, 360, "walk", daylight);
const arrivals = computeArrivalMinutes(optimized, "walk");

assert.equal(optimized.length, sampleRoute.length, "reorder keeps all stops");
assert.ok(arrivals.length === optimized.length, "arrival times computed");

console.log("daylightScoring.test.ts — all assertions passed");
