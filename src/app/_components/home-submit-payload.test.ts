import assert from "node:assert/strict";
import test from "node:test";

import { buildHomeSubmitPayload } from "./home-submit-payload";

test("prefers the manual language over the detected language", () => {
  const result = buildHomeSubmitPayload({
    code: "const answer = 42;",
    detectedLanguage: "javascript",
    roastModeEnabled: true,
    selectedLanguage: "typescript",
  });

  assert.deepEqual(result, {
    code: "const answer = 42;",
    language: "typescript",
    roastMode: "full_roast",
    source: "web",
  });
});

test("falls back to the detected language and maps disabled roast mode to honest", () => {
  const result = buildHomeSubmitPayload({
    code: "print('hi')",
    detectedLanguage: "python",
    roastModeEnabled: false,
    selectedLanguage: null,
  });

  assert.deepEqual(result, {
    code: "print('hi')",
    language: "python",
    roastMode: "honest",
    source: "web",
  });
});
