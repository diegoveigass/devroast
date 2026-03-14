import type { ChangeEventHandler } from "react";

import {
  AUTO_LANGUAGE_VALUE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageId,
} from "@/lib/code-highlight/languages";

type HomeCodeEditorLanguageSelectProps = {
  onChange: (value: SupportedLanguageId | null) => void;
  value: SupportedLanguageId | null;
};

export function HomeCodeEditorLanguageSelect({
  onChange,
  value,
}: HomeCodeEditorLanguageSelectProps) {
  const handleChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    const nextValue = event.target.value;

    onChange(
      nextValue === AUTO_LANGUAGE_VALUE
        ? null
        : (nextValue as SupportedLanguageId),
    );
  };

  return (
    <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-text-tertiary">
      <span className="whitespace-nowrap">language</span>
      <select
        className="h-8 min-w-36 cursor-pointer border border-border-primary bg-bg-surface px-3 font-mono text-xs normal-case tracking-normal text-text-primary outline-none transition-colors duration-200 focus-visible:border-border-focus"
        onChange={handleChange}
        value={value ?? AUTO_LANGUAGE_VALUE}
      >
        <option value={AUTO_LANGUAGE_VALUE}>Auto-detect</option>
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.id} value={language.id}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
