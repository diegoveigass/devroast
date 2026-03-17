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

type StatusTone = "critical" | "warning" | "good";

type StatusPresentation = {
  badgeLabel: string;
  badgeTone: StatusTone;
  ctaHref: string;
  ctaLabel: string;
  description: string;
  title: string;
};

const STATUS_VIEW_BY_STATUS = {
  failed: {
    badgeLabel: "failed",
    badgeTone: "critical",
    ctaHref: "/",
    ctaLabel: "$ retry_from_home",
    title: "roast_failed",
  },
  not_found: {
    badgeLabel: "not_found",
    badgeTone: "warning",
    ctaHref: "/",
    ctaLabel: "$ create_new_roast",
    title: "roast_not_found",
  },
  processing: {
    badgeLabel: "processing",
    badgeTone: "good",
    ctaHref: "/",
    ctaLabel: "$ back_home",
    title: "roast_in_progress",
  },
} satisfies Record<
  "failed" | "not_found" | "processing",
  Omit<StatusPresentation, "description">
>;

export type SubmissionResultViewModel =
  | {
      analysisItems: AnalysisItem[];
      code: string;
      diffLines: DiffItem[];
      headline: string;
      kind: "completed";
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
      badgeLabel: string;
      badgeTone: StatusTone;
      ctaHref: string;
      ctaLabel: string;
      description: string;
      kind: "status";
      status: "failed" | "not_found" | "processing";
      title: string;
    };

export function mapResultViewModel(
  result: ResultOutput,
): SubmissionResultViewModel {
  if (result.status === "not_found") {
    return createStatusViewModel(
      "not_found",
      "We couldn't find a roast for this submission id. Try creating a new one from the homepage.",
    );
  }

  if ("status" in result && result.status === "processing") {
    return createStatusViewModel(
      "processing",
      "Your roast is still cooking. Reload this page in a moment to check again.",
    );
  }

  if ("status" in result && result.status === "failed") {
    return createStatusViewModel("failed", result.processingError);
  }

  if (!("status" in result) || result.status !== "completed") {
    throw new Error("Unsupported roast result state.");
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
    kind: "completed",
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

function createStatusViewModel(
  status: "failed" | "not_found" | "processing",
  description: string,
): SubmissionResultViewModel {
  return {
    ...STATUS_VIEW_BY_STATUS[status],
    description,
    kind: "status",
    status,
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
