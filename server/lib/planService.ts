import { TravelPlan, TravelPreferences } from "../../src/types";
import { generateAiPlan } from "./ai/routePlanner";
import { getAiPlannerConfig } from "./ai/config";
import { generatePlan } from "./routeEngine";

export async function generatePlanAsync(request: TravelPreferences): Promise<TravelPlan> {
  const config = await getAiPlannerConfig();

  if (config.enabled) {
    try {
      const aiPlan = await generateAiPlan(request);
      if (aiPlan) {
        return aiPlan;
      }
    } catch (err) {
      console.warn("AI route planning failed:", err instanceof Error ? err.message : err);
      if (!config.fallbackToGreedy) {
        throw err;
      }
    }
  }

  return generatePlan(request);
}
