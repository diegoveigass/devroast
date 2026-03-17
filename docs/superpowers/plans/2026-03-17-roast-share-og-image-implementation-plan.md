# Roast Share OG Image Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add automatic Open Graph images for `completed` roast result pages, generated with Takumi from the approved Pencil design and exposed through dynamic metadata on `result/[submissionId]`.

**Architecture:** Keep the result page URL as the single share URL. Add a focused share-data loader plus pure metadata/view-model helpers under `src/app/result/[submissionId]`, then render the OG image through a dedicated `opengraph-image.tsx` route using `@takumi-rs/image-response`. Follow TDD strictly: pure mappers first, then page integration, then image route behavior.

**Tech Stack:** Next.js App Router, React 19, TypeScript, tRPC server utilities, Node test runner (`node --import tsx --test`), Takumi (`@takumi-rs/image-response`).

**Execution note:** Do not create git commits unless the user explicitly asks.

---

## Chunk 1: Result-share metadata and OG image delivery

## File Structure and Responsibilities

- Create: `src/app/result/[submissionId]/get-result-share-source.ts`
  - Shared server-side loader for page metadata and OG route.
  - Normalizes result status into a compact source contract.
- Create: `src/app/result/[submissionId]/get-result-share-source.test.ts`
  - Unit tests for status gating, missing-result behavior, and fallback normalization.
- Create: `src/app/result/[submissionId]/result-share-view-model.ts`
  - Pure mapper for OG-safe fields: `score`, `verdict`, `language`, `lineCount`, `headline`.
- Create: `src/app/result/[submissionId]/result-share-view-model.test.ts`
  - Unit tests for fallback values and formatting invariants.
- Create: `src/app/result/[submissionId]/result-metadata.ts`
  - Pure metadata builder for `title`, `description`, `openGraph`, and `twitter`.
- Create: `src/app/result/[submissionId]/result-metadata.test.ts`
  - Unit tests for completed and fallback metadata behavior.
- Create: `src/app/result/[submissionId]/opengraph-image.tsx`
  - Next.js OG image route using Takumi `ImageResponse`, `revalidate = 3600`, and explicit cache headers.
- Create: `src/app/result/[submissionId]/opengraph-image.test.tsx`
  - Tests for route behavior: `notFound` gating, content type, cache headers, and text-truncation style rules.
- Create: `src/app/result/[submissionId]/page.metadata.test.ts`
  - Tests for the page-level metadata helper with exact completed/unavailable behavior.
- Modify: `src/app/result/[submissionId]/page.tsx`
  - Replace static metadata export with `generateMetadata` wired to the shared loader.
- Modify: `package.json`
  - Add `@takumi-rs/image-response` and, if needed, a reusable `test` script for the new unit tests.
- Optional create if needed by implementation: `src/app/result/[submissionId]/og-image-fonts.ts`
  - Encapsulates JetBrains Mono font loading/caching for the OG route only.

### Task 1: Add the share-source loader and OG view model

**Files:**
- Create: `src/app/result/[submissionId]/get-result-share-source.ts`
- Create: `src/app/result/[submissionId]/get-result-share-source.test.ts`
- Create: `src/app/result/[submissionId]/result-share-view-model.ts`
- Create: `src/app/result/[submissionId]/result-share-view-model.test.ts`

- [ ] **Step 1: Write the failing tests for status gating and fallbacks**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  createResultShareViewModel,
  type ResultShareSource,
} from "./result-share-view-model";
import {
  createGetResultShareSource,
  toResultShareSource,
} from "./get-result-share-source";

test("share source accepts completed results", () => {
  const source = toResultShareSource({
    code: "const x = 1;",
    diffLines: [],
    headline: "needs serious refactoring",
    issues: [],
    language: "typescript",
    lineCount: 12,
    publicId: "sub_123",
    roastMode: "honest",
    score: 3.5,
    status: "completed",
    submissionId: "11111111-1111-4111-8111-111111111111",
    summary: "",
    verdict: "rough",
  });

  assert.equal(source.status, "completed");
});

test("share source rejects non-completed results", () => {
  assert.deepEqual(toResultShareSource({ status: "processing" }), {
    status: "unavailable",
  });
});

test("share source returns unavailable when roast is missing", async () => {
  const getResultShareSource = createGetResultShareSource(async () => ({
    code: "RESULT_NOT_FOUND",
    message: "missing",
  }));

  assert.deepEqual(
    await getResultShareSource("11111111-1111-4111-8111-111111111111"),
    { status: "unavailable" },
  );
});

