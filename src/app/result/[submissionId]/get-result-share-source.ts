import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type SubmissionResultQuery = RouterOutputs["roasts"]["getBySubmissionId"];
type CompletedResult = Extract<SubmissionResultQuery, { status: "completed" }>;

export type ResultShareSource =
  | (Pick<CompletedResult, "score" | "status" | "verdict"> & {
      headline: CompletedResult["headline"] | null;
      language: CompletedResult["language"] | null;
      lineCount: CompletedResult["lineCount"] | null;
    })
  | { status: "unavailable" };

export function toResultShareSource(
  result: SubmissionResultQuery,
): ResultShareSource {
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

export const getResultShareSource = createGetResultShareSource(
  async (submissionId) => {
    const { getQueryClient, trpc } = await import("@/trpc/server");
    const queryClient = getQueryClient();

    return queryClient.fetchQuery(
      trpc.roasts.getBySubmissionId.queryOptions({ submissionId }),
    );
  },
);
