import { apiFetch } from "../lib/api";

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return apiFetch(`/api/admin${path}`, init);
}

export interface AdminStats {
  places: number;
  categories: number;
  countries: number;
  translations: number;
  hiddenGems: number;
  templates: number;
  packages: number;
}

export interface AdminCountry {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminPlace {
  id: string;
  name: string;
  city: string;
  countryId: string;
  categoryId: string;
  lat: number;
  lng: number;
  shortDescription: string;
  fullDescription: string;
  localTips: string;
  bestVisitTime: string;
  popularityScore: number;
  photoScore: number;
  isPublished: boolean;
  tags: string;
  country?: AdminCountry;
  category?: AdminCategory;
}

export interface AdminTranslation {
  id: string;
  placeId: string;
  locale: string;
  name?: string | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  localTips?: string | null;
  storyContent?: string | null;
}

export interface AdminHiddenGem {
  id: string;
  placeId: string;
  hiddenGemScore: number;
  touristScore: number;
  localFavoriteScore: number;
  isHiddenGem: boolean;
  editorNotes?: string | null;
  place?: AdminPlace;
}

export interface AdminRouteTemplate {
  id: string;
  name: string;
  slug: string;
  city: string;
  description?: string | null;
  transport: string;
  timeLimit: string;
  interests: string[];
  stopPlaceIds: string[];
  isPublished: boolean;
}

export interface AdminPackage {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  city?: string | null;
  countryId?: string | null;
  price?: number | null;
  currency: string;
  durationDays: number;
  routeTemplateIds: string[];
  highlights: string[];
  isPublished: boolean;
  sortOrder: number;
}
