import assert from "node:assert/strict";
import test from "node:test";

import { PERSISTENCE_ERROR_CODE } from "@/lib/roasts/contracts";

import * as homePageClientModule from "./home-page-client";
import { HOME_SUBMIT_GENERIC_ERROR_MESSAGE } from "./home-submit-error-message";

type SubmitHomePageClientSubmission = (typeof homePageClientModule & {
  submitHomePageClientSubmission?: (input: {
    code: string;
    mutateAsync: () => Promise<unknown>;
    push: (href: string) => void;
    roastModeEnabled: boolean;
    selectedLanguage: string | null;
    setSubmitErrorMessage: (message: string | null) => void;
  }) => Promise<void>;
})["submitHomePageClientSubmission"];

const submitHomePageClientSubmission =
  homePageClientModule as typeof homePageClientModule & {
    submitHomePageClientSubmission?: SubmitHomePageClientSubmission;
  };

test("submit flow success navigates to the result page", async () => {
  assert.equal(
    typeof submitHomePageClientSubmission.submitHomePageClientSubmission,
    "function",
  );

  const pushCalls: string[] = [];
  const errorMessages: Array<string | null> = [];

  await submitHomePageClientSubmission.submitHomePageClientSubmission?.({
    code: "const total = items.reduce((sum, item) => sum + item.price, 0);",
    mutateAsync: async () => ({
      publicId: "pub_123",
      status: "completed",
      submissionId: "11111111-1111-4111-8111-111111111111",
    }),
    push: (href) => {
      pushCalls.push(href);
    },
    roastModeEnabled: true,
    selectedLanguage: null,
    setSubmitErrorMessage: (message) => {
      errorMessages.push(message);
    },
  });

  assert.deepEqual(pushCalls, ["/result/11111111-1111-4111-8111-111111111111"]);
  assert.deepEqual(errorMessages, [null]);
});

test("submit flow shows a retry-friendly inline message for known domain errors", async () => {
  assert.equal(
    typeof submitHomePageClientSubmission.submitHomePageClientSubmission,
    "function",
  );

  const pushCalls: string[] = [];
  const errorMessages: Array<string | null> = [];

  await submitHomePageClientSubmission.submitHomePageClientSubmission?.({
    code: "const answer = 42;",
    mutateAsync: async () => ({
      code: PERSISTENCE_ERROR_CODE,
      message: "write failed",
      submissionId: "11111111-1111-4111-8111-111111111111",
    }),
    push: (href) => {
      pushCalls.push(href);
    },
    roastModeEnabled: false,
    selectedLanguage: "typescript",
    setSubmitErrorMessage: (message) => {
      errorMessages.push(message);
    },
  });

  assert.deepEqual(pushCalls, []);
  assert.deepEqual(errorMessages, [
    null,
    "We could not save your roast this time. Try again.",
  ]);
});

test("submit flow falls back to a safe generic message for unexpected errors", async () => {
  assert.equal(
    typeof submitHomePageClientSubmission.submitHomePageClientSubmission,
    "function",
  );

  const pushCalls: string[] = [];
  const errorMessages: Array<string | null> = [];

  await submitHomePageClientSubmission.submitHomePageClientSubmission?.({
    code: "const answer = 42;",
    mutateAsync: async () => {
      throw new Error("boom");
    },
    push: (href) => {
      pushCalls.push(href);
    },
    roastModeEnabled: true,
    selectedLanguage: null,
    setSubmitErrorMessage: (message) => {
      errorMessages.push(message);
    },
  });

  assert.deepEqual(pushCalls, []);
  assert.deepEqual(errorMessages, [null, HOME_SUBMIT_GENERIC_ERROR_MESSAGE]);
});

test("change handlers clear stale submit errors before applying edits and settings", () => {
  assert.equal(
    typeof homePageClientModule.createHomePageClientChangeHandlers,
    "function",
  );

  const steps: string[] = [];
  const handlers = homePageClientModule.createHomePageClientChangeHandlers?.({
    clearSubmitErrorMessage: () => {
      steps.push("clear");
    },
    setCode: (value) => {
      steps.push(`code:${value}`);
    },
    setRoastModeEnabled: (value) => {
      steps.push(`roast:${value}`);
    },
    setSelectedLanguage: (value) => {
      steps.push(`language:${value}`);
    },
  });

  handlers?.handleCodeChange("const value = 1;");
  handlers?.handleRoastModeChange(false);
  handlers?.handleSelectedLanguageChange("typescript");

  assert.deepEqual(steps, [
    "clear",
    "code:const value = 1;",
    "clear",
    "roast:false",
    "clear",
    "language:typescript",
  ]);
});
