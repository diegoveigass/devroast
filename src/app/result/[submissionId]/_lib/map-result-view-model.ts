import type { inferRouterOutputs } from "@trpc/server";
import type { BundledLanguage } from "shiki";

import {
  LANGUAGE_BY_ID,
  normalizeLanguageAlias,
} from "@/lib/code-highlight/languages";
import type { AppRouter } from "@/trpc/routers/_app";

type ResultOutput =
  inferRouterOutputs<AppRouter>["roasts"]["getBySubmissionId"];

type AnalysisItem = {
  description: string;
  title: string;
  tone: "critical" | "good" | "warning";
};

type DiffItem = {
  code: string;
  variant: "added" | "context" | "removed";
};

export type SubmissionResultViewModel =
  | {
      analysisItems: AnalysisItem[];
      code: string;
      diffLines: DiffItem[];
      headline: string;
      language: string;
      lineCount: number;
      roastLabel: string;
      score: number;
      shikiLanguage: BundledLanguage;
      status: "completed";
      submissionId: string;
      summary: string;
    }
  | {
      description: string;
      status: "failed" | "not_found" | "processing";
      title: string;
    };

export function mapResultViewModel(
  result: ResultOutput,
): SubmissionResultViewModel {
  if ("message" in result) {
    return {
      description:
        "We couldn't find a roast for this submission id. Try creating a new one from the homepage.",
      status: "not_found",
      title: "roast_not_found",
    };
  }

  if (result.status === "processing") {
    return {
      description:
        "Your roast is still cooking. Reload this page in a moment to check again.",
      status: "processing",
      title: "roast_in_progress",
    };
  }

  if (result.status === "failed") {
    return {
      description: result.processingError,
      status: "failed",
      title: "roast_failed",
    };
  }

  return {
    analysisItems: result.issues.map((issue) => ({
      description: issue.description,
      title: issue.title,
      tone: issue.severity,
    })),
    code: result.code,
    diffLines: result.diffLines.map((line) => ({
      code: line.content,
      variant: line.lineType,
    })),
    headline: result.headline,
    language: result.language ?? "unknown",
    lineCount: result.lineCount,
    roastLabel: `verdict: ${result.verdict}`,
    score: result.score,
    shikiLanguage: resolveResultLanguage(result.language),
    status: "completed",
    submissionId: result.submissionId,
    summary: result.summary,
  };
}

function resolveResultLanguage(language: string | null): BundledLanguage {
  const normalizedLanguage = normalizeLanguageAlias(language);

  if (!normalizedLanguage) {
    return "plaintext" as BundledLanguage;
  }

  return (LANGUAGE_BY_ID[normalizedLanguage].shiki ??
    "plaintext") as BundledLanguage;
}
