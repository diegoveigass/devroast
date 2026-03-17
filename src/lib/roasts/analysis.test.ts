import assert from "node:assert/strict";
import test from "node:test";
import { runRoastAnalysis } from "./analysis";
import {
  INVALID_PROVIDER_OUTPUT_CODE,
  PROVIDER_TIMEOUT_CODE,
  PROVIDER_UNAVAILABLE_CODE,
  RoastDomainError,
} from "./contracts";

const baseInput = {
  code: "const answer = 42;",
  language: "typescript",
  lineCount: 1,
  roastMode: "honest" as const,
};

test("returns normalized provider output on success", async () => {
  const result = await runRoastAnalysis(baseInput, {
    normalizeOutput: (payload) => payload as never,
    runProvider: async () => ({
      diffLines: [{ content: "const answer = 42;", lineType: "context" }],
      headline: "this code survives by sheer luck",
      issues: [
        {
          description:
            "The naming is okay, but the implementation is too casual.",
          severity: "warning",
          title: "too casual",
        },
      ],
      score: 5.2,
      summary: "Readable, but fragile.",
      verdict: "salvageable",
    }),
  });

  assert.deepEqual(result, {
    diffLines: [{ content: "const answer = 42;", lineType: "context" }],
    headline: "this code survives by sheer luck",
    issues: [
      {
        description:
          "The naming is okay, but the implementation is too casual.",
        severity: "warning",
        title: "too casual",
      },
    ],
    score: 5.2,
    summary: "Readable, but fragile.",
    verdict: "salvageable",
  });
});

test("maps timeout-like provider errors to provider timeout domain errors", async () => {
  const timeoutError = Object.assign(new Error("Request timed out."), {
    name: "TimeoutError",
  });

  await assert.rejects(
    () =>
      runRoastAnalysis(baseInput, {
        runProvider: async () => {
          throw timeoutError;
        },
      }),
    (error) => {
      assert.ok(error instanceof RoastDomainError);
      assert.equal(error.code, PROVIDER_TIMEOUT_CODE);
      assert.equal(error.message, "Request timed out.");
      return true;
    },
  );
});

test("maps connection-like provider errors to provider unavailable domain errors", async () => {
  const networkError = Object.assign(
    new Error("Network down OPENAI_API_KEY=sk-secret-value"),
    {
      name: "APIConnectionError",
    },
  );

  await assert.rejects(
    () =>
      runRoastAnalysis(baseInput, {
        runProvider: async () => {
          throw networkError;
        },
      }),
    (error) => {
      assert.ok(error instanceof RoastDomainError);
      assert.equal(error.code, PROVIDER_UNAVAILABLE_CODE);
      assert.equal(error.message, "Network down OPENAI_API_KEY=[REDACTED]");
      return true;
    },
  );
});

test("preserves invalid provider output domain errors from downstream normalization", async () => {
  await assert.rejects(
    () =>
      runRoastAnalysis(baseInput, {
        normalizeOutput: () => {
          throw new RoastDomainError(
            INVALID_PROVIDER_OUTPUT_CODE,
            "Provider output does not match the roast contract.",
          );
        },
        runProvider: async () => ({ bad: true }),
      }),
    (error) => {
      assert.ok(error instanceof RoastDomainError);
      assert.equal(error.code, INVALID_PROVIDER_OUTPUT_CODE);
      assert.equal(
        error.message,
        "Provider output does not match the roast contract.",
      );
      return true;
    },
  );
});

test("propagates unknown non-provider errors without remapping", async () => {
  const originalError = new Error("Unexpected explode");

  await assert.rejects(
    () =>
      runRoastAnalysis(baseInput, {
        runProvider: async () => {
          throw originalError;
        },
      }),
    originalError,
  );
});
