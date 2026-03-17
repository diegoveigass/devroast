import type { Metadata } from "next";

import type { ResultShareViewModel } from "./result-share-view-model";

type BuildResultMetadataInput = {
  baseUrl: string;
  submissionId: string;
  viewModel: ResultShareViewModel;
};

const FALLBACK_TITLE = "Roast Result | DevRoast";
const FALLBACK_DESCRIPTION = "Roast result view keyed by a submission UUID.";

export function buildResultMetadata({
  baseUrl,
  submissionId,
  viewModel,
}: BuildResultMetadataInput): Metadata {
  if (viewModel.status !== "completed") {
    return {
      description: FALLBACK_DESCRIPTION,
      title: FALLBACK_TITLE,
    };
  }

  const title = `DevRoast | ${viewModel.verdictLabel} ${viewModel.scoreLabel}/10`;
  const description = `${viewModel.headline} ${viewModel.languageLabel} - ${viewModel.lineCountLabel}`;
  const imageUrl = new URL(
    `/result/${submissionId}/opengraph-image`,
    baseUrl,
  ).toString();

  return {
    description,
    openGraph: {
      description,
      images: [{ height: 630, url: imageUrl, width: 1200 }],
      title,
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [imageUrl],
      title,
    },
  };
}
