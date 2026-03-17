import assert from "node:assert/strict";
import test from "node:test";

import { INVALID_PROVIDER_OUTPUT_CODE } from "./contracts";
import { normalizeRoastOutput } from "./normalize-roast-output";
import { buildRoastPrompt } from "./prompt";
import { resolveOpenAIModel } from "./providers/openai-provider";

test("normalizes a valid provider payload", () => {
  const result = normalizeRoastOutput({
    score: 8.7,
    verdict: "solid",
    headline: "you actually wrote maintainable code",
    summary: "This solution is clear and reasonably efficient.",
    issues: [
      {
        severity: "good",
        title: "clear naming",
        description: "Names communicate intent without extra comments.",
      },
    ],
    diffLines: [
      {
        lineType: "context",
        content: "function sum(values) {",
      },
      {
        lineType: "added",
        content: "  return values.reduce((acc, value) => acc + value, 0);",
      },
      {
        lineType: "context",
        content: "}",
      },
    ],
  });

  assert.deepEqual(result, {
    score: 8.7,
    verdict: "solid",
    headline: "you actually wrote maintainable code",
    summary: "This solution is clear and reasonably efficient.",
    issues: [
      {
        severity: "good",
        title: "clear naming",
        description: "Names communicate intent without extra comments.",
      },
    ],
    diffLines: [
      {
        lineType: "context",
        content: "function sum(values) {",
      },
      {
        lineType: "added",
        content: "  return values.reduce((acc, value) => acc + value, 0);",
      },
      {
        lineType: "context",
        content: "}",
      },
    ],
  });
});

test("throws INVALID_PROVIDER_OUTPUT for malformed payload", () => {
  assert.throws(
    () =>
      normalizeRoastOutput({
        score: "not-a-number",
      }),
    (error: unknown) => {
      assert.equal(typeof error, "object");
      assert.notEqual(error, null);
      assert.equal(
        (error as { code: string }).code,
        INVALID_PROVIDER_OUTPUT_CODE,
      );
      return true;
    },
  );
});

test("keeps rubric invariant while tone changes by roastMode", () => {
  const honestPrompt = buildRoastPrompt({
    code: "const total = prices.reduce((sum, p) => sum + p, 0);",
    language: "typescript",
    roastMode: "honest",
    lineCount: 1,
  });

  const fullRoastPrompt = buildRoastPrompt({
    code: "const total = prices.reduce((sum, p) => sum + p, 0);",
    language: "typescript",
    roastMode: "full_roast",
    lineCount: 1,
  });

  assert.equal(honestPrompt.rubric, fullRoastPrompt.rubric);
  assert.notEqual(
    honestPrompt.toneInstruction,
    fullRoastPrompt.toneInstruction,
  );
});

test("resolves model from OPENAI_MODEL with fallback", () => {
  const explicitModel = resolveOpenAIModel({ OPENAI_MODEL: "gpt-4o" });
  const fallbackModel = resolveOpenAIModel({});

  assert.equal(explicitModel, "gpt-4o");
  assert.equal(fallbackModel, "gpt-4o-mini");
});
