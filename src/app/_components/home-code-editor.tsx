"use client";

import { useMemo, useState } from "react";

import { Badge, CodeInput } from "@/components/ui";
import { detectLanguage } from "@/lib/code-highlight/detect-language";
import {
  DEFAULT_LANGUAGE_ID,
  getLanguageLabel,
  type SupportedLanguageId,
} from "@/lib/code-highlight/languages";

import { HomeCodeEditorLanguageSelect } from "./home-code-editor-language-select";

type HomeCodeEditorProps = {
  code: string;
  onCodeChange: (value: string) => void;
};

export function HomeCodeEditor({ code, onCodeChange }: HomeCodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguageId | null>(null);
  const detectedLanguage = useMemo(
    () =>
      code.trim().length === 0 ? DEFAULT_LANGUAGE_ID : detectLanguage(code),
    [code],
  );

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
        code={code}
        headerAside={
          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <Badge showDot={false} variant={status.variant}>
              {status.label}
            </Badge>
            <HomeCodeEditorLanguageSelect
              onChange={setSelectedLanguage}
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
