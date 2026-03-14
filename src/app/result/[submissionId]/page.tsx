import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  description: "Static roast result view keyed by a submission UUID.",
};

export default async function ResultPage(props: ResultPageProps) {
  const { submissionId } = await props.params;

  if (!UUID_REGEX.test(submissionId)) {
    notFound();
  }

  return <SubmissionResultView />;
}
