import { detectLanguage } from "@/lib/code-highlight/detect-language";
import {
  DEFAULT_LANGUAGE_ID,
  type SupportedLanguageId,
} from "@/lib/code-highlight/languages";

type ResolveHomeLanguageStateInput = {
  code: string;
  selectedLanguage: SupportedLanguageId | null;
};

export function resolveHomeLanguageState({
  code,
  selectedLanguage,
}: ResolveHomeLanguageStateInput) {
  const detectedLanguage =
    code.trim().length === 0 ? DEFAULT_LANGUAGE_ID : detectLanguage(code);

  return {
    activeLanguage: selectedLanguage ?? detectedLanguage,
    detectedLanguage,
  };
}
