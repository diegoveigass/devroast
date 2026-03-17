import type { SupportedLanguageId } from "@/lib/code-highlight/languages";
import type { RoastMode } from "@/lib/roasts/contracts";

type CreateSubmissionSuccess = {
  publicId: string;
  status: "completed";
  submissionId: string;
};

type CreateSubmissionFailure = {
  code:
    | "INVALID_PROVIDER_OUTPUT"
    | "PERSISTENCE_ERROR"
    | "PROVIDER_TIMEOUT"
    | "PROVIDER_UNAVAILABLE";
  message: string;
  submissionId?: string;
};

type BuildCreateSubmissionInput = {
  code: string;
  detectedLanguage: SupportedLanguageId;
  roastModeEnabled: boolean;
  selectedLanguage: SupportedLanguageId | null;
};

export function buildCreateSubmissionInput({
  code,
  detectedLanguage,
  roastModeEnabled,
  selectedLanguage,
}: BuildCreateSubmissionInput): {
  code: string;
  language: SupportedLanguageId;
  roastMode: RoastMode;
  source: "web";
} {
  return {
    code,
    language: selectedLanguage ?? detectedLanguage,
    roastMode: roastModeEnabled ? "full_roast" : "honest",
    source: "web",
  };
}

export function isCreateSubmissionSuccess(
  result: CreateSubmissionFailure | CreateSubmissionSuccess,
): result is CreateSubmissionSuccess {
  return "status" in result;
}

export function getCreateSubmissionErrorMessage(
  result: CreateSubmissionFailure | CreateSubmissionSuccess,
) {
  if ("status" in result) {
    return null;
  }

  return result.message;
}

export function getResultPath(submissionId: string) {
  return `/result/${submissionId}`;
}
