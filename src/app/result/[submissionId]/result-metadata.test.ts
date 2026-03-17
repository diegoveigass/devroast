import assert from "node:assert/strict";
import test from "node:test";

import { buildResultMetadata } from "./result-metadata";

test("builds completed-result metadata with OG image URL", () => {
  const metadata = buildResultMetadata({
    baseUrl: "https://devroast.dev",
    submissionId: "11111111-1111-4111-8111-111111111111",
    viewModel: {
      headline: "the linter filed a complaint",
      languageLabel: "lang: typescript",
      lineCountLabel: "7 lines",
      scoreLabel: "3.5",
      status: "completed",
      verdictLabel: "rough",
    },
  });

  assert.equal(metadata.title, "DevRoast | rough 3.5/10");
  assert.equal(
    metadata.description,
    "the linter filed a complaint lang: typescript - 7 lines",
  );
  assert.equal(
    metadata.openGraph?.images?.[0]?.url,
    "https://devroast.dev/result/11111111-1111-4111-8111-111111111111/opengraph-image",
  );
  assert.equal(metadata.twitter?.card, "summary_large_image");
});

test("falls back to product metadata when share image is unavailable", () => {
  const metadata = buildResultMetadata({
    baseUrl: "https://devroast.dev",
    submissionId: "11111111-1111-4111-8111-111111111111",
    viewModel: { status: "unavailable" },
  });

  assert.equal(metadata.title, "Roast Result | DevRoast");
  assert.equal(
    metadata.description,
    "Roast result view keyed by a submission UUID.",
  );
  assert.equal(metadata.openGraph?.images, undefined);
});
