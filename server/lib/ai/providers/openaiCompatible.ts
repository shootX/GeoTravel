import { AiCompletionRequest, AiCompletionResult, ResolvedAiModel } from "../types";

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string>
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

export async function completeOpenAiCompatible(
  model: ResolvedAiModel,
  request: AiCompletionRequest,
  defaultBaseUrl: string
): Promise<AiCompletionResult> {
  const baseUrl = (model.provider.baseUrl || defaultBaseUrl).replace(/\/$/, "");
  const response = await postJson(
    `${baseUrl}/chat/completions`,
    {
      model: model.modelId,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
    },
    { Authorization: `Bearer ${model.provider.apiKey}` }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI-compatible API error (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Empty response from OpenAI-compatible API");
  }

  return { text, modelId: model.modelId, providerSlug: model.provider.slug };
}

export async function completeAnthropic(
  model: ResolvedAiModel,
  request: AiCompletionRequest,
  defaultBaseUrl: string
): Promise<AiCompletionResult> {
  const baseUrl = (model.provider.baseUrl || defaultBaseUrl).replace(/\/$/, "");
  const usesAdaptiveThinking = /claude-(opus|sonnet|fable|mythos)-4-\d/.test(model.modelId);

  const body: Record<string, unknown> = {
    model: model.modelId,
    max_tokens: request.maxTokens,
    temperature: request.temperature,
    system: `${request.systemPrompt}\nRespond ONLY with valid JSON.`,
    messages: [{ role: "user", content: request.userPrompt }],
  };

  if (usesAdaptiveThinking) {
    body.thinking = { type: "adaptive" };
    body.output_config = { effort: "medium" };
  }

  const response = await postJson(`${baseUrl}/messages`, body, {
    "x-api-key": model.provider.apiKey,
    "anthropic-version": "2023-06-01",
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text?.trim();
  if (!text) {
    throw new Error("Empty response from Anthropic");
  }

  return { text, modelId: model.modelId, providerSlug: "anthropic" };
}
