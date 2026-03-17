import assert from "node:assert/strict";
import test from "node:test";

import {
  createResultShareViewModel,
  type ResultShareSource,
} from "./result-share-view-model";

test("share view model applies language, lineCount, and headline fallbacks", () => {
  const viewModel = createResultShareViewModel({
    headline: "",
    language: null,
    lineCount: null,
    score: 2.8,
    status: "completed",
    verdict: "needs_serious_help",
  } satisfies ResultShareSource);

  assert.deepEqual(viewModel, {
    headline: "This code woke up the linter.",
    languageLabel: "lang: unknown",
    lineCountLabel: "0 lines",
    scoreLabel: "2.8",
    status: "completed",
    verdictLabel: "needs_serious_help",
  });
});

test("share view model preserves formatted completed values", () => {
  const viewModel = createResultShareViewModel({
    headline: "  the linter filed a complaint  ",
    language: "  typescript  ",
    lineCount: 12,
    score: 4,
    status: "completed",
    verdict: "rough",
  } satisfies ResultShareSource);

  assert.deepEqual(viewModel, {
    headline: "the linter filed a complaint",
    languageLabel: "lang: typescript",
    lineCountLabel: "12 lines",
    scoreLabel: "4.0",
    status: "completed",
    verdictLabel: "rough",
  });
});

test("share view model keeps unavailable sources unavailable", () => {
  assert.deepEqual(createResultShareViewModel({ status: "unavailable" }), {
    status: "unavailable",
  });
});
