import { Place } from "../types/place";
import {
  isCoveredDining,
  isExposedViewpoint,
  isIndoorPlace,
  isOutdoorOnly,
} from "./placeKnowledge";
import { WeatherSnapshot } from "./weather";

/**
 * Weather compatibility bonus/penalty for route scoring.
 * Returns 0 when weather does not affect routing (dry conditions).
 */
export function weatherCompatibilityBonus(place: Place, weather: WeatherSnapshot): number {
  if (!weather.isRaining) {
    return 0;
  }

  let bonus = 0;

  if (isIndoorPlace(place)) {
    bonus += weather.isHeavyRain ? 6 : 5;
  }

  if (isOutdoorOnly(place)) {
    bonus -= weather.isHeavyRain ? 8 : 4;
  } else if (place.rainFriendly && !place.indoor) {
    bonus += weather.isHeavyRain ? 2 : 3;
  }

  if (isExposedViewpoint(place)) {
    bonus -= weather.isHeavyRain ? 12 : 5;
  }

  if (place.category === "food") {
    if (isCoveredDining(place)) {
      bonus += weather.isHeavyRain ? 5 : 4;
    } else if (isOutdoorOnly(place) && !place.rainFriendly) {
      bonus -= weather.isHeavyRain ? 6 : 4;
    }
  }

  return bonus;
}
