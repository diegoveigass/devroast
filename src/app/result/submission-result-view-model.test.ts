import assert from "node:assert/strict";
import test from "node:test";

import { createSubmissionResultViewModel } from "./submission-result-view-model";

test("maps completed query payload into the result view model", () => {
  const result = createSubmissionResultViewModel({
    code: "const answer = 42;",
    diffLines: [
      { content: "const answer = 41;", lineType: "removed", position: 1 },
      { content: "const answer = 42;", lineType: "added", position: 2 },
    ],
    headline: "the code survived the build by luck",
    issues: [
      {
        description: "There is no real abstraction here.",
        position: 1,
        severity: "critical",
        title: "accidental architecture",
      },
      {
        description: "At least the variable name is clear.",
        position: 2,
        severity: "good",
        title: "one small mercy",
      },
    ],
    language: "typescript",
    lineCount: 1,
    publicId: "sub_123",
    roastMode: "full_roast",
    score: 4.2,
    status: "completed",
    submissionId: "11111111-1111-4111-8111-111111111111",
    summary: "Readable enough, but still cursed.",
    verdict: "rough",
  });

  assert.deepEqual(result, {
    code: "const answer = 42;",
    diffLines: [
      { code: "const answer = 41;", variant: "removed" },
      { code: "const answer = 42;", variant: "added" },
    ],
    headline: "the code survived the build by luck",
    language: "typescript",
    lineCount: 1,
    score: 4.2,
    shikiLanguage: "typescript",
    status: "completed",
    summary: [
      {
        description: "There is no real abstraction here.",
        title: "accidental architecture",
        tone: "critical",
      },
      {
        description: "At least the variable name is clear.",
        title: "one small mercy",
        tone: "good",
      },
    ],
    verdictLabel: "verdict: rough",
  });
});

test("maps unknown languages to plaintext in the result view model", () => {
  const result = createSubmissionResultViewModel({
    code: "echo hi",
    diffLines: [],
    headline: "mystery language unlocked",
    issues: [],
    language: "elixir",
    lineCount: 1,
    publicId: "sub_456",
    roastMode: "honest",
    score: 8.1,
    status: "completed",
    submissionId: "22222222-2222-4222-8222-222222222222",
    summary: "Surprisingly decent.",
    verdict: "solid",
  });

  assert.equal(result.shikiLanguage, "plaintext");
});

test("returns processing state unchanged for pending results", () => {
  assert.deepEqual(createSubmissionResultViewModel({ status: "processing" }), {
    status: "processing",
  });
});

test("returns failed state unchanged for failed results", () => {
  assert.deepEqual(
    createSubmissionResultViewModel({
      processingError: "Provider unavailable.",
      status: "failed",
    }),
    {
      processingError: "Provider unavailable.",
      status: "failed",
    },
  );
});

test("returns not-found state unchanged for missing results", () => {
  assert.deepEqual(
    createSubmissionResultViewModel({
      code: "RESULT_NOT_FOUND",
      message: "No roast here.",
    }),
    {
      code: "RESULT_NOT_FOUND",
      message: "No roast here.",
      status: "not_found",
    },
  );
});
