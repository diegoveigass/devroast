"use client";

import { useEffect, useMemo } from "react";

import { Badge, CodeInput } from "@/components/ui";
import { detectLanguage } from "@/lib/code-highlight/detect-language";
import {
  DEFAULT_LANGUAGE_ID,
  getLanguageLabel,
  type SupportedLanguageId,
} from "@/lib/code-highlight/languages";

import { HomeCodeEditorLanguageSelect } from "./home-code-editor-language-select";

type HomeCodeEditorProps = {
  characterLimit: number;
  code: string;
  onDetectedLanguageChange: (value: SupportedLanguageId) => void;
  onCodeChange: (value: string) => void;
  onSelectedLanguageChange: (value: SupportedLanguageId | null) => void;
  selectedLanguage: SupportedLanguageId | null;
};

export function HomeCodeEditor({
  characterLimit,
  code,
  onDetectedLanguageChange,
  onCodeChange,
  onSelectedLanguageChange,
  selectedLanguage,
}: HomeCodeEditorProps) {
  const detectedLanguage = useMemo(
    () =>
      code.trim().length === 0 ? DEFAULT_LANGUAGE_ID : detectLanguage(code),
    [code],
  );

  useEffect(() => {
    onDetectedLanguageChange(detectedLanguage);
  }, [detectedLanguage, onDetectedLanguageChange]);

  const activeLanguage = selectedLanguage ?? detectedLanguage;
  const status = useMemo(() => {
    if (selectedLanguage) {
      return {
        label: `manual: ${getLanguageLabel(selectedLanguage)}`,
        variant: "warning" as const,
      };
    }

    if (activeLanguage === "plaintext") {
      return {
        label: "auto: plain text",
        variant: "critical" as const,
      };
    }

    return {
      label: `auto: ${getLanguageLabel(activeLanguage)}`,
      variant: "good" as const,
    };
  }, [activeLanguage, selectedLanguage]);

  return (
    <div className="flex w-full flex-col gap-3">
      <CodeInput
        characterLimit={characterLimit}
        code={code}
        headerAside={
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <Badge showDot={false} variant={status.variant}>
              {status.label}
            </Badge>
            <HomeCodeEditorLanguageSelect
              onChange={onSelectedLanguageChange}
              value={selectedLanguage}
            />
          </div>
        }
        language={activeLanguage}
        onCodeChange={onCodeChange}
        placeholder={
          "function calculateTotal(items) {\n  let total = 0;\n\n  for (const item of items) {\n    total += item.price;\n  }\n\n  return total;\n}"
        }
      />

      <p className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
        {"// auto-detect ativo, mas voce pode travar a linguagem manualmente"}
      </p>
    </div>
  );
}
