"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import type { SupportedLanguageId } from "@/lib/code-highlight/languages";
import { DEFAULT_LANGUAGE_ID } from "@/lib/code-highlight/languages";
import { useTRPC } from "@/trpc/client";
import { HomeHero } from "./home-hero";
import {
  buildCreateSubmissionInput,
  getCreateSubmissionErrorMessage,
  getResultPath,
  isCreateSubmissionSuccess,
} from "./home-roast-submission";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roastModeEnabled, setRoastModeEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] =
    useState<SupportedLanguageId | null>(null);
  const isCodeOverLimit = code.length > characterLimit;

  const createSubmission = useMutation(
    trpc.roasts.createSubmission.mutationOptions({
      onError: (error) => {
        setErrorMessage(error.message);
      },
      onSuccess: (result) => {
        const nextErrorMessage = getCreateSubmissionErrorMessage(result);

        if (nextErrorMessage) {
          setErrorMessage(nextErrorMessage);
          return;
        }

        if (!isCreateSubmissionSuccess(result)) {
          return;
        }

        setErrorMessage(null);
        router.push(getResultPath(result.submissionId));
      },
    }),
  );

  const handleSubmit = () => {
    if (
      code.trim().length === 0 ||
      isCodeOverLimit ||
      createSubmission.isPending
    ) {
      return;
    }

    setErrorMessage(null);
    createSubmission.mutate(
      buildCreateSubmissionInput({
        code,
        detectedLanguage,
        roastModeEnabled,
        selectedLanguage,
      }),
    );
  };

  return (
    <HomeHero
      characterLimit={characterLimit}
      code={code}
      errorMessage={errorMessage}
      isSubmitDisabled={code.trim().length === 0 || isCodeOverLimit}
      isSubmitting={createSubmission.isPending}
      onDetectedLanguageChange={setDetectedLanguage}
      onCodeChange={setCode}
      onRoastModeChange={setRoastModeEnabled}
      onSubmit={handleSubmit}
      onSelectedLanguageChange={setSelectedLanguage}
      roastModeEnabled={roastModeEnabled}
      selectedLanguage={selectedLanguage}
    >
      {children}
    </HomeHero>
  );
}
