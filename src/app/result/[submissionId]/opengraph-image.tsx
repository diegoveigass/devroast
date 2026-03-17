import {
  ImageResponse,
  type ImageResponseOptions,
} from "@takumi-rs/image-response";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import {
  getResultShareSource,
  type ResultShareSource,
} from "./get-result-share-source";
import { getOgImageJetBrainsMonoFonts } from "./og-image-fonts";
import {
  createResultShareViewModel,
  type ResultShareViewModel,
} from "./result-share-view-model";

export const revalidate = 3600;
export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type ResultOgImageContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

type ResultOgImageFont = Awaited<
  ReturnType<typeof getOgImageJetBrainsMonoFonts>
>;

type CreateResultOgImageHandlerDependencies = {
  getFonts: () => Promise<ResultOgImageFont>;
  getResultShareSource: (submissionId: string) => Promise<ResultShareSource>;
  imageResponse: (
    element: ReactElement,
    options: ImageResponseOptions,
  ) => Response;
  notFound: () => never;
};

function createTechnicalMetadataLabel(
  viewModel: Extract<ResultShareViewModel, { status: "completed" }>,
) {
  return `${viewModel.languageLabel} - ${viewModel.lineCountLabel}`;
}

function createImageResponse(
  element: ReactElement,
  options: ImageResponseOptions,
) {
  return new ImageResponse(element, options);
}

export function createResultOgImageElement(
  viewModel: Extract<ResultShareViewModel, { status: "completed" }>,
) {
  return (
    <div
      style={{
        alignItems: "stretch",
        background:
          "linear-gradient(135deg, #050505 0%, #0a0a0a 55%, #101010 100%)",
        color: "#fafafa",
        display: "flex",
        flexDirection: "column",
        fontFamily: "JetBrains Mono",
        height: "100%",
        justifyContent: "space-between",
        padding: "48px 56px",
        width: "100%",
      }}
    >
      <div
        style={{
          color: "#10b981",
          display: "flex",
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        {"> devroast"}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <div
          style={{
            alignItems: "baseline",
            display: "flex",
            gap: 18,
          }}
        >
          <div
            style={{
              color: "#f59e0b",
              display: "flex",
              fontSize: 168,
              fontWeight: 800,
              letterSpacing: -8,
              lineHeight: 0.9,
            }}
          >
            {viewModel.scoreLabel}
          </div>
          <div
            style={{
              color: "#4b5563",
              display: "flex",
              fontSize: 60,
              fontWeight: 700,
            }}
          >
            /10
          </div>
        </div>

        <div
          style={{
            color: "#ef4444",
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {viewModel.verdictLabel}
        </div>

        <div
          style={{
            color: "#6b7280",
            display: "flex",
            fontSize: 22,
            fontWeight: 500,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {createTechnicalMetadataLabel(viewModel)}
        </div>
      </div>

      <div
        style={{
          alignSelf: "center",
          color: "#fafafa",
          fontSize: 40,
          fontWeight: 700,
          lineClamp: 2,
          lineHeight: 1.2,
          maxWidth: 920,
          overflow: "hidden",
          textAlign: "center",
          textOverflow: "ellipsis",
        }}
      >
        {`"${viewModel.headline}"`}
      </div>
    </div>
  );
}

export function createResultOgImageHandler(
  deps: CreateResultOgImageHandlerDependencies,
) {
  return async function OpengraphImage(context: ResultOgImageContext) {
    const { submissionId } = await context.params;
    const source = await deps.getResultShareSource(submissionId);
    const viewModel = createResultShareViewModel(source);

    if (viewModel.status !== "completed") {
      return deps.notFound();
    }

    return deps.imageResponse(createResultOgImageElement(viewModel), {
      fonts: await deps.getFonts(),
      format: "png",
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
      ...size,
    });
  };
}

const opengraphImage = createResultOgImageHandler({
  getFonts: getOgImageJetBrainsMonoFonts,
  getResultShareSource,
  imageResponse: createImageResponse,
  notFound,
});

export default opengraphImage;
