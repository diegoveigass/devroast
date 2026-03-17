import assert from "node:assert/strict";
import test from "node:test";

import { resolveResultRouteParams } from "./result-route";

test("accepts a valid submission UUID from route params", () => {
  assert.deepEqual(
    resolveResultRouteParams({
      submissionId: "11111111-1111-4111-8111-111111111111",
    }),
    {
      kind: "valid",
      submissionId: "11111111-1111-4111-8111-111111111111",
    },
  );
});

test("marks invalid submission UUID params so the page can return notFound", () => {
  assert.deepEqual(resolveResultRouteParams({ submissionId: "not-a-uuid" }), {
    kind: "invalid",
  });
});
