import OpenAI from "openai";

import {
  INVALID_PROVIDER_OUTPUT_CODE,
  PROVIDER_UNAVAILABLE_CODE,
  RoastDomainError,
} from "../contracts";

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

type OpenAIEnvironment = Record<string, string | undefined>;

type OpenAIProviderInput = {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
};

type OpenAIProviderClient = Pick<OpenAI, "chat">;

export function resolveOpenAIModel(env: OpenAIEnvironment = process.env) {
  const model = env.OPENAI_MODEL?.trim();
  return model && model.length > 0 ? model : DEFAULT_OPENAI_MODEL;
}

function resolveOpenAIApiKey(env: OpenAIEnvironment = process.env) {
  const apiKey = env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new RoastDomainError(
      PROVIDER_UNAVAILABLE_CODE,
      "Missing OpenAI API key configuration.",
    );
  }

  return apiKey;
}

function createClient(
  env: OpenAIEnvironment = process.env,
): OpenAIProviderClient {
  return new OpenAI({
    apiKey: resolveOpenAIApiKey(env),
    timeout: 20_000,
  });
}

export async function runOpenAIProvider(
  { systemPrompt, userPrompt, model }: OpenAIProviderInput,
  options: { client?: OpenAIProviderClient; env?: OpenAIEnvironment } = {},
) {
  const client = options.client ?? createClient(options.env);

  const completion = await client.chat.completions.create({
    model: model ?? resolveOpenAIModel(options.env),
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    response_format: { type: "json_object" },
  });

  const payload = completion.choices[0]?.message?.content;

  if (!payload) {
    throw new RoastDomainError(
      INVALID_PROVIDER_OUTPUT_CODE,
      "OpenAI returned an empty response payload.",
    );
  }

  try {
    return JSON.parse(payload);
  } catch (error) {
    throw new RoastDomainError(
      INVALID_PROVIDER_OUTPUT_CODE,
      "OpenAI returned non-JSON output.",
      { cause: error },
    );
  }
}
