import { PlanStop } from "../types";

/**
 * Resolves Story Mode narrative text from a plan stop.
 * Prefers fullDescription when the route engine attached it.
 */
export function resolveStoryText(stop: PlanStop): string {
  return stop.fullDescription?.trim() || stop.description;
}

export function resolveStoryTips(stop: PlanStop): string | undefined {
  return stop.localTips?.trim() || undefined;
}
