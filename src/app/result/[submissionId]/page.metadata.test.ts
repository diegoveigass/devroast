import assert from "node:assert/strict";
import test from "node:test";

import { generateResultPageMetadata } from "./page";

test("page metadata helper returns OG metadata for completed results", async () => {
  const metadata = await generateResultPageMetadata({
    getBaseUrl: () => "https://devroast.dev",
    loadShareSource: async () => ({
      headline: "clean enough to survive",
      language: "typescript",
      lineCount: 7,
      score: 6.1,
      status: "completed",
      verdict: "salvageable",
    }),
    submissionId: "11111111-1111-4111-8111-111111111111",
  });

  const images = metadata.openGraph?.images;

  assert.equal(metadata.title, "DevRoast | salvageable 6.1/10");
  assert.equal(Array.isArray(images), true);
  assert.equal(
    metadata.description,
    "clean enough to survive lang: typescript - 7 lines",
  );
  assert.deepEqual(images, [
    {
      height: 630,
      url: "https://devroast.dev/result/11111111-1111-4111-8111-111111111111/opengraph-image",
      width: 1200,
    },
  ]);
  assert.match(JSON.stringify(metadata.twitter), /summary_large_image/);
  assert.match(
    JSON.stringify(metadata.twitter),
    /https:\/\/devroast.dev\/result\/11111111-1111-4111-8111-111111111111\/opengraph-image/,
  );
});

test("page metadata helper falls back when share data is unavailable", async () => {
  const metadata = await generateResultPageMetadata({
    getBaseUrl: () => "https://devroast.dev",
    loadShareSource: async () => ({ status: "unavailable" }),
    submissionId: "11111111-1111-4111-8111-111111111111",
  });

  assert.equal(metadata.title, "Roast Result | DevRoast");
  assert.equal(metadata.openGraph?.images, undefined);
});

test("page metadata helper rejects invalid UUIDs before loading share data", async () => {
  let loadCalls = 0;

  await assert.rejects(
    () =>
      generateResultPageMetadata({
        getBaseUrl: () => "https://devroast.dev",
        loadShareSource: async () => {
          loadCalls += 1;
          return { status: "unavailable" };
        },
        notFound: () => {
          throw new Error("NEXT_NOT_FOUND");
        },
        submissionId: "not-a-uuid",
      }),
    /NEXT_NOT_FOUND/,
  );

  assert.equal(loadCalls, 0);
});

test("page metadata helper accepts UUIDs allowed by the backend contract", async () => {
  let loadCalls = 0;

  const metadata = await generateResultPageMetadata({
    getBaseUrl: () => "https://devroast.dev",
    loadShareSource: async () => {
      loadCalls += 1;
      return {
        headline: "survived a modern uuid",
        language: "typescript",
        lineCount: 3,
        score: 7.4,
        status: "completed",
        verdict: "solid",
      };
    },
    submissionId: "019535d9-3df7-79fb-b466-fa907fa17f9e",
  });

  assert.equal(loadCalls, 1);
  assert.equal(metadata.title, "DevRoast | solid 7.4/10");
});
