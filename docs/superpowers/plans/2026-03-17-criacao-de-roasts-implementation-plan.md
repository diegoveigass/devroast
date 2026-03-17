# Roast Creation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement end-to-end roast creation with synchronous AI analysis, persisted results, and real result rendering from the existing DevRoast home flow.

**Architecture:** Keep `tRPC` as the only backend boundary for this flow. Add a focused roast domain layer in `src/lib/roasts` for provider integration, prompt building, and output normalization. Keep DB access reusable in `src/db/queries/roasts.ts`, and keep UI changes isolated to home submit wiring and result view states.

**Tech Stack:** Next.js App Router, tRPC v11, React Query, Drizzle ORM, Zod, OpenAI Node SDK (`openai`), Node test runner (`node --import tsx --test`).

---

## Chunk 1: Synchronous roast creation MVP

## File Structure and Responsibilities

- Create: `src/lib/roasts/contracts.ts`
  - Zod schemas and TypeScript types for normalized roast output and domain error codes.
- Create: `src/lib/roasts/prompt.ts`
  - Prompt builders that keep technical rubric fixed and only vary tone by `roastMode`.
- Create: `src/lib/roasts/providers/openai-provider.ts`
  - OpenAI SDK call with timeout and error mapping to domain error codes.
- Create: `src/lib/roasts/analysis.ts`
  - Orchestrates `prompt -> provider -> normalize` and returns normalized roast payload.
- Create: `src/lib/roasts/normalize-roast-output.ts`
  - Pure parser/normalizer with domain error mapping for invalid provider payloads.
- Create: `src/lib/roasts/normalize-roast-output.test.ts`
  - Unit tests for normalization and error handling edge cases.
- Modify: `package.json`
  - Add scripts for unit tests and add `openai` dependency.
- Modify: `.env.example`
  - Add `OPENAI_API_KEY` and `OPENAI_MODEL`.
- Modify: `src/db/queries/roasts.ts`
  - Add create/update/read helpers needed by `roasts` router.
- Create: `src/trpc/routers/roasts.ts`
  - `createSubmission` mutation and `getBySubmissionId` query.
- Create: `src/trpc/routers/roasts.test.ts`
  - Procedure tests for success/failure and domain error codes.
- Modify: `src/trpc/routers/_app.ts`
  - Register `roasts` router.
- Modify: `src/app/_components/home-page-client.tsx`
  - Own submit flow state (loading/error) and call `roasts.createSubmission`.
- Modify: `src/app/_components/home-hero.tsx`
  - Bubble `roastMode` and submit event to parent.
- Modify: `src/app/_components/home-code-editor.tsx`
  - Bubble final language (`manual > detected`) to parent.
- Create: `src/app/_components/home-submit-payload.ts`
  - Pure payload builder for submit, including language precedence and mode mapping.
- Create: `src/app/_components/home-submit-payload.test.ts`
  - Unit tests for payload and precedence rules.
- Create: `src/app/_components/home-submit-error-message.ts`
  - Maps domain error codes to inline UX copy for retry guidance.
- Create: `src/app/_components/home-submit-error-message.test.ts`
  - Unit tests for deterministic error-copy behavior.
- Modify: `src/app/result/[submissionId]/page.tsx`
  - Query tRPC server-side and pass status-aware data to view.
- Modify: `src/app/result/[submissionId]/_components/submission-result-view.tsx`
  - Replace static fixture with props and render `processing/failed/completed` states.
- Create: `src/app/result/[submissionId]/_lib/map-result-view-model.ts`
  - Pure status mapper from query result to render model.
- Create: `src/app/result/[submissionId]/_lib/map-result-view-model.test.ts`
  - Unit tests for `processing`, `failed`, `completed`, and `not_found` mapping behavior.
- Modify: `README.md`
  - Add provider env variables and local smoke-test steps.

### Task 1: Add roast domain contracts and provider adapter

**Files:**
- Create: `src/lib/roasts/contracts.ts`
- Create: `src/lib/roasts/prompt.ts`
- Create: `src/lib/roasts/providers/openai-provider.ts`
- Create: `src/lib/roasts/analysis.ts`
- Create: `src/lib/roasts/normalize-roast-output.ts`
- Modify: `.env.example`
- Modify: `package.json`
- Test: `src/lib/roasts/normalize-roast-output.test.ts`

