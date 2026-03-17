import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

type ResultOutput =
  inferRouterOutputs<AppRouter>["roasts"]["getBySubmissionId"];

export async function getResultQuery(
  submissionId: string,
): Promise<ResultOutput> {
  const [{ getQueryClient, trpc }] = await Promise.all([
    import("@/trpc/server"),
  ]);

  return getQueryClient().fetchQuery(
    trpc.roasts.getBySubmissionId.queryOptions({
      submissionId,
    }),
  );
}
