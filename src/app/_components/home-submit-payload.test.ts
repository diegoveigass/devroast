import assert from "node:assert/strict";
import test from "node:test";

import { buildHomeSubmitPayload } from "./home-submit-payload";

test("prefers the manual language over the detected language", () => {
  const result = buildHomeSubmitPayload({
    code: "const answer = 42;",
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
    code: "def greet(name: str):\n    print(f'hi {name}')",
    roastModeEnabled: false,
    selectedLanguage: null,
  });

  assert.deepEqual(result, {
    code: "def greet(name: str):\n    print(f'hi {name}')",
    language: "python",
    roastMode: "honest",
    source: "web",
  });
});

test("derives the auto-detected language from the current code instead of trusting stale state", () => {
  const result = buildHomeSubmitPayload({
    code: "def greet(name: str):\n    print(f'hi {name}')",
    roastModeEnabled: true,
    selectedLanguage: null,
  });

  assert.deepEqual(result, {
    code: "def greet(name: str):\n    print(f'hi {name}')",
    language: "python",
    roastMode: "full_roast",
    source: "web",
  });
});
