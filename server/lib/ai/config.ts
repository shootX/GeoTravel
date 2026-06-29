import { prisma } from "../db";
import { getCatalogProvider } from "./catalog";
import { ResolvedAiModel } from "./types";

export interface AiPlannerConfig {
  enabled: boolean;
  fallbackToGreedy: boolean;
  rotateModels: boolean;
  systemPrompt: string | null;
  varietyBoost: number;
  preferredModelId: string | null;
}

const DEFAULT_SYSTEM_PROMPT = `You are an expert travel route planner. Create unique, varied day routes that feel fresh every time.
Prioritize geographic efficiency, category diversity, and the user's interests.
Include at least one landmark (history/culture) and one experience stop (food/nature).
Avoid repeating the same category back-to-back when possible.
Respond ONLY with valid JSON — no markdown fences.`;

export async function ensureAiPlannerSettings(): Promise<void> {
  await prisma.aiPlannerSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      enabled: true,
      fallbackToGreedy: true,
      rotateModels: true,
      varietyBoost: 0.9,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    },
  });
}

export async function getAiPlannerConfig(): Promise<AiPlannerConfig> {
  const row = await prisma.aiPlannerSettings.findUnique({ where: { id: "default" } });
  if (!row) {
    return {
      enabled: true,
      fallbackToGreedy: true,
      rotateModels: true,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      varietyBoost: 0.9,
      preferredModelId: null,
    };
  }
  return {
    enabled: row.enabled,
    fallbackToGreedy: row.fallbackToGreedy,
    rotateModels: row.rotateModels,
    systemPrompt: row.systemPrompt,
    varietyBoost: row.varietyBoost,
    preferredModelId: row.preferredModelId,
  };
}

function resolveApiKey(providerSlug: string, storedKey: string | null): string | null {
  if (storedKey?.trim()) {
    return storedKey.trim();
  }
  const catalog = getCatalogProvider(providerSlug);
  if (!catalog) {
    return null;
  }
  return process.env[catalog.envKey]?.trim() || null;
}

export async function resolveActiveModel(config: AiPlannerConfig): Promise<ResolvedAiModel | null> {
  const models = await prisma.aiModel.findMany({
    where: { isActive: true, provider: { isActive: true } },
    include: { provider: true },
    orderBy: [{ provider: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  const ready = models
    .map((m) => {
      const apiKey = resolveApiKey(m.provider.slug, m.provider.apiKey);
      if (!apiKey) {
        return null;
      }
      return {
        id: m.id,
        modelId: m.modelId,
        displayName: m.displayName,
        temperature: m.temperature,
        maxTokens: m.maxTokens,
        provider: {
          id: m.provider.id,
          slug: m.provider.slug as ResolvedAiModel["provider"]["slug"],
          name: m.provider.name,
          apiKey,
          baseUrl: m.provider.baseUrl,
        },
      } satisfies ResolvedAiModel;
    })
    .filter((m): m is ResolvedAiModel => m !== null);

  if (ready.length === 0) {
    return null;
  }

  if (config.preferredModelId) {
    const preferred = ready.find((m) => m.id === config.preferredModelId);
    if (preferred) {
      return preferred;
    }
  }

  if (config.rotateModels && ready.length > 1) {
    return ready[Math.floor(Math.random() * ready.length)];
  }

  const defaultModel = ready.find((m) => {
    const row = models.find((r) => r.id === m.id);
    return row?.isDefault;
  });
  return defaultModel ?? ready[0];
}

export function maskApiKey(key: string | null | undefined): string {
  if (!key?.trim()) {
    return "";
  }
  if (key.length <= 8) {
    return "••••••••";
  }
  return `••••${key.slice(-4)}`;
}
