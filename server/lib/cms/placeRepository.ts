import { Category, Country, HiddenGemProfile, Place as DbPlace, PlaceTranslation } from "@prisma/client";
import { PLACES } from "../../data/places";
import { Place, PlaceCategory } from "../../types/place";

type DbPlaceWithRelations = DbPlace & {
  country: Country;
  category: Category;
  hiddenGem: HiddenGemProfile | null;
  translations: PlaceTranslation[];
};

let placesCache: Place[] | null = null;

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function dbPlaceToDomain(row: DbPlaceWithRelations): Place {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    country: row.country.name,
    category: row.category.slug as PlaceCategory,
    description: row.description || row.shortDescription,
    shortDescription: row.shortDescription,
    fullDescription: row.fullDescription,
    localTips: row.localTips,
    avgVisitTime: row.avgVisitTime,
    averageVisitDuration: row.averageVisitDuration,
    bestVisitTime: row.bestVisitTime,
    openingHours: row.openingHours,
    ticketPrice: row.ticketPrice,
    indoor: row.indoor,
    outdoor: row.outdoor,
    rainFriendly: row.rainFriendly,
    photoScore: row.photoScore,
    popularityScore: row.popularityScore,
    experienceScore: row.experienceScore,
    familyFriendly: row.familyFriendly,
    accessibility: row.accessibility,
    lat: row.lat,
    lng: row.lng,
    tags: parseTags(row.tags),
  };
}

export function getPlacesSource(): Place[] {
  return placesCache ?? PLACES;
}

export function findCityPlaces(city: string): Place[] {
  const normalized = city.trim().toLowerCase();
  return getPlacesSource().filter((p) => p.city.toLowerCase() === normalized);
}

export function findPlaceById(id: string): Place | undefined {
  return getPlacesSource().find((p) => p.id === id);
}

export function setPlacesCache(places: Place[]): void {
  placesCache = places;
}

export function clearPlacesCache(): void {
  placesCache = null;
}
