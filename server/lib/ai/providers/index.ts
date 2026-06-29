import { getCatalogProvider } from "../catalog";
import { AiCompletionRequest, AiCompletionResult, ResolvedAiModel } from "../types";
import { completeWithGoogle } from "./google";
import { completeAnthropic, completeOpenAiCompatible } from "./openaiCompatible";

export async function completeWithModel(
  model: ResolvedAiModel,
  request: AiCompletionRequest
): Promise<AiCompletionResult> {
  const catalog = getCatalogProvider(model.provider.slug);
  if (!catalog) {
    throw new Error(`Unknown provider: ${model.provider.slug}`);
  }

  switch (model.provider.slug) {
    case "google":
      return completeWithGoogle(model, request);
    case "anthropic":
      return completeAnthropic(model, request, catalog.defaultBaseUrl ?? "");
    case "openai":
    case "mistral":
    case "deepseek":
    case "groq":
      return completeOpenAiCompatible(model, request, catalog.defaultBaseUrl ?? "");
    default:
      throw new Error(`Unsupported provider: ${model.provider.slug}`);
  }
}
