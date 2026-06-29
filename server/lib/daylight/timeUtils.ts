/** Parse "HH:MM" into minutes from midnight. */
export function parseClockToMinutes(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

/** Format minutes from midnight as "HH:MM". */
export function formatMinutesToClock(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function minutesInWindow(value: number, start: number, end: number): boolean {
  return value >= start && value <= end;
}
