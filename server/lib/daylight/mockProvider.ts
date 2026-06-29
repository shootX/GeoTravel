import { DaylightProvider, DaylightSnapshot, GoldenHourWindow } from "./types";
import { parseClockToMinutes } from "./timeUtils";

interface CitySunPreset {
  sunrise: string;
  sunset: string;
}

const CITY_SUN_PRESETS: Record<string, CitySunPreset> = {
  Tbilisi: { sunrise: "06:30", sunset: "20:15" },
  Paris: { sunrise: "06:45", sunset: "21:00" },
  Rome: { sunrise: "06:15", sunset: "20:30" },
  Tokyo: { sunrise: "05:45", sunset: "18:45" },
  "New York": { sunrise: "06:00", sunset: "19:45" },
};

const DEFAULT_PRESET: CitySunPreset = { sunrise: "06:30", sunset: "19:30" };

function buildGoldenHourMorning(sunriseMinutes: number): GoldenHourWindow {
  const startMinutes = sunriseMinutes;
  const endMinutes = sunriseMinutes + 90;
  return {
    start: formatClock(startMinutes),
    end: formatClock(endMinutes),
    startMinutes,
    endMinutes,
  };
}

function buildGoldenHourEvening(sunsetMinutes: number): GoldenHourWindow {
  const startMinutes = sunsetMinutes - 60;
  const endMinutes = sunsetMinutes;
  return {
    start: formatClock(startMinutes),
    end: formatClock(sunsetMinutes),
    startMinutes,
    endMinutes,
  };
}

function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function resolvePreset(city: string): CitySunPreset {
  const match = Object.entries(CITY_SUN_PRESETS).find(
    ([name]) => name.toLowerCase() === city.trim().toLowerCase()
  );
  return match?.[1] ?? DEFAULT_PRESET;
}

export class MockDaylightProvider implements DaylightProvider {
  getDaylight(city: string): DaylightSnapshot {
    const preset = resolvePreset(city);
    const sunriseMinutes = parseClockToMinutes(preset.sunrise);
    const sunsetMinutes = parseClockToMinutes(preset.sunset);
    const goldenHourMorning = buildGoldenHourMorning(sunriseMinutes);
    const goldenHourEvening = buildGoldenHourEvening(sunsetMinutes);

    return {
      city,
      sunrise: preset.sunrise,
      sunset: preset.sunset,
      sunriseMinutes,
      sunsetMinutes,
      goldenHourMorning,
      goldenHourEvening,
      summary: `Sunrise ${preset.sunrise}, sunset ${preset.sunset} — viewpoints timed for golden hour.`,
      simulated: true,
    };
  }
}
