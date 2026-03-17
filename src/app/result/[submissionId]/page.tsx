import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { getQueryClient, trpc } from "@/trpc/server";

import {
  createSubmissionResultViewModel,
  type SubmissionResultViewModel,
} from "../submission-result-view-model";
import { SubmissionResultView } from "./_components/submission-result-view";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ResultPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Roast Result | DevRoast",
  description: "Roast result view keyed by a submission UUID.",
};

const getSubmissionResult = cache(async (submissionId: string) => {
  const queryClient = getQueryClient();
  const result = await queryClient.fetchQuery(
    trpc.roasts.getBySubmissionId.queryOptions({ submissionId }),
  );

  return createSubmissionResultViewModel(
    result,
  ) satisfies SubmissionResultViewModel;
});

export default async function ResultPage(props: ResultPageProps) {
  const { submissionId } = await props.params;

  if (!UUID_REGEX.test(submissionId)) {
    notFound();
  }

  const result = await getSubmissionResult(submissionId);

  return <SubmissionResultView result={result} />;
}
