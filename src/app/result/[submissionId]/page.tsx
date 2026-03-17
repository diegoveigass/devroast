import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";

import { getBaseUrl } from "@/lib/env/get-base-url";

import {
  createSubmissionResultViewModel,
  type SubmissionResultViewModel,
} from "../submission-result-view-model";
import { SubmissionResultView } from "./_components/submission-result-view";
import {
  getResultShareSource,
  type ResultShareSource,
} from "./get-result-share-source";
import { buildResultMetadata } from "./result-metadata";
import { createResultShareViewModel } from "./result-share-view-model";

const submissionIdSchema = z.uuid();

type ResultPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

type GenerateResultPageMetadataInput = {
  getBaseUrl: () => string;
  loadShareSource: (submissionId: string) => Promise<ResultShareSource>;
  notFound?: () => never;
  submissionId: string;
};

function isValidSubmissionId(submissionId: string) {
  return submissionIdSchema.safeParse(submissionId).success;
}

const getSubmissionResult = cache(async (submissionId: string) => {
  const { getQueryClient, trpc } = await import("@/trpc/server");
  const queryClient = getQueryClient();
  const result = await queryClient.fetchQuery(
    trpc.roasts.getBySubmissionId.queryOptions({ submissionId }),
  );

  return createSubmissionResultViewModel(
    result,
  ) satisfies SubmissionResultViewModel;
});

export async function generateResultPageMetadata({
  getBaseUrl: resolveBaseUrl,
  loadShareSource,
  notFound: handleNotFound,
  submissionId,
}: GenerateResultPageMetadataInput): Promise<Metadata> {
  if (!isValidSubmissionId(submissionId)) {
    handleNotFound?.();
    return buildResultMetadata({
      baseUrl: resolveBaseUrl(),
      submissionId,
      viewModel: { status: "unavailable" },
    });
  }

  const source = await loadShareSource(submissionId);
  const viewModel = createResultShareViewModel(source);

  return buildResultMetadata({
    baseUrl: resolveBaseUrl(),
    submissionId,
    viewModel,
  });
}

export async function generateMetadata(
  props: ResultPageProps,
): Promise<Metadata> {
  const { submissionId } = await props.params;

  return generateResultPageMetadata({
    getBaseUrl,
    loadShareSource: getResultShareSource,
    notFound,
    submissionId,
  });
}

export default async function ResultPage(props: ResultPageProps) {
  const { submissionId } = await props.params;

  if (!isValidSubmissionId(submissionId)) {
    notFound();
  }

  const result = await getSubmissionResult(submissionId);

  return <SubmissionResultView result={result} />;
}
