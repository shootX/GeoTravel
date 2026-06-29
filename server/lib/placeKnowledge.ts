import {
  AccessibilityLabel,
  AccessibilityLevel,
  Place,
  PlaceDefinitionInput,
} from "../types/place";

/** Default metadata applied by {@link definePlace} when fields are omitted. */
export const PLACE_KNOWLEDGE_DEFAULTS: Omit<
  Place,
  "id" | "name" | "city" | "category" | "lat" | "lng" | "popularityScore"
> = {
  country: "",
  description: "",
  shortDescription: "",
  fullDescription: "",
  localTips: "Arrive early to avoid crowds.",
  avgVisitTime: 60,
  averageVisitDuration: 60,
  bestVisitTime: "Morning",
  openingHours: "09:00–18:00",
  ticketPrice: "Free",
  indoor: false,
  outdoor: true,
  rainFriendly: true,
  photoScore: 7,
  experienceScore: 7,
  familyFriendly: true,
  accessibility: "Partial — check local conditions",
  tags: [],
};

const CITY_COUNTRY: Record<string, string> = {
  Tbilisi: "Georgia",
  Paris: "France",
  Rome: "Italy",
  Tokyo: "Japan",
  "New York": "United States",
};

const ACCESSIBILITY_LABELS: Record<AccessibilityLevel, AccessibilityLabel> = {
  full: "Full wheelchair access",
  partial: "Partial access — some stairs or uneven paths",
  limited: "Limited access — steep terrain or many stairs",
  "not-accessible": "Not wheelchair accessible",
};

function resolveAccessibility(value: AccessibilityLevel | AccessibilityLabel | undefined): AccessibilityLabel {
  if (!value) {
    return PLACE_KNOWLEDGE_DEFAULTS.accessibility;
  }
  if (value in ACCESSIBILITY_LABELS) {
    return ACCESSIBILITY_LABELS[value as AccessibilityLevel];
  }
  return value;
}

/** Builds a fully-typed Place with defaults and legacy field sync. */
export function definePlace(input: PlaceDefinitionInput): Place {
  const shortDescription =
    input.shortDescription?.trim() ||
    input.description?.trim() ||
    PLACE_KNOWLEDGE_DEFAULTS.shortDescription;

  const fullDescription = input.fullDescription?.trim() || shortDescription;

  const averageVisitDuration =
    input.averageVisitDuration ?? input.avgVisitTime ?? PLACE_KNOWLEDGE_DEFAULTS.averageVisitDuration;

  const avgVisitTime = input.avgVisitTime ?? averageVisitDuration;

  return {
    ...PLACE_KNOWLEDGE_DEFAULTS,
    ...input,
    country: input.country ?? CITY_COUNTRY[input.city] ?? input.city,
    description: input.description?.trim() || shortDescription,
    shortDescription,
    fullDescription,
    localTips: input.localTips?.trim() || PLACE_KNOWLEDGE_DEFAULTS.localTips,
    avgVisitTime,
    averageVisitDuration,
    bestVisitTime: input.bestVisitTime ?? PLACE_KNOWLEDGE_DEFAULTS.bestVisitTime,
    openingHours: input.openingHours ?? PLACE_KNOWLEDGE_DEFAULTS.openingHours,
    ticketPrice: input.ticketPrice ?? PLACE_KNOWLEDGE_DEFAULTS.ticketPrice,
    indoor: input.indoor ?? PLACE_KNOWLEDGE_DEFAULTS.indoor,
    outdoor: input.outdoor ?? PLACE_KNOWLEDGE_DEFAULTS.outdoor,
    rainFriendly: input.rainFriendly ?? PLACE_KNOWLEDGE_DEFAULTS.rainFriendly,
    photoScore: input.photoScore ?? PLACE_KNOWLEDGE_DEFAULTS.photoScore,
    experienceScore: input.experienceScore ?? PLACE_KNOWLEDGE_DEFAULTS.experienceScore,
    familyFriendly: input.familyFriendly ?? PLACE_KNOWLEDGE_DEFAULTS.familyFriendly,
    accessibility: resolveAccessibility(input.accessibility),
    tags: input.tags ?? [],
  };
}

export function getVisitDuration(place: Place): number {
  return place.averageVisitDuration ?? place.avgVisitTime;
}

export function getShortDescription(place: Place): string {
  return place.shortDescription || place.description;
}

/** Story Mode narrative — prefers fullDescription, falls back safely. */
export function getStoryDescription(place: Place): string {
  return place.fullDescription || place.shortDescription || place.description;
}

/** Plan stop summary — preserves existing short UI copy. */
export function getPlanStopDescription(place: Place): string {
  return getShortDescription(place);
}

export function getStoryLocalTips(place: Place): string {
  return place.localTips || PLACE_KNOWLEDGE_DEFAULTS.localTips;
}

export function isOutdoorOnly(place: Place): boolean {
  return place.outdoor && !place.indoor;
}

export function isIndoorPlace(place: Place): boolean {
  return place.indoor;
}

export function isCoveredDining(place: Place): boolean {
  return place.category === "food" && (place.indoor || place.rainFriendly);
}

export function isExposedViewpoint(place: Place): boolean {
  return place.category === "viewpoint" && isOutdoorOnly(place);
}

export type VisitTimeSlot = "sunrise" | "morning" | "afternoon" | "evening" | "sunset" | "flexible";

const SLOT_WINDOWS: Record<Exclude<VisitTimeSlot, "flexible">, { start: number; end: number }> = {
  sunrise: { start: 6 * 60, end: 9 * 60 },
  morning: { start: 9 * 60, end: 12 * 60 },
  afternoon: { start: 12 * 60, end: 17 * 60 },
  evening: { start: 17 * 60, end: 20 * 60 + 30 },
  sunset: { start: 17 * 60, end: 20 * 60 + 30 },
};

/** Maps free-text bestVisitTime to a preferred time slot. */
export function parseBestVisitSlot(place: Place): VisitTimeSlot {
  const raw = place.bestVisitTime.toLowerCase();
  const tagSet = new Set(place.tags.map((t) => t.toLowerCase()));

  if (raw.includes("sunrise") || raw.includes("early morning") || tagSet.has("sunrise")) {
    return "sunrise";
  }
  if (raw.includes("sunset") || tagSet.has("sunset")) {
    return "sunset";
  }
  if (raw.includes("evening") || raw.includes("night") || tagSet.has("night")) {
    return "evening";
  }
  if (raw.includes("morning") || raw.includes("early")) {
    return "morning";
  }
  if (raw.includes("afternoon") || raw.includes("lunch")) {
    return "afternoon";
  }
  if (place.category === "viewpoint" && (raw.includes("late afternoon") || raw.includes("golden"))) {
    return "sunset";
  }
  return "flexible";
}

export function getPreferredWindowForSlot(slot: VisitTimeSlot): { start: number; end: number } | null {
  if (slot === "flexible") {
    return null;
  }
  return SLOT_WINDOWS[slot];
}

export function isSunriseOptimal(place: Place): boolean {
  return parseBestVisitSlot(place) === "sunrise";
}

export function isSunsetViewpoint(place: Place): boolean {
  const slot = parseBestVisitSlot(place);
  return place.category === "viewpoint" && (slot === "sunset" || slot === "evening");
}

export function isMorningOptimal(place: Place): boolean {
  const slot = parseBestVisitSlot(place);
  return slot === "sunrise" || slot === "morning";
}

export function isEveningOptimal(place: Place): boolean {
  const slot = parseBestVisitSlot(place);
  return slot === "sunset" || slot === "evening";
}
