import { AiProviderSlug } from "./types";

export interface CatalogProvider {
  slug: AiProviderSlug;
  name: string;
  sortOrder: number;
  defaultBaseUrl?: string;
  envKey: string;
  models: Array<{
    modelId: string;
    displayName: string;
    sortOrder: number;
    isDefault?: boolean;
  }>;
}

export const AI_PROVIDER_CATALOG: CatalogProvider[] = [
  {
    slug: "google",
    name: "Google Gemini",
    sortOrder: 1,
    envKey: "GEMINI_API_KEY",
    models: [
      { modelId: "gemini-3.1-pro-preview", displayName: "Gemini 3.1 Pro", sortOrder: 1, isDefault: true },
      { modelId: "gemini-3.1-flash-lite", displayName: "Gemini 3.1 Flash Lite", sortOrder: 2 },
      { modelId: "gemini-3.5-flash-preview", displayName: "Gemini 3.5 Flash", sortOrder: 3 },
      { modelId: "gemini-2.5-pro", displayName: "Gemini 2.5 Pro", sortOrder: 4 },
      { modelId: "gemini-2.5-flash", displayName: "Gemini 2.5 Flash", sortOrder: 5 },
    ],
  },
  {
    slug: "openai",
    name: "OpenAI",
    sortOrder: 2,
    defaultBaseUrl: "https://api.openai.com/v1",
    envKey: "OPENAI_API_KEY",
    models: [
      { modelId: "gpt-5.5", displayName: "GPT-5.5", sortOrder: 1, isDefault: true },
      { modelId: "gpt-5.5-pro", displayName: "GPT-5.5 Pro", sortOrder: 2 },
      { modelId: "gpt-4.1", displayName: "GPT-4.1", sortOrder: 3 },
      { modelId: "gpt-4.1-mini", displayName: "GPT-4.1 Mini", sortOrder: 4 },
      { modelId: "o3-mini", displayName: "o3-mini", sortOrder: 5 },
    ],
  },
  {
    slug: "anthropic",
    name: "Anthropic",
    sortOrder: 3,
    defaultBaseUrl: "https://api.anthropic.com/v1",
    envKey: "ANTHROPIC_API_KEY",
    models: [
      { modelId: "claude-opus-4-8", displayName: "Claude Opus 4.8", sortOrder: 1, isDefault: true },
      { modelId: "claude-opus-4-7", displayName: "Claude Opus 4.7", sortOrder: 2 },
      { modelId: "claude-sonnet-4-6", displayName: "Claude Sonnet 4.6", sortOrder: 3 },
      { modelId: "claude-opus-4-6", displayName: "Claude Opus 4.6", sortOrder: 4 },
      { modelId: "claude-3-5-haiku-latest", displayName: "Claude 3.5 Haiku", sortOrder: 5 },
    ],
  },
  {
    slug: "mistral",
    name: "Mistral AI",
    sortOrder: 4,
    defaultBaseUrl: "https://api.mistral.ai/v1",
    envKey: "MISTRAL_API_KEY",
    models: [
      { modelId: "mistral-large-latest", displayName: "Mistral Large", sortOrder: 1, isDefault: true },
      { modelId: "mistral-small-latest", displayName: "Mistral Small", sortOrder: 2 },
    ],
  },
  {
    slug: "deepseek",
    name: "DeepSeek",
    sortOrder: 5,
    defaultBaseUrl: "https://api.deepseek.com/v1",
    envKey: "DEEPSEEK_API_KEY",
    models: [
      { modelId: "deepseek-chat", displayName: "DeepSeek Chat", sortOrder: 1, isDefault: true },
      { modelId: "deepseek-reasoner", displayName: "DeepSeek Reasoner", sortOrder: 2 },
    ],
  },
  {
    slug: "groq",
    name: "Groq",
    sortOrder: 6,
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    envKey: "GROQ_API_KEY",
    models: [
      { modelId: "llama-3.3-70b-versatile", displayName: "Llama 3.3 70B", sortOrder: 1, isDefault: true },
      { modelId: "llama-3.1-8b-instant", displayName: "Llama 3.1 8B Instant", sortOrder: 2 },
    ],
  },
];

export function getCatalogProvider(slug: string): CatalogProvider | undefined {
  return AI_PROVIDER_CATALOG.find((p) => p.slug === slug);
}
