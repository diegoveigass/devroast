import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubmissionResultView } from "./_components/submission-result-view";
import { getResultQuery } from "./_lib/get-result-query";
import { mapResultViewModel } from "./_lib/map-result-view-model";
import { resolveResultRouteParams } from "./_lib/result-route";

type ResultPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export const metadata: Metadata = {
  title: "Roast Result | DevRoast",
  description: "Static roast result view keyed by a submission UUID.",
};

export default async function ResultPage(props: ResultPageProps) {
  const route = resolveResultRouteParams(await props.params);

  if (route.kind === "invalid") {
    notFound();
  }

  const result = await getResultQuery(route.submissionId);

  return <SubmissionResultView result={mapResultViewModel(result)} />;
}
