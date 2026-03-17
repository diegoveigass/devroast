import assert from "node:assert/strict";
import test from "node:test";

import {
  createGetResultShareSource,
  toResultShareSource,
} from "./get-result-share-source";

test("share source accepts completed results", () => {
  const source = toResultShareSource({
    code: "const x = 1;",
    diffLines: [],
    headline: "needs serious refactoring",
    issues: [],
    language: "typescript",
    lineCount: 12,
    publicId: "sub_123",
    roastMode: "honest",
    score: 3.5,
    status: "completed",
    submissionId: "11111111-1111-4111-8111-111111111111",
    summary: "",
    verdict: "rough",
  });

  assert.deepEqual(source, {
    headline: "needs serious refactoring",
    language: "typescript",
    lineCount: 12,
    score: 3.5,
    status: "completed",
    verdict: "rough",
  });
});

test("share source rejects non-completed results", () => {
  assert.deepEqual(toResultShareSource({ status: "processing" }), {
    status: "unavailable",
  });
});

test("share source rejects failed results", () => {
  assert.deepEqual(
    toResultShareSource({
      processingError: "Provider unavailable.",
      status: "failed",
    }),
    {
      status: "unavailable",
    },
  );
});

test("share source returns unavailable when roast is missing", async () => {
  const getResultShareSource = createGetResultShareSource(async () => ({
    code: "RESULT_NOT_FOUND",
    message: "missing",
  }));

  assert.deepEqual(
    await getResultShareSource("11111111-1111-4111-8111-111111111111"),
    { status: "unavailable" },
  );
});
