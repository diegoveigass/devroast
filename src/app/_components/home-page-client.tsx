"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import type { SupportedLanguageId } from "@/lib/code-highlight/languages";
import { useTRPC } from "@/trpc/client";

import { HomeHero } from "./home-hero";
import { getHomeSubmitErrorMessage } from "./home-submit-error-message";
import {
  buildHomeSubmitPayload,
  type HomeSubmitPayload,
} from "./home-submit-payload";

type HomePageClientProps = {
  characterLimit: number;
  children: ReactNode;
};

type SubmitHomePageClientSubmissionInput = {
  code: string;
  mutateAsync: (payload: HomeSubmitPayload) => Promise<
    | {
        publicId: string;
        status: "completed";
        submissionId: string;
      }
    | {
        code: string;
        message: string;
        submissionId?: string;
      }
  >;
  push: (href: string) => void;
  roastModeEnabled: boolean;
  selectedLanguage: SupportedLanguageId | null;
  setSubmitErrorMessage: (message: string | null) => void;
};

type CreateHomePageClientChangeHandlersInput = {
  clearSubmitErrorMessage: () => void;
  setCode: (value: string) => void;
  setRoastModeEnabled: (value: boolean) => void;
  setSelectedLanguage: (value: SupportedLanguageId | null) => void;
};

export function createHomePageClientChangeHandlers({
  clearSubmitErrorMessage,
  setCode,
  setRoastModeEnabled,
  setSelectedLanguage,
}: CreateHomePageClientChangeHandlersInput) {
  return {
    handleCodeChange(value: string) {
      clearSubmitErrorMessage();
      setCode(value);
    },
    handleRoastModeChange(value: boolean) {
      clearSubmitErrorMessage();
      setRoastModeEnabled(value);
    },
    handleSelectedLanguageChange(value: SupportedLanguageId | null) {
      clearSubmitErrorMessage();
      setSelectedLanguage(value);
    },
  };
}

export async function submitHomePageClientSubmission({
  code,
  mutateAsync,
  push,
  roastModeEnabled,
  selectedLanguage,
  setSubmitErrorMessage,
}: SubmitHomePageClientSubmissionInput) {
  setSubmitErrorMessage(null);

  try {
    const result = await mutateAsync(
      buildHomeSubmitPayload({
        code,
        roastModeEnabled,
        selectedLanguage,
      }),
    );

    if ("status" in result) {
      push(`/result/${result.submissionId}`);
      return;
    }

    setSubmitErrorMessage(getHomeSubmitErrorMessage(result.code));
  } catch {
    setSubmitErrorMessage(getHomeSubmitErrorMessage());
  }
}

export function HomePageClient({
  characterLimit,
  children,
}: HomePageClientProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [code, setCode] = useState("");
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

  const clearSubmitErrorMessage = () => {
    setSubmitErrorMessage(null);
  };
  const {
    handleCodeChange,
    handleRoastModeChange,
    handleSelectedLanguageChange,
  } = createHomePageClientChangeHandlers({
    clearSubmitErrorMessage,
    setCode,
    setRoastModeEnabled,
    setSelectedLanguage,
  });

  async function handleSubmit() {
    if (isSubmitDisabled) {
      return;
    }

    await submitHomePageClientSubmission({
      code,
      mutateAsync: createSubmissionMutation.mutateAsync,
      push: router.push,
      roastModeEnabled,
      selectedLanguage,
      setSubmitErrorMessage,
    });
  }

  return (
    <HomeHero
      characterLimit={characterLimit}
      code={code}
      isSubmitting={createSubmissionMutation.isPending}
      isSubmitDisabled={isSubmitDisabled}
      onCodeChange={handleCodeChange}
      onRoastModeChange={handleRoastModeChange}
      onSelectedLanguageChange={handleSelectedLanguageChange}
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
