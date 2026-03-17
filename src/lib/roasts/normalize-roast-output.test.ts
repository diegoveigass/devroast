import assert from "node:assert/strict";
import test from "node:test";

import { RoastDomainError } from "./contracts";
import { normalizeRoastOutput } from "./normalize-roast-output";

test("returns parsed roast provider output when payload matches contract", () => {
  const result = normalizeRoastOutput({
    diffLines: [
      {
        content: "const answer = 42;",
        lineType: "context",
      },
    ],
    headline: "the code compiles, but at what emotional cost?",
    issues: [
      {
        description: "Too many mutable variables for such a small function.",
        severity: "warning",
        title: "unnecessary mutation",
      },
    ],
    score: 4.8,
    summary:
      "Readable enough, but the implementation still fights the language.",
    verdict: "rough",
  });

  assert.deepEqual(result, {
    diffLines: [
      {
        content: "const answer = 42;",
        lineType: "context",
      },
    ],
    headline: "the code compiles, but at what emotional cost?",
    issues: [
      {
        description: "Too many mutable variables for such a small function.",
        severity: "warning",
        title: "unnecessary mutation",
      },
    ],
    score: 4.8,
    summary:
      "Readable enough, but the implementation still fights the language.",
    verdict: "rough",
  });
});

test("throws invalid provider output error when payload is malformed", () => {
  assert.throws(
    () =>
      normalizeRoastOutput({
        diffLines: [
          {
            content: "const answer = 42;",
            lineType: "invalid",
          },
        ],
        headline: "oops",
        issues: [
          {
            description: "Missing severity should explode.",
            title: "broken contract",
          },
        ],
        score: 11,
        summary: "Still wrong.",
        verdict: "rough",
      }),
    (error) => {
      assert.ok(error instanceof RoastDomainError);
      assert.equal(error.code, "INVALID_PROVIDER_OUTPUT");
      assert.equal(
        error.message,
        "Provider output does not match the roast contract.",
      );
      return true;
    },
  );
});
