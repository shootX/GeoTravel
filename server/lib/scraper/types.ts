export type ScraperField = "name" | "description" | "category" | "location" | "photo";

export interface ScrapedPlace {
  id: string;
  tripadvisorId: string;
  name: string;
  description: string;
  category: string;
  location: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  ranking: string | null;
  sourceUrl: string;
}

export interface ScraperListResult {
  pageType: "listing" | "detail";
  sourceUrl: string;
  pageTitle: string | null;
  items: ScrapedPlace[];
}
