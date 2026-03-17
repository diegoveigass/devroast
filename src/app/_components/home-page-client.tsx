"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  DEFAULT_LANGUAGE_ID,
  type SupportedLanguageId,
} from "@/lib/code-highlight/languages";
import { useTRPC } from "@/trpc/client";

import { HomeHero } from "./home-hero";
import { getHomeSubmitErrorMessage } from "./home-submit-error-message";
import { buildHomeSubmitPayload } from "./home-submit-payload";

type HomePageClientProps = {
  characterLimit: number;
  children: ReactNode;
};

export function HomePageClient({
  characterLimit,
  children,
}: HomePageClientProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [code, setCode] = useState("");
  const [detectedLanguage, setDetectedLanguage] =
    useState<SupportedLanguageId>(DEFAULT_LANGUAGE_ID);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguageId | null>(null);
  const [roastModeEnabled, setRoastModeEnabled] = useState(true);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(
    null,
  );
  const createSubmissionMutation = useMutation(
    trpc.roasts.createSubmission.mutationOptions(),
  );
  const isCodeOverLimit = code.length > characterLimit;
  const isSubmitDisabled =
    code.trim().length === 0 ||
    isCodeOverLimit ||
    createSubmissionMutation.isPending;

  async function handleSubmit() {
    if (isSubmitDisabled) {
      return;
    }

    setSubmitErrorMessage(null);

    try {
      const result = await createSubmissionMutation.mutateAsync(
        buildHomeSubmitPayload({
          code,
          detectedLanguage,
          roastModeEnabled,
          selectedLanguage,
        }),
      );

      if ("status" in result) {
        router.push(`/result/${result.submissionId}`);
        return;
      }

      setSubmitErrorMessage(getHomeSubmitErrorMessage(result.code));
    } catch {
      setSubmitErrorMessage(getHomeSubmitErrorMessage());
    }
  }

  return (
    <HomeHero
      characterLimit={characterLimit}
      code={code}
      isSubmitting={createSubmissionMutation.isPending}
      isSubmitDisabled={isSubmitDisabled}
      onDetectedLanguageChange={setDetectedLanguage}
      onCodeChange={setCode}
      onRoastModeChange={setRoastModeEnabled}
      onSelectedLanguageChange={setSelectedLanguage}
      onSubmit={() => {
        void handleSubmit();
      }}
      roastModeEnabled={roastModeEnabled}
      selectedLanguage={selectedLanguage}
      submitErrorMessage={submitErrorMessage}
    >
      {children}
    </HomeHero>
  );
}
