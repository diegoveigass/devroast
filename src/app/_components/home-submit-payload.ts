import type { SupportedLanguageId } from "@/lib/code-highlight/languages";
import type { RoastMode } from "@/lib/roasts/contracts";

type BuildHomeSubmitPayloadInput = {
  code: string;
  detectedLanguage: SupportedLanguageId;
  roastModeEnabled: boolean;
  selectedLanguage: SupportedLanguageId | null;
};

type HomeSubmitPayload = {
  code: string;
  language: SupportedLanguageId;
  roastMode: RoastMode;
  source: "web";
};

export function buildHomeSubmitPayload({
  code,
  detectedLanguage,
  roastModeEnabled,
  selectedLanguage,
}: BuildHomeSubmitPayloadInput): HomeSubmitPayload {
  return {
    code,
    language: selectedLanguage ?? detectedLanguage,
    roastMode: roastModeEnabled ? "full_roast" : "honest",
    source: "web",
  };
}
