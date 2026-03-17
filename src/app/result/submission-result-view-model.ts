import type { inferRouterOutputs } from "@trpc/server";
import type { BundledLanguage } from "shiki";

import {
  LANGUAGE_BY_ID,
  normalizeLanguageAlias,
} from "@/lib/code-highlight/languages";
import type { AppRouter } from "@/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ResultPayload = RouterOutputs["roasts"]["getBySubmissionId"];
type ResultNotFoundPayload = Extract<
  ResultPayload,
  { code: "RESULT_NOT_FOUND" }
>;
type FailedPayload = Extract<ResultPayload, { status: "failed" }>;
type ProcessingPayload = Extract<ResultPayload, { status: "processing" }>;
type CompletedPayload = Extract<ResultPayload, { status: "completed" }>;

type ProcessingViewModel = {
  status: "processing";
};

type FailedViewModel = {
  processingError: string;
  status: "failed";
};

type NotFoundViewModel = {
  code: "RESULT_NOT_FOUND";
  message: string;
  status: "not_found";
};

type CompletedViewModel = {
  code: string;
  diffLines: Array<{ code: string; variant: "added" | "context" | "removed" }>;
  headline: string;
  language: string | null;
  lineCount: number;
  score: number;
  shikiLanguage: BundledLanguage;
  status: "completed";
  summary: Array<{
    description: string;
    title: string;
    tone: "critical" | "good" | "warning";
  }>;
  verdictLabel: string;
};

export type SubmissionResultViewModel =
  | CompletedViewModel
  | FailedViewModel
  | NotFoundViewModel
  | ProcessingViewModel;

export function createSubmissionResultViewModel(
  result: ResultPayload,
): SubmissionResultViewModel {
  if (isResultNotFoundPayload(result)) {
    return {
      code: result.code,
      message: result.message,
      status: "not_found",
    };
  }

  if (isProcessingPayload(result)) {
    return result;
  }

  if (isFailedPayload(result)) {
    return {
      processingError: result.processingError,
      status: "failed",
    };
  }

  const completed = result as CompletedPayload;

  return {
    code: completed.code,
    diffLines: completed.diffLines.map((line) => ({
      code: line.content,
      variant: line.lineType,
    })),
    headline: completed.headline,
    language: completed.language,
    lineCount: completed.lineCount,
    score: completed.score,
    shikiLanguage: resolveResultLanguage(completed.language),
    status: "completed",
    summary: completed.issues.map((issue) => ({
      description: issue.description,
      title: issue.title,
      tone: issue.severity,
    })),
    verdictLabel: `verdict: ${completed.verdict}`,
  };
}

function isResultNotFoundPayload(
  result: ResultPayload,
): result is ResultNotFoundPayload {
  return "code" in result && result.code === "RESULT_NOT_FOUND";
}

function isProcessingPayload(
  result: ResultPayload,
): result is ProcessingPayload {
  return "status" in result && result.status === "processing";
}

function isFailedPayload(result: ResultPayload): result is FailedPayload {
  return "status" in result && result.status === "failed";
}

function resolveResultLanguage(language: string | null): BundledLanguage {
  const normalizedLanguage = normalizeLanguageAlias(language);

  if (!normalizedLanguage) {
    return "plaintext" as BundledLanguage;
  }

  return (LANGUAGE_BY_ID[normalizedLanguage].shiki ??
    "plaintext") as BundledLanguage;
}
