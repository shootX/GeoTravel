import { TravelPlan, TravelPreferences } from "../../../src/types";
import { findCityPlaces } from "../cms/placeRepository";
import { Place } from "../../types/place";
import { getAiPlannerConfig, resolveActiveModel } from "./config";
import { completeWithModel } from "./providers";
import { AiRouteSelection } from "./types";
import {
  buildPlanFromRoute,
  buildEmptyPlan,
  filterPlacesForRequest,
  normalizeCityName,
  resolveTotalMinutes,
} from "../routeEngine";

const ROUTE_THEMES = [
  "hidden gems and local favorites",
  "iconic landmarks with a twist",
  "photography and scenic viewpoints",
  "food and culture immersion",
  "off-the-beaten-path discovery",
  "relaxed pace with deep experiences",
  "adventurous and energetic exploration",
  "art, history, and architecture focus",
];

const LANDMARK_CATEGORIES = new Set(["history", "culture"]);
const EXPERIENCE_CATEGORIES = new Set(["food", "nature"]);

function pickTheme(): string {
  return ROUTE_THEMES[Math.floor(Math.random() * ROUTE_THEMES.length)];
}

function buildUserPrompt(
  request: TravelPreferences,
  candidates: Place[],
  totalMinutes: number,
  theme: string,
  sessionSeed: string
): string {
  const placesJson = candidates.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    lat: p.lat,
    lng: p.lng,
    visitMinutes: p.averageVisitDuration || p.avgVisitTime || 60,
    popularity: p.popularityScore,
    description: p.shortDescription || p.description,
    tags: p.tags?.slice(0, 5),
  }));

  return `Plan a unique travel route for session ${sessionSeed}.

City: ${request.city}
Time budget: ${totalMinutes} minutes total (visits + travel)
Transport: ${request.transport}
Interests: ${request.interests.join(", ")}
Creative theme for this route: ${theme}

Available places (you MUST only use IDs from this list):
${JSON.stringify(placesJson)}

Rules:
- Select 4 to 7 places in optimal visit order
- Total visit + estimated travel time must fit within ${totalMinutes} minutes
- Include at least one landmark (history/culture) and one experience (food/nature)
- Make this route DIFFERENT from a typical tourist path — surprise the traveler
- Vary your selection — avoid always picking the highest popularity scores

Return JSON exactly like:
{
  "placeIds": ["id1", "id2", ...],
  "title": "Creative route title",
  "routeSummary": "2-3 sentence summary of why this route is special",
  "theme": "${theme}"
}`;
}

function parseAiResponse(text: string): AiRouteSelection {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned) as AiRouteSelection;

  if (!Array.isArray(parsed.placeIds) || parsed.placeIds.length === 0) {
    throw new Error("AI response missing placeIds array");
  }

  return parsed;
}

function validateAndBuildRoute(
  selection: AiRouteSelection,
  candidates: Place[],
  totalMinutes: number,
  transport: TravelPreferences["transport"]
): Place[] {
  const byId = new Map(candidates.map((p) => [p.id, p]));
  const route: Place[] = [];

  for (const id of selection.placeIds) {
    const place = byId.get(id);
    if (place && !route.some((r) => r.id === place.id)) {
      route.push(place);
    }
  }

  if (route.length < 2) {
    throw new Error("AI selected too few valid places");
  }

  const hasLandmark = route.some((p) => LANDMARK_CATEGORIES.has(p.category));
  const hasExperience = route.some((p) => EXPERIENCE_CATEGORIES.has(p.category));
  if (!hasLandmark || !hasExperience) {
    throw new Error("AI route missing mandatory stop types");
  }

  return route;
}

export async function generateAiPlan(request: TravelPreferences): Promise<TravelPlan | null> {
  const config = await getAiPlannerConfig();
  if (!config.enabled) {
    return null;
  }

  const model = await resolveActiveModel(config);
  if (!model) {
    return null;
  }

  const city = normalizeCityName(request.city);
  const totalMinutes = resolveTotalMinutes(request.timeLimit);
  const candidates = filterPlacesForRequest(city, request.interests);

  if (candidates.length === 0) {
    return buildEmptyPlan(city, totalMinutes, request);
  }

  const theme = pickTheme();
  const sessionSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const systemPrompt =
    config.systemPrompt?.trim() ||
    "You are an expert travel route planner. Respond only with valid JSON.";

  const temperature = Math.min(1, Math.max(0.5, config.varietyBoost + (Math.random() * 0.15 - 0.05)));

  const result = await completeWithModel(model, {
    systemPrompt,
    userPrompt: buildUserPrompt(request, candidates, totalMinutes, theme, sessionSeed),
    temperature,
    maxTokens: model.maxTokens,
  });

  const selection = parseAiResponse(result.text);
  const route = validateAndBuildRoute(selection, candidates, totalMinutes, request.transport);

  const plan = buildPlanFromRoute(route, request, {
    title: selection.title,
    routeSummary: selection.routeSummary,
  });

  return {
    ...plan,
    ai: {
      provider: model.provider.name,
      model: model.displayName,
      modelId: model.modelId,
      theme: selection.theme || theme,
    },
  };
}