- [ ] **Step 1: Write failing normalization tests first**

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeRoastOutput } from "./normalize-roast-output";
import { buildRoastPrompt } from "./prompt";
import { resolveOpenAIModel } from "./providers/openai-provider";

describe("normalize roast output", () => {
  it("accepts valid provider payload", () => {
    const validProviderPayload = {
      score: 4.2,
      verdict: "rough",
      headline: "needs polish",
      summary: "clear but noisy",
      issues: [
        {
          severity: "warning",
          title: "verbose flow",
          description: "too many branches",
          position: 1,
        },
      ],
      diffLines: [
        { lineType: "context", content: "function sum() {", position: 1 },
        { lineType: "added", content: "  return values.reduce(...)", position: 2 },
      ],
    };

    const normalized = normalizeRoastOutput(validProviderPayload);
    assert.equal(normalized.verdict, "rough");
    assert.equal(normalized.issues.length > 0, true);
  });

  it("throws INVALID_PROVIDER_OUTPUT for malformed payload", () => {
    assert.throws(
      () => normalizeRoastOutput({ score: "oops" }),
      /INVALID_PROVIDER_OUTPUT/,
    );
  });
});

describe("prompt invariants", () => {
  it("keeps technical rubric constant and changes only tone", () => {
    const honest = buildRoastPrompt({ roastMode: "honest", code: "const x=1", language: "ts" });
    const fullRoast = buildRoastPrompt({ roastMode: "full_roast", code: "const x=1", language: "ts" });

    assert.match(honest.rubric, /technical rubric/i);
    assert.equal(honest.rubric, fullRoast.rubric);
    assert.notEqual(honest.tone, fullRoast.tone);
  });
});

