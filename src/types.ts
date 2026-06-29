export interface TravelPreferences {
  city: string;
  timeLimit: string; // '2h' | '4h' | '6h' | '1day'
  transport: 'walk' | 'car' | 'mixed';
  interests: string[]; // e.g., ['history', 'nature', 'food', 'mixed']
}

export interface MapPin {
  id: string;
  name: string;
  lat: number;
  lng: number;
  label: string; // "1", "2", "3" etc.
  timeSpent: string;
  description: string;
}

export interface ItineraryItem {
  time: string; // e.g. "10:00"
  placeName: string;
  description: string;
  timeSpent: string; // e.g. "1.5h" or "45m"
  activityType: string; // e.g. "history" | "nature" | "food" | "general"
  tips?: string;
}

export interface GeneratedPlan {
  city: string;
  timeLimit: string;
  transport: string;
  interests: string[];
  title: string;
  description: string;
  pins: MapPin[];
  itinerary: ItineraryItem[];
  center: [number, number]; // [lat, lng] for centering the map
}