test("share view model applies language, lineCount, and headline fallbacks", () => {
  const viewModel = createResultShareViewModel({
    headline: "",
    language: null,
    lineCount: 0,
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
```

- [ ] **Step 2: Run the tests and watch them fail for the missing modules**

Run: `node --import tsx --test src/app/result/[submissionId]/get-result-share-source.test.ts src/app/result/[submissionId]/result-share-view-model.test.ts`
Expected: FAIL with module or export errors.

- [ ] **Step 3: Implement the minimal loader and mapper**

```ts
import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

type SubmissionResultQuery = inferRouterOutputs<AppRouter>["roasts"]["getBySubmissionId"];

export type ResultShareSource =
  | {
      headline: string | null;
      language: string | null;
      lineCount: number | null;
      score: number;
      status: "completed";
      verdict: "needs_serious_help" | "rough" | "salvageable" | "solid";
    }
  | { status: "unavailable" };

export function toResultShareSource(result: SubmissionResultQuery): ResultShareSource {
  if (!("status" in result) || result.status !== "completed") {
    return { status: "unavailable" };
  }

  return {
    headline: result.headline,
    language: result.language,
    lineCount: result.lineCount,
    score: result.score,
    status: "completed",
    verdict: result.verdict,
  };
}

export function createGetResultShareSource(
  loadResult: (submissionId: string) => Promise<SubmissionResultQuery>,
) {
  return async function getResultShareSource(submissionId: string) {
    return toResultShareSource(await loadResult(submissionId));
  };
}

export const getResultShareSource = createGetResultShareSource(async (submissionId) => {
  const queryClient = getQueryClient();
  return queryClient.fetchQuery(
    trpc.roasts.getBySubmissionId.queryOptions({ submissionId }),
  );
});
```

```ts
export function createResultShareViewModel(source: ResultShareSource) {
  if (source.status !== "completed") {
    return { status: "unavailable" };
  }

  return {
    headline:
      source.headline && source.headline.trim().length > 0
        ? source.headline
        : "This code woke up the linter.",
    languageLabel: `lang: ${source.language ?? "unknown"}`,
    lineCountLabel: `${source.lineCount ?? 0} lines`,
    scoreLabel: source.score.toFixed(1),
    status: "completed",
    verdictLabel: source.verdict,
  };
}
```

- [ ] **Step 4: Re-run the tests and make them pass**

Run: `node --import tsx --test src/app/result/[submissionId]/get-result-share-source.test.ts src/app/result/[submissionId]/result-share-view-model.test.ts`
Expected: PASS.

- [ ] **Step 5: Refactor only if needed, then keep tests green**

Run: `node --import tsx --test src/app/result/[submissionId]/get-result-share-source.test.ts src/app/result/[submissionId]/result-share-view-model.test.ts`
Expected: PASS after any naming/helper cleanup.

### Task 2: Add pure metadata construction for result share pages

**Files:**
- Create: `src/app/result/[submissionId]/result-metadata.ts`
- Create: `src/app/result/[submissionId]/result-metadata.test.ts`

- [ ] **Step 1: Write the failing metadata tests first**

```ts
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
});

test("falls back to product metadata when share image is unavailable", () => {
  const metadata = buildResultMetadata({
    baseUrl: "https://devroast.dev",
    submissionId: "11111111-1111-4111-8111-111111111111",
    viewModel: { status: "unavailable" },
  });

  assert.equal(metadata.title, "Roast Result | DevRoast");
  assert.equal(metadata.openGraph?.images, undefined);
});
```

- [ ] **Step 2: Run the metadata test and confirm it fails**

Run: `node --import tsx --test src/app/result/[submissionId]/result-metadata.test.ts`
Expected: FAIL because `buildResultMetadata` does not exist yet.

- [ ] **Step 3: Implement the smallest metadata builder that matches the spec**

```ts
export function buildResultMetadata({ baseUrl, submissionId, viewModel }: BuildResultMetadataInput): Metadata {
  if (viewModel.status !== "completed") {
    return {
      title: "Roast Result | DevRoast",
      description: "Roast result view keyed by a submission UUID.",
    };
  }

  const imageUrl = new URL(`/result/${submissionId}/opengraph-image`, baseUrl).toString();

  return {
    description: `${viewModel.headline} ${viewModel.languageLabel} - ${viewModel.lineCountLabel}`,
    openGraph: {
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      title: `DevRoast | ${viewModel.verdictLabel} ${viewModel.scoreLabel}/10`,
    },
    title: `DevRoast | ${viewModel.verdictLabel} ${viewModel.scoreLabel}/10`,
    twitter: {
      card: "summary_large_image",
      images: [imageUrl],
    },
  };
}
```

- [ ] **Step 4: Re-run the metadata test and make it pass**

Run: `node --import tsx --test src/app/result/[submissionId]/result-metadata.test.ts`
Expected: PASS.

- [ ] **Step 5: Keep the metadata builder pure and tests green**

Run: `node --import tsx --test src/app/result/[submissionId]/result-metadata.test.ts`
Expected: PASS after any tiny refactor.

### Task 3: Wire `generateMetadata` into the result page

**Files:**
- Create: `src/app/result/[submissionId]/page.metadata.test.ts`
- Modify: `src/app/result/[submissionId]/page.tsx`
- Reuse: `src/app/result/[submissionId]/get-result-share-source.ts`
- Reuse: `src/app/result/[submissionId]/result-share-view-model.ts`
- Reuse: `src/app/result/[submissionId]/result-metadata.ts`

- [ ] **Step 1: Write the failing page integration test first**

Add the test to `src/app/result/[submissionId]/page.metadata.test.ts` and exercise the exported page-level helper, for example:

```ts
test("page metadata helper returns OG metadata only for completed results", async () => {
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

  assert.equal(metadata.openGraph?.images?.length, 1);
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run: `node --import tsx --test src/app/result/[submissionId]/page.metadata.test.ts`
Expected: FAIL with missing page helper export.

- [ ] **Step 3: Implement `generateMetadata` through a testable helper**

```ts
export async function generateResultPageMetadata(args: GenerateResultPageMetadataInput) {
  const source = await args.loadShareSource(args.submissionId);
  const viewModel = createResultShareViewModel(source);

  return buildResultMetadata({
    baseUrl: args.getBaseUrl(),
    submissionId: args.submissionId,
    viewModel,
  });
}

export async function generateMetadata(props: ResultPageProps): Promise<Metadata> {
  const { submissionId } = await props.params;
  return generateResultPageMetadata({
    getBaseUrl: resolveBaseUrl,
    loadShareSource: getResultShareSource,
    submissionId,
  });
}
```

- [ ] **Step 4: Re-run the targeted test and verify it passes**

Run: `node --import tsx --test src/app/result/[submissionId]/page.metadata.test.ts`
Expected: PASS.

- [ ] **Step 5: Re-run the existing result page mapper tests for regression coverage**

Run: `node --import tsx --test src/app/result/submission-result-view-model.test.ts`
Expected: PASS.

### Task 4: Add the Takumi OG image route with cache and status gating

**Files:**
- Create: `src/app/result/[submissionId]/opengraph-image.tsx`
- Create: `src/app/result/[submissionId]/opengraph-image.test.tsx`
- Modify: `package.json`
- Create: `src/app/result/[submissionId]/og-image-fonts.ts`

- [ ] **Step 1: Write the failing route tests first**

```tsx
import assert from "node:assert/strict";
import test from "node:test";

import {
  createResultOgImageElement,
  createResultOgImageGetHandler,
} from "./opengraph-image";

test("returns a PNG response with cache headers for completed results", async () => {
  const GET = createResultOgImageGetHandler({
    getFont: async () => ({ data: new ArrayBuffer(8), name: "JetBrains Mono" }),
    getResultShareSource: async () => ({
      headline: "the linter filed a complaint",
      language: "typescript",
      lineCount: 7,
      score: 3.5,
      status: "completed",
      verdict: "rough",
    }),
    imageResponse: (element, options) =>
      new Response(String(element), {
        headers: {
          "cache-control": options.headers?.["Cache-Control"] ?? "",
          "content-type": "image/png",
        },
      }),
    notFound: () => {
      throw new Error("NEXT_NOT_FOUND");
    },
  });

  const response = await GET(new Request("https://devroast.dev/result/id/opengraph-image"), {
    params: Promise.resolve({ submissionId: "11111111-1111-4111-8111-111111111111" }),
  });

  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(
    response.headers.get("cache-control"),
    "public, max-age=3600, stale-while-revalidate=86400",
  );
});

test("throws notFound for unavailable share sources", async () => {
  const GET = createResultOgImageGetHandler({
    getFont: async () => ({ data: new ArrayBuffer(8), name: "JetBrains Mono" }),
    getResultShareSource: async () => ({ status: "unavailable" }),
    imageResponse: () => new Response(),
    notFound: () => {
      throw new Error("NEXT_NOT_FOUND");
    },
  });

  await assert.rejects(
    () =>
      GET(new Request("https://devroast.dev/result/id/opengraph-image"), {
        params: Promise.resolve({ submissionId: "11111111-1111-4111-8111-111111111111" }),
      }),
    /NEXT_NOT_FOUND/,
  );
});

test("og image element encodes truncation rules in style props", () => {
  const element = createResultOgImageElement({
    headline: "the linter filed a complaint",
    languageLabel: "lang: typescript",
    lineCountLabel: "7 lines",
    scoreLabel: "3.5",
    status: "completed",
    verdictLabel: "rough",
  });

  assert.match(JSON.stringify(element), /lineClamp/);
  assert.match(JSON.stringify(element), /ellipsis/);
});
```

- [ ] **Step 2: Run the route test and confirm it fails**

Run: `node --import tsx --test src/app/result/[submissionId]/opengraph-image.test.tsx`
Expected: FAIL because the route does not exist yet.

- [ ] **Step 3: Install Takumi and implement the minimal route**

```ts
import { ImageResponse } from "@takumi-rs/image-response";
import { notFound } from "next/navigation";

export const revalidate = 3600;
export const runtime = "nodejs";

export function createResultOgImageElement(viewModel: ResultShareViewModel) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0a", color: "#fafafa", fontFamily: "JetBrains Mono", padding: "48px" }}>
      <div style={{ color: "#10b981", fontSize: 24, marginBottom: 24 }}>{"> devroast"}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ color: "#f59e0b", fontSize: 160, fontWeight: 800 }}>{viewModel.scoreLabel}</div>
        <div style={{ color: "#4b5563", fontSize: 64 }}>/10</div>
      </div>
      <div style={{ color: "#ef4444", fontSize: 22, maxWidth: 760, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{viewModel.verdictLabel}</div>
      <div style={{ color: "#6b7280", fontSize: 18, marginTop: 18, maxWidth: 760, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{`${viewModel.languageLabel} · ${viewModel.lineCountLabel}`}</div>
      <div style={{ color: "#fafafa", fontSize: 34, marginTop: 52, maxWidth: 860, textAlign: "center", textWrap: "balance", overflow: "hidden", textOverflow: "ellipsis", lineClamp: 2 }}>{`"${viewModel.headline}"`}</div>
    </div>
  );
}

export function createResultOgImageGetHandler(deps: {
  getResultShareSource: typeof getResultShareSource;
  getFont: typeof getOgImageJetBrainsMonoFont;
  imageResponse: typeof ImageResponse;
  notFound: typeof notFound;
}) {
  return async function GET(_request: Request, context: RouteContext) {
    const { submissionId } = await context.params;
    const source = await deps.getResultShareSource(submissionId);
    const viewModel = createResultShareViewModel(source);

    if (viewModel.status !== "completed") {
      deps.notFound();
    }

    return new deps.imageResponse(createResultOgImageElement(viewModel), {
      width: 1200,
      height: 630,
      format: "png",
      fonts: [await deps.getFont()],
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  };
}

export const GET = createResultOgImageGetHandler({
  getFont: getOgImageJetBrainsMonoFont,
  getResultShareSource,
  imageResponse: ImageResponse,
  notFound,
});
```

The supporting font module should explicitly cache the font buffer in module scope:

```ts
let jetBrainsMonoFontPromise: Promise<Font> | undefined;

export function getOgImageJetBrainsMonoFont() {
  jetBrainsMonoFontPromise ??= loadJetBrainsMonoFontOnce();
  return jetBrainsMonoFontPromise;
}
```

- [ ] **Step 4: Re-run the route test and make it pass**

Run: `node --import tsx --test src/app/result/[submissionId]/opengraph-image.test.tsx`
Expected: PASS.

- [ ] **Step 5: Run all new share-feature tests together**

Run: `node --import tsx --test src/app/result/[submissionId]/get-result-share-source.test.ts src/app/result/[submissionId]/result-share-view-model.test.ts src/app/result/[submissionId]/result-metadata.test.ts src/app/result/[submissionId]/page.metadata.test.ts src/app/result/[submissionId]/opengraph-image.test.tsx`
Expected: PASS.

### Task 5: Final verification for the feature slice

**Files:**
- Modify as needed from previous tasks only.

- [ ] **Step 1: Run format on the repo**

Run: `npm run format`
Expected: formatting completes successfully.

- [ ] **Step 2: Run lint on the repo**

Run: `npm run lint`
Expected: no diagnostics.

- [ ] **Step 3: Run build on the repo**

Run: `npm run build`
Expected: successful production build, including the new OG route.

- [ ] **Step 4: Smoke-check the key tests again**

Run: `node --import tsx --test src/app/result/[submissionId]/get-result-share-source.test.ts src/app/result/[submissionId]/result-share-view-model.test.ts src/app/result/[submissionId]/result-metadata.test.ts src/app/result/[submissionId]/page.metadata.test.ts src/app/result/[submissionId]/opengraph-image.test.tsx src/app/result/submission-result-view-model.test.ts`
Expected: PASS.

- [ ] **Step 5: Stop and ask before any commit**

Do not run `git commit`. Report the changed files, validation results, and any follow-up needed to the user first.
