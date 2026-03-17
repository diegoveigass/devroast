import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCreateSubmissionInput,
  getCreateSubmissionErrorMessage,
  getResultPath,
} from "./home-roast-submission";

test("buildCreateSubmissionInput keeps manual language override", () => {
  const input = buildCreateSubmissionInput({
    code: "const answer = 42;",
    detectedLanguage: "javascript",
    roastModeEnabled: true,
    selectedLanguage: "tsx",
  });

  assert.deepEqual(input, {
    code: "const answer = 42;",
    language: "tsx",
    roastMode: "full_roast",
    source: "web",
  });
});

test("buildCreateSubmissionInput falls back to detected language and honest mode", () => {
  const input = buildCreateSubmissionInput({
    code: "print('hi')",
    detectedLanguage: "python",
    roastModeEnabled: false,
    selectedLanguage: null,
  });

  assert.deepEqual(input, {
    code: "print('hi')",
    language: "python",
    roastMode: "honest",
    source: "web",
  });
});

test("getCreateSubmissionErrorMessage returns null for completed submission", () => {
  const message = getCreateSubmissionErrorMessage({
    publicId: "sub_123",
    status: "completed",
    submissionId: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(message, null);
});

test("getCreateSubmissionErrorMessage returns typed failure message", () => {
  const message = getCreateSubmissionErrorMessage({
    code: "PROVIDER_UNAVAILABLE",
    message: "Provider offline.",
    submissionId: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(message, "Provider offline.");
});

test("getResultPath builds the submission result route", () => {
  assert.equal(
    getResultPath("11111111-1111-4111-8111-111111111111"),
    "/result/11111111-1111-4111-8111-111111111111",
  );
});
