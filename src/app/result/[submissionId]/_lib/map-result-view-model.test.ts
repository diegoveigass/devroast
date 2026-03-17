import assert from "node:assert/strict";
import test from "node:test";

import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

import { mapResultViewModel } from "./map-result-view-model";

type ResultOutput =
  inferRouterOutputs<AppRouter>["roasts"]["getBySubmissionId"];

test("maps completed roast result into the view model used by the page", () => {
  const input: ResultOutput = {
    code: "const total = items.reduce((sum, item) => sum + item.price, 0);",
    diffLines: [
      { content: "const total = 0;", lineType: "removed", position: 1 },
      {
        content:
          "const total = items.reduce((sum, item) => sum + item.price, 0);",
        lineType: "added",
        position: 2,
      },
    ],
    headline: '"this code survived, somehow."',
    issues: [
      {
        description: "A reducer makes the intent easier to scan.",
        position: 1,
        severity: "warning",
        title: "loop is noisier than it needs to be",
      },
      {
        description: "Naming is clear and direct.",
        position: 2,
        severity: "good",
        title: "readable naming",
      },
    ],
    language: "typescript",
    lineCount: 4,
    publicId: "sub_123",
    roastMode: "full_roast",
    score: 4.2,
    status: "completed",
    submissionId: "11111111-1111-4111-8111-111111111111",
    summary:
      "The fundamentals are fine, but the structure is still doing extra work.",
    verdict: "rough",
  };

  const result = mapResultViewModel(input);

  assert.equal(result.status, "completed");
  assert.equal(result.roastLabel, "verdict: rough");
  assert.equal(result.shikiLanguage, "typescript");
  assert.equal(result.summary, input.summary);
  assert.deepEqual(result.analysisItems, [
    {
      description: "A reducer makes the intent easier to scan.",
      title: "loop is noisier than it needs to be",
      tone: "warning",
    },
    {
      description: "Naming is clear and direct.",
      title: "readable naming",
      tone: "good",
    },
  ]);
  assert.deepEqual(result.diffLines, [
    { code: "const total = 0;", variant: "removed" },
    {
      code: "const total = items.reduce((sum, item) => sum + item.price, 0);",
      variant: "added",
    },
  ]);
});

test("maps failed roast result into a retry-oriented state", () => {
  const input: ResultOutput = {
    processingError: "Provider unavailable.",
    status: "failed",
  };

  const result = mapResultViewModel(input);

  assert.deepEqual(result, {
    description: "Provider unavailable.",
    status: "failed",
    title: "roast_failed",
  });
});

test("maps processing roast result into a pending state", () => {
  const input: ResultOutput = {
    status: "processing",
  };

  const result = mapResultViewModel(input);

  assert.deepEqual(result, {
    description:
      "Your roast is still cooking. Reload this page in a moment to check again.",
    status: "processing",
    title: "roast_in_progress",
  });
});

test("maps RESULT_NOT_FOUND payload into a not_found view state", () => {
  const input: ResultOutput = {
    code: "RESULT_NOT_FOUND",
    message:
      "Roast result for submission 11111111-1111-4111-8111-111111111111 was not found.",
  };

  const result = mapResultViewModel(input);

  assert.deepEqual(result, {
    description:
      "We couldn't find a roast for this submission id. Try creating a new one from the homepage.",
    status: "not_found",
    title: "roast_not_found",
  });
});
