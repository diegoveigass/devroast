"use client";

import type { ReactNode } from "react";

import { Button, Toggle } from "@/components/ui";
import type { SupportedLanguageId } from "@/lib/code-highlight/languages";

import { HomeCodeEditor } from "./home-code-editor";

type HomeHeroProps = {
  characterLimit: number;
  children: ReactNode;
  code: string;
  isSubmitting: boolean;
  isSubmitDisabled: boolean;
  onCodeChange: (value: string) => void;
  onRoastModeChange: (value: boolean) => void;
  onSelectedLanguageChange: (value: SupportedLanguageId | null) => void;
  onSubmit: () => void;
  roastModeEnabled: boolean;
  selectedLanguage: SupportedLanguageId | null;
  submitErrorMessage: string | null;
};

export function HomeHero({
  characterLimit,
  children,
  code,
  isSubmitting,
  isSubmitDisabled,
  onCodeChange,
  onRoastModeChange,
  onSelectedLanguageChange,
  onSubmit,
  roastModeEnabled,
  selectedLanguage,
  submitErrorMessage,
}: HomeHeroProps) {
  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 font-mono text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">
          <span className="text-accent-green">{"$"}</span>
          <h1>paste your code. get roasted.</h1>
        </div>

        <p className="max-w-3xl text-sm leading-6 text-text-secondary">
          {
            "// drop your code below and we'll rate it - brutally honest or full roast mode"
          }
        </p>
      </div>

      <HomeCodeEditor
        characterLimit={characterLimit}
        code={code}
        onCodeChange={onCodeChange}
        onSelectedLanguageChange={onSelectedLanguageChange}
        selectedLanguage={selectedLanguage}
      />

      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
            <Toggle.Root>
              <Toggle.Control
                checked={roastModeEnabled}
                onCheckedChange={onRoastModeChange}
              />
              <Toggle.Label>roast mode</Toggle.Label>
            </Toggle.Root>
            <p className="text-xs leading-5 text-text-tertiary">
              {roastModeEnabled
                ? "// maximum sarcasm enabled"
                : "// toned down, still honest"}
            </p>
          </div>

          <Button disabled={isSubmitDisabled} onClick={onSubmit} type="button">
            {isSubmitting ? "$ roasting..." : "$ roast_my_code"}
          </Button>
        </div>

        {submitErrorMessage ? (
          <p
            className="border border-accent-red bg-bg-critical-soft px-4 py-3 text-left font-mono text-xs leading-6 text-accent-red"
            role="alert"
          >
            {`// ${submitErrorMessage}`}
          </p>
        ) : null}

        {children}
      </div>
    </section>
  );
}
