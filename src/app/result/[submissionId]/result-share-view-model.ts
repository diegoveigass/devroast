import type { ResultShareSource } from "./get-result-share-source";

type CompletedResultShareViewModel = {
  headline: string;
  languageLabel: string;
  lineCountLabel: string;
  scoreLabel: string;
  status: "completed";
  verdictLabel: string;
};

type UnavailableResultShareViewModel = {
  status: "unavailable";
};

export type ResultShareViewModel =
  | CompletedResultShareViewModel
  | UnavailableResultShareViewModel;

export type { ResultShareSource };

export function createResultShareViewModel(
  source: ResultShareSource,
): ResultShareViewModel {
  if (source.status !== "completed") {
    return { status: "unavailable" };
  }

  const headline = source.headline?.trim() ?? "";
  const language = source.language?.trim() ?? "";

  return {
    headline: headline.length > 0 ? headline : "This code woke up the linter.",
    languageLabel: `lang: ${language || "unknown"}`,
    lineCountLabel: `${source.lineCount ?? 0} lines`,
    scoreLabel: source.score.toFixed(1),
    status: "completed",
    verdictLabel: source.verdict,
  };
}
