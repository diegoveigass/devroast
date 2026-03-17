import type { SupportedLanguageId } from "@/lib/code-highlight/languages";
import type { RoastMode } from "@/lib/roasts/contracts";

import { resolveHomeLanguageState } from "./home-language-state";

type BuildHomeSubmitPayloadInput = {
  code: string;
  roastModeEnabled: boolean;
  selectedLanguage: SupportedLanguageId | null;
};

export type HomeSubmitPayload = {
  code: string;
  language: SupportedLanguageId;
  roastMode: RoastMode;
  source: "web";
};

export function buildHomeSubmitPayload({
  code,
  roastModeEnabled,
  selectedLanguage,
}: BuildHomeSubmitPayloadInput): HomeSubmitPayload {
  const { activeLanguage } = resolveHomeLanguageState({
    code,
    selectedLanguage,
  });

  return {
    code,
    language: activeLanguage,
    roastMode: roastModeEnabled ? "full_roast" : "honest",
    source: "web",
  };
}
