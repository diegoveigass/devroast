import {
  PROVIDER_TIMEOUT_CODE,
  PROVIDER_UNAVAILABLE_CODE,
  RoastDomainError,
  type RoastMode,
} from "./contracts";
import { normalizeRoastOutput } from "./normalize-roast-output";
import { buildRoastPrompt } from "./prompt";
import { runOpenAIProvider } from "./providers/openai-provider";

const REDACTED_TOKEN = "[REDACTED]";

type RunRoastAnalysisInput = {
  code: string;
  language: string;
  lineCount: number;
  roastMode: RoastMode;
};

function sanitizeErrorMessage(message: string) {
  return message
    .replaceAll(/sk-[a-zA-Z0-9_-]+/g, REDACTED_TOKEN)
    .replaceAll(/Bearer\s+[a-zA-Z0-9._-]+/gi, `Bearer ${REDACTED_TOKEN}`)
    .replaceAll(
      /OPENAI_API_KEY\s*=\s*\S+/gi,
      `OPENAI_API_KEY=${REDACTED_TOKEN}`,
    );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message);
  }

  return "Unknown provider error";
}

function mapProviderError(error: unknown) {
  if (error instanceof RoastDomainError) {
    return new RoastDomainError(error.code, getErrorMessage(error), {
      cause: error.cause,
      submissionId: error.submissionId,
    });
  }

  if (error instanceof Error) {
    if (error.name === "APIConnectionTimeoutError") {
      return new RoastDomainError(
        PROVIDER_TIMEOUT_CODE,
        getErrorMessage(error),
        {
          cause: error,
        },
      );
    }

    if (
      error.name === "APIConnectionError" ||
      error.name === "APIError" ||
      error.name.endsWith("Error")
    ) {
      return new RoastDomainError(
        PROVIDER_UNAVAILABLE_CODE,
        getErrorMessage(error),
        {
          cause: error,
        },
      );
    }
  }

  return new RoastDomainError(
    PROVIDER_UNAVAILABLE_CODE,
    "Provider unavailable",
    {
      cause: error,
    },
  );
}

export async function runRoastAnalysis(input: RunRoastAnalysisInput) {
  const prompt = buildRoastPrompt(input);

  try {
    const providerOutput = await runOpenAIProvider({
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
    });

    return normalizeRoastOutput(providerOutput);
  } catch (error) {
    throw mapProviderError(error);
  }
}