describe("openai model resolution", () => {
  it("uses OPENAI_MODEL when present", () => {
    assert.equal(resolveOpenAIModel("gpt-4o-mini"), "gpt-4o-mini");
  });

  it("uses fallback model when OPENAI_MODEL is empty", () => {
    assert.equal(resolveOpenAIModel(""), "gpt-4o-mini");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/roasts/normalize-roast-output.test.ts`
Expected: FAIL with assertion failure.

- [ ] **Step 3: Add contracts, prompt builder, and OpenAI adapter**

```ts
const issueSchema = z.object({
  severity: z.enum(["critical", "warning", "good"]),
  title: z.string().min(1),
  description: z.string().min(1),
  position: z.number().int().min(1),
});

const diffLineSchema = z.object({
  lineType: z.enum(["context", "removed", "added"]),
  content: z.string().min(1),
  position: z.number().int().min(1),
});

export const roastOutputSchema = z.object({
  score: z.number().min(0).max(10),
  verdict: z.enum(["needs_serious_help", "rough", "salvageable", "solid"]),
  headline: z.string().min(1),
  summary: z.string().min(1),
  issues: z.array(issueSchema).min(1),
  diffLines: z.array(diffLineSchema).min(1),
});
```

```ts
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 20_000,
});

const model = resolveOpenAIModel(process.env.OPENAI_MODEL);
```

- [ ] **Step 4: Implement analysis orchestration and make tests pass**

Run: `node --import tsx --test src/lib/roasts/normalize-roast-output.test.ts`
Expected: PASS.

- [ ] **Step 5: Verify formatting/lint for touched files**

Run: `npm run format && npm run lint`
Expected: Commands finish without errors.

- [ ] **Step 6: Commit Task 1**

```bash
git add package.json package-lock.json .env.example src/lib/roasts
git commit -m "feat: add roast analysis domain layer and openai adapter"
```

### Task 2: Implement tRPC roast procedures and DB orchestration

**Files:**
- Modify: `src/db/queries/roasts.ts`
- Create: `src/trpc/routers/roasts.ts`
- Modify: `src/trpc/routers/_app.ts`
- Test: `src/trpc/routers/roasts.test.ts`

- [ ] **Step 1: Write failing router tests for success and failure flows**

```ts
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

it("returns completed payload when provider succeeds", async () => {
  const result = await caller.roasts.createSubmission({
    code: "const x = 1;",
    roastMode: "full_roast",
    language: "typescript",
  });

  assert.equal(result.status, "completed");
  assert.match(result.submissionId, UUID_REGEX);
});

it("persists and returns manual language override", async () => {
  const result = await caller.roasts.createSubmission({
    code: "print('x')",
    roastMode: "honest",
    language: "python",
  });

  const loaded = await caller.roasts.getBySubmissionId({
    submissionId: result.submissionId,
  });

  if ("status" in loaded && loaded.status === "completed") {
    assert.equal(loaded.language, "python");
  }
});

it("returns processing state for pending analysis", async () => {
  const result = await caller.roasts.getBySubmissionId({
    submissionId: processingSubmissionId,
  });
  assert.deepEqual(result, { status: "processing" });
});

it("returns failed state with processingError", async () => {
  const result = await caller.roasts.getBySubmissionId({
    submissionId: failedSubmissionId,
  });
  assert.equal("status" in result ? result.status : "", "failed");
});

it("returns typed RESULT_NOT_FOUND payload when submission is missing", async () => {
  const result = await caller.roasts.getBySubmissionId({
    submissionId: missingSubmissionId,
  });
  assert.deepEqual(result, {
    code: "RESULT_NOT_FOUND",
    message: "result not found",
  });
});

it("marks submission failed when provider throws", async () => {
  await assert.rejects(
    caller.roasts.createSubmission({
      code: "const y = 2;",
      roastMode: "honest",
      language: "typescript",
    }),
    (error: { code?: string }) => error.code === "PROVIDER_UNAVAILABLE",
  );
});

it("maps provider timeout to PROVIDER_TIMEOUT", async () => {
  mockAnalyzeRoast.mockRejectedValueOnce(new Error("timeout"));

  await assert.rejects(createSubmissionCall(), (error: { code?: string }) => {
    return error.code === "PROVIDER_TIMEOUT";
  });
});

it("maps invalid provider payload to INVALID_PROVIDER_OUTPUT", async () => {
  mockAnalyzeRoast.mockRejectedValueOnce(new Error("invalid provider payload"));

  await assert.rejects(createSubmissionCall(), (error: { code?: string }) => {
    return error.code === "INVALID_PROVIDER_OUTPUT";
  });
});

it("maps persistence failure to PERSISTENCE_ERROR", async () => {
  mockPersistCompletedRoast.mockRejectedValueOnce(new Error("insert failed"));

  await assert.rejects(createSubmissionCall(), (error: { code?: string }) => {
    return error.code === "PERSISTENCE_ERROR";
  });
});

it("persists failed status and sanitized processingError on provider failure", async () => {
  mockAnalyzeRoast.mockRejectedValueOnce(
    new Error("OPENAI_API_KEY=secret123 provider unavailable"),
  );

  await assert.rejects(createSubmissionCall());
  assert.equal(mockMarkSubmissionFailed.mock.calls.length, 1);
  assert.equal(
    String(mockMarkSubmissionFailed.mock.calls[0][1]).includes("secret123"),
    false,
  );
});
```

- [ ] **Step 2: Run router tests and confirm failure**

Run: `node --import tsx --test src/trpc/routers/roasts.test.ts`
Expected: FAIL because procedures/helpers do not exist yet.

- [ ] **Step 3: Add DB helpers and router procedures**

```ts
const createSubmissionInputSchema = z.object({
  code: z.string().min(1).max(2000),
  roastMode: z.enum(["honest", "full_roast"]),
  language: z.string().min(1),
  source: z.literal("web").optional().default("web"),
});

const createSubmissionOutputSchema = z.object({
  submissionId: z.string().uuid(),
  publicId: z.string().min(1),
  status: z.literal("completed"),
});

export const roastsRouter = router({
  createSubmission: publicProcedure
    .input(createSubmissionInputSchema)
    .output(createSubmissionOutputSchema)
    .mutation(async ({ input }) => {
    const submission = await createSubmissionRecord({ ...input, status: "processing" });

    try {
      const roast = await analyzeRoast(input);
      await db.transaction(async (tx) => {
        await persistCompletedRoast({ tx, submissionId: submission.id, roast });
        await markSubmissionCompleted(tx, submission.id);
      });
      return { submissionId: submission.id, publicId: submission.publicId, status: "completed" };
    } catch (error) {
      await markSubmissionFailed(submission.id, sanitizeErrorMessage(error));
      throw toDomainTRPCError(error, submission.id); // include { code, message, submissionId? }
    }
  }),
  getBySubmissionId: publicProcedure
    .input(z.object({ submissionId: z.string().uuid() }))
    .query(async ({ input }) => {
    const roast = await getRoastBySubmissionId(input.submissionId);
    if (!roast) {
      return { code: "RESULT_NOT_FOUND", message: "result not found" };
    }
    if (roast.status === "processing") return { status: "processing" };
    if (roast.status === "failed") return { status: "failed", processingError: roast.processingError ?? "analysis failed" };
    return mapCompletedRoast(roast);
  }),
});
```

- [ ] **Step 4: Make tests pass and verify status transitions**

Run: `node --import tsx --test src/trpc/routers/roasts.test.ts`
Expected: PASS with success, provider-failure, and `getBySubmissionId` states (`processing`, `failed`, `completed`, `RESULT_NOT_FOUND`) covered.

- [ ] **Step 5: Add rollback safety test for partial-write prevention**

Run: `node --import tsx --test src/trpc/routers/roasts.test.ts --test-name-pattern "rollback"`
Expected: PASS with assertion that failed transaction leaves no partial `roast_results`, `roast_issues`, or `roast_diff_lines` rows.

- [ ] **Step 6: Verify typed domain error payload shape**

Run: `node --import tsx --test src/trpc/routers/roasts.test.ts --test-name-pattern "maps"`
Expected: PASS with assertions for all required codes (`PROVIDER_TIMEOUT`, `PROVIDER_UNAVAILABLE`, `INVALID_PROVIDER_OUTPUT`, `PERSISTENCE_ERROR`) and payload shape (`code`, `message`, `submissionId` required after submission creation, optional only for pre-create failures).

- [ ] **Step 7: Run lints for backend boundary**

Run: `npm run format && npm run lint`
Expected: Commands finish without errors.

- [ ] **Step 8: Commit Task 2**

```bash
git add src/db/queries/roasts.ts src/trpc/routers/roasts.ts src/trpc/routers/_app.ts src/trpc/routers/roasts.test.ts
git commit -m "feat: add tRPC roast create and result query procedures"
```

### Task 3: Wire home submit flow to tRPC mutation

**Files:**
- Modify: `src/app/_components/home-page-client.tsx`
- Modify: `src/app/_components/home-hero.tsx`
- Modify: `src/app/_components/home-code-editor.tsx`
- Create: `src/app/_components/home-submit-payload.ts`
- Test: `src/app/_components/home-submit-payload.test.ts`
- Create: `src/app/_components/home-submit-error-message.ts`
- Test: `src/app/_components/home-submit-error-message.test.ts`

- [ ] **Step 1: Write failing unit tests for submit payload precedence**

```ts
it("prefers manual language over detected language", () => {
  const payload = buildSubmitPayload({
    code: "print('hi')",
    roastModeEnabled: true,
    selectedLanguage: "python",
    detectedLanguage: "typescript",
  });

  assert.equal(payload.language, "python");
  assert.equal(payload.roastMode, "full_roast");
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --import tsx --test src/app/_components/home-submit-payload.test.ts`
Expected: FAIL (missing `buildSubmitPayload` implementation and expected roast mode/language precedence behavior).

- [ ] **Step 3: Lift roast mode and final language state to submit owner (`HomePageClient`)**

- ensure payload uses manual language when selected;
- ensure payload uses detected language only when manual is not selected.

- [ ] **Step 4: Wire `createSubmission` mutation call with pending state**

```ts
const createSubmission = useMutation(trpc.roasts.createSubmission.mutationOptions());
```

- [ ] **Step 5: Handle success and failure UX**

- success: navigate to `/result/${submissionId}`
- failure: show inline error and keep user on home with retry CTA

- [ ] **Step 6: Quick verification for Step 5 UX wiring**

Run: `npm run dev`
Expected:
- while mutation is pending, submit action is disabled or visibly loading;
- on known failure code, inline retry guidance is visible without route change.

- [ ] **Step 7: Write failing unit tests for submit error message mapping**

```ts
it("maps PROVIDER_TIMEOUT to retry-friendly copy", () => {
  const message = getSubmitErrorMessage({ code: "PROVIDER_TIMEOUT" });
  assert.match(message, /try again/i);
});
```

- [ ] **Step 8: Verify submit UX behavior manually**

Run: `npm run dev`
Expected:
- with valid `OPENAI_API_KEY`, submit redirects to `/result/[submissionId]`;
- with invalid `OPENAI_API_KEY=invalid`, submit stays on home and shows inline retry feedback.

- [ ] **Step 9: Re-run tests and static checks**

Run: `node --import tsx --test src/app/_components/home-submit-payload.test.ts src/app/_components/home-submit-error-message.test.ts && npm run format && npm run lint`
Expected: PASS + no lint/format errors.

- [ ] **Step 10: Commit Task 3**

```bash
git add src/app/_components/home-page-client.tsx src/app/_components/home-hero.tsx src/app/_components/home-code-editor.tsx src/app/_components/home-submit-payload.ts src/app/_components/home-submit-payload.test.ts src/app/_components/home-submit-error-message.ts src/app/_components/home-submit-error-message.test.ts
git commit -m "feat: connect home submit flow to roast creation mutation"
```

### Task 4: Replace static result screen with real status-aware rendering

**Files:**
- Modify: `src/app/result/[submissionId]/page.tsx`
- Modify: `src/app/result/[submissionId]/_components/submission-result-view.tsx`
- Create: `src/app/result/[submissionId]/_lib/map-result-view-model.ts`
- Test: `src/app/result/[submissionId]/_lib/map-result-view-model.test.ts`

- [ ] **Step 1: Write failing mapper tests for `processing`, `failed`, and `completed`**

```ts
it("maps failed query result to failed view model", () => {
  const vm = mapResultViewModel({ status: "failed", processingError: "provider unavailable" });
  assert.equal(vm.state, "failed");
  assert.match(vm.message, /provider unavailable/i);
});

it("maps completed query result to completed state", () => {
  const vm = mapResultViewModel(completedFixture);
  assert.equal(vm.state, "completed");
});

it("maps not found error to not_found state", () => {
  const vm = mapResultViewModel({ code: "RESULT_NOT_FOUND", message: "result not found" });
  assert.equal(vm.state, "not_found");
});
```

- [ ] **Step 2: Run the tests and confirm failure**

Run: `node --import tsx --test src/app/result/[submissionId]/_lib/map-result-view-model.test.ts`
Expected: FAIL due to static fixture implementation.

- [ ] **Step 3: Implement server query + prop-driven result view**

```ts
const queryClient = getQueryClient();
const data = await queryClient.fetchQuery(
  trpc.roasts.getBySubmissionId.queryOptions({ submissionId }),
);
```

- [ ] **Step 4: Keep existing visual language, remove functional share behavior**

- preserve current layout components;
- ensure share CTA stays presentational only (no new share flow).

- [ ] **Step 5: Re-run tests and checks**

Run: `node --import tsx --test src/app/result/[submissionId]/_lib/map-result-view-model.test.ts && npm run format && npm run lint`
Expected: PASS + no lint/format errors.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/app/result/[submissionId]/page.tsx src/app/result/[submissionId]/_components/submission-result-view.tsx src/app/result/[submissionId]/_lib/map-result-view-model.ts src/app/result/[submissionId]/_lib/map-result-view-model.test.ts
git commit -m "feat: render roast result page from real submission data"
```

### Task 5: End-to-end verification and production readiness checks

**Files:**
- Modify: `README.md` (provider env notes and local roast verification)

- [ ] **Step 1: Update README setup section for provider configuration**

Add explicit docs for:
- required env vars: `OPENAI_API_KEY`, `OPENAI_MODEL`;
- where roast submission starts in the UI;
- how to exercise success and failure flows locally.

- [ ] **Step 2: Run targeted roast tests first**

Run: `node --import tsx --test src/lib/roasts/normalize-roast-output.test.ts src/trpc/routers/roasts.test.ts src/app/_components/home-submit-payload.test.ts src/app/result/[submissionId]/_lib/map-result-view-model.test.ts`
Expected: PASS.

- [ ] **Step 3: Run full project quality gates**

Run: `npm run format && npm run lint && npm run build`
Expected: all commands pass.

- [ ] **Step 4: Smoke test key product paths locally**

Run: `npm run dev`
Expected manual checks:
- home submit creates roast and redirects to result;
- failed provider path keeps user on home and shows inline retry feedback;
- direct `/result/[submissionId]` for failed submission renders failed state;
- leaderboard still loads completed submissions.

- [ ] **Step 5: Commit Task 5**

```bash
git add README.md
git commit -m "docs: document roast provider env and local verification"
```

## Notes for Execution

- Keep `tRPC` routers thin; move prompt/provider specifics to `src/lib/roasts`.
- Use `Promise.all([...])` for independent DB reads where applicable.
- Do not add share feature behavior in this plan.
- Keep result page server-first; only use client behavior where interaction is required.
