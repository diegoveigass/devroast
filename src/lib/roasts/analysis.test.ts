import assert from "node:assert/strict";
import test from "node:test";

import { runRoastAnalysis } from "./analysis";
import {
  PROVIDER_TIMEOUT_CODE,
  PROVIDER_UNAVAILABLE_CODE,
  RoastDomainError,
} from "./contracts";

const ANALYSIS_INPUT = {
  code: "const sum = (a, b) => a + b;",
  language: "typescript",
  lineCount: 1,
  roastMode: "honest" as const,
};

test("maps provider timeout errors to PROVIDER_TIMEOUT", async () => {
  const timeoutError = new Error("Timed out after 20s");
  timeoutError.name = "APIConnectionTimeoutError";

  await assert.rejects(
    () =>
      runRoastAnalysis(ANALYSIS_INPUT, {
        runProvider: async () => {
          throw timeoutError;
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof RoastDomainError);
      assert.equal(error.code, PROVIDER_TIMEOUT_CODE);
      return true;
    },
  );
});

test("maps OpenAI availability failures to PROVIDER_UNAVAILABLE", async () => {
  const openAIError = new Error("OpenAI API is currently unavailable");
  openAIError.name = "OpenAIError";

  await assert.rejects(
    () =>
      runRoastAnalysis(ANALYSIS_INPUT, {
        runProvider: async () => {
          throw openAIError;
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof RoastDomainError);
      assert.equal(error.code, PROVIDER_UNAVAILABLE_CODE);
      return true;
    },
  );
});

test("does not mask unknown runtime errors as provider errors", async () => {
  const unknownError = new TypeError("Cannot read properties of undefined");

  await assert.rejects(
    () =>
      runRoastAnalysis(ANALYSIS_INPUT, {
        runProvider: async () => {
          throw unknownError;
        },
      }),
    (error: unknown) => {
      assert.equal(error, unknownError);
      return true;
    },
  );
});

test("redacts secrets from provider error messages", async () => {
  const providerError = new RoastDomainError(
    PROVIDER_UNAVAILABLE_CODE,
    "Missing config OPENAI_API_KEY=sk-live-secret and Bearer sk-bearer-secret",
  );

  await assert.rejects(
    () =>
      runRoastAnalysis(ANALYSIS_INPUT, {
        runProvider: async () => {
          throw providerError;
        },
      }),
    (error: unknown) => {
      assert.ok(error instanceof RoastDomainError);
      assert.equal(error.code, PROVIDER_UNAVAILABLE_CODE);
      assert.match(error.message, /\[REDACTED\]/);
      assert.doesNotMatch(error.message, /sk-live-secret/);
      assert.doesNotMatch(error.message, /sk-bearer-secret/);
      return true;
    },
  );
});
