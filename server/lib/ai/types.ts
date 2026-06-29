export type AiProviderSlug =
  | "google"
  | "openai"
  | "anthropic"
  | "mistral"
  | "deepseek"
  | "groq";

export interface AiCompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface AiCompletionResult {
  text: string;
  modelId: string;
  providerSlug: AiProviderSlug;
}

export interface AiRouteSelection {
  placeIds: string[];
  title?: string;
  routeSummary?: string;
  theme?: string;
}

export interface ResolvedAiModel {
  id: string;
  modelId: string;
  displayName: string;
  temperature: number;
  maxTokens: number;
  provider: {
    id: string;
    slug: AiProviderSlug;
    name: string;
    apiKey: string;
    baseUrl: string | null;
  };
}
