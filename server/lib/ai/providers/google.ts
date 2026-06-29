import { GoogleGenAI } from "@google/genai";
import { AiCompletionRequest, AiCompletionResult, ResolvedAiModel } from "../types";

export async function completeWithGoogle(
  model: ResolvedAiModel,
  request: AiCompletionRequest
): Promise<AiCompletionResult> {
  const ai = new GoogleGenAI({ apiKey: model.provider.apiKey });
  const response = await ai.models.generateContent({
    model: model.modelId,
    contents: request.userPrompt,
    config: {
      systemInstruction: request.systemPrompt,
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens,
      responseMimeType: "application/json",
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Empty response from Google Gemini");
  }

  return { text, modelId: model.modelId, providerSlug: "google" };
}
