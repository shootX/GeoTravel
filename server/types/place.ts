/**
 * Place Knowledge Engine — core domain types.
 *
 * Legacy fields (`description`, `avgVisitTime`) remain for backward compatibility.
 * New code should prefer `shortDescription`, `fullDescription`, and `averageVisitDuration`.
 */

export type PlaceCategory = "history" | "nature" | "food" | "viewpoint" | "culture";

export type AccessibilityLevel =
  | "full"
  | "partial"
  | "limited"
  | "not-accessible";

export type AccessibilityLabel = string;

export interface Place {
  id: string;
  name: string;
  city: string;
  country: string;
  category: PlaceCategory;

  /** Legacy one-liner — mirrors shortDescription. */
  description: string;
  shortDescription: string;
  fullDescription: string;
  localTips: string;

  /** Legacy visit duration in minutes — mirrors averageVisitDuration. */
  avgVisitTime: number;
  averageVisitDuration: number;
  bestVisitTime: string;
  openingHours: string;
  ticketPrice: string;

  indoor: boolean;
  outdoor: boolean;
  rainFriendly: boolean;

  photoScore: number;
  popularityScore: number;
  experienceScore: number;

  familyFriendly: boolean;
  accessibility: AccessibilityLabel;

  lat: number;
  lng: number;
  tags: string[];
}

export type TransportMode = "walk" | "car" | "mixed";

export type PlaceDefinitionInput = {
  id: string;
  name: string;
  city: string;
  category: PlaceCategory;
  lat: number;
  lng: number;
  popularityScore: number;
  description?: string;
  shortDescription?: string;
  fullDescription?: string;
  localTips?: string;
  avgVisitTime?: number;
  averageVisitDuration?: number;
  bestVisitTime?: string;
  openingHours?: string;
  ticketPrice?: string;
  indoor?: boolean;
  outdoor?: boolean;
  rainFriendly?: boolean;
  photoScore?: number;
  experienceScore?: number;
  familyFriendly?: boolean;
  accessibility?: AccessibilityLevel | AccessibilityLabel;
  country?: string;
  tags?: string[];
};
