import assert from "node:assert/strict";
import test from "node:test";
import type { ImageResponseOptions } from "@takumi-rs/image-response";
import type { ReactElement, ReactNode } from "react";
import {
  buildOgImageJetBrainsMonoStylesheetUrl,
  createOgImageJetBrainsMonoFontsLoader,
} from "./og-image-fonts";
import * as opengraphImageModule from "./opengraph-image";

const { createResultOgImageElement, createResultOgImageHandler } =
  opengraphImageModule;

type TestFont = {
  data: ArrayBuffer;
  name: string;
  style: "normal";
  weight: 500 | 700 | 800;
};

function toChildArray(children: ReactNode) {
  return (Array.isArray(children) ? children : [children]).filter(Boolean);
}

function asElement(node: ReactNode) {
  return node as ReactElement<{
    children?: ReactNode;
    style?: Record<string, unknown>;
  }>;
}

test("module follows Next metadata file export conventions", () => {
  assert.equal(typeof opengraphImageModule.default, "function");
  assert.equal("GET" in opengraphImageModule, false);
});

test("returns a PNG response with cache headers and explicit font weights for completed results", async () => {
  let capturedElement: ReactElement | undefined;
  let capturedOptions: ImageResponseOptions | undefined;

  const renderImage = createResultOgImageHandler({
    getFonts: async () => {
      return [
        {
          data: new ArrayBuffer(8),
          name: "JetBrains Mono",
          style: "normal",
          weight: 500,
        },
        {
          data: new ArrayBuffer(8),
          name: "JetBrains Mono",
          style: "normal",
          weight: 700,
        },
        {
          data: new ArrayBuffer(8),
          name: "JetBrains Mono",
          style: "normal",
          weight: 800,
        },
      ];
    },
    getResultShareSource: async () => ({
      headline: "the linter filed a complaint",
      language: "typescript",
      lineCount: 7,
      score: 3.5,
      status: "completed",
      verdict: "rough",
    }),
    imageResponse: (element: ReactElement, options: ImageResponseOptions) => {
      capturedElement = element;
      capturedOptions = options;

      return new Response(null, {
        headers: {
          "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
          "content-type": "image/png",
        },
      });
    },
    notFound: () => {
      throw new Error("NEXT_NOT_FOUND");
    },
  });

  const response = await renderImage({
    params: Promise.resolve({
      submissionId: "11111111-1111-4111-8111-111111111111",
    }),
  });

  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(
    response.headers.get("cache-control"),
    "public, max-age=3600, stale-while-revalidate=86400",
  );
  assert.equal(capturedOptions?.format, "png");
  assert.equal(capturedOptions?.width, 1200);
  assert.equal(capturedOptions?.height, 630);
  assert.deepEqual(
    (
      capturedOptions as
        | (ImageResponseOptions & { fonts?: TestFont[] })
        | undefined
    )?.fonts?.map((font) => ({
      name: font.name,
      weight: font.weight,
    })),
    [
      { name: "JetBrains Mono", weight: 500 },
      { name: "JetBrains Mono", weight: 700 },
      { name: "JetBrains Mono", weight: 800 },
    ],
  );

  const root = asElement(capturedElement);
  const rootChildren = toChildArray(root.props.children);
  const brand = asElement(rootChildren[0]);
  const scoreSection = asElement(rootChildren[1]);
  const headline = asElement(rootChildren[2]);
  const scoreSectionChildren = toChildArray(scoreSection.props.children);
  const scoreRow = asElement(scoreSectionChildren[0]);
  const verdict = asElement(scoreSectionChildren[1]);
  const metadata = asElement(scoreSectionChildren[2]);
  const scoreRowChildren = toChildArray(scoreRow.props.children);

  assert.equal(brand.props.children, "> devroast");
  assert.equal(asElement(scoreRowChildren[0]).props.children, "3.5");
  assert.equal(asElement(scoreRowChildren[1]).props.children, "/10");
  assert.equal(verdict.props.children, "rough");
  assert.equal(metadata.props.children, "lang: typescript - 7 lines");
  assert.equal(headline.props.children, '"the linter filed a complaint"');
});

test("throws notFound for unavailable share sources", async () => {
  const renderImage = createResultOgImageHandler({
    getFonts: async () => [
      {
        data: new ArrayBuffer(8),
        name: "JetBrains Mono",
        style: "normal",
        weight: 500,
      },
      {
        data: new ArrayBuffer(8),
        name: "JetBrains Mono",
        style: "normal",
        weight: 700,
      },
      {
        data: new ArrayBuffer(8),
        name: "JetBrains Mono",
        style: "normal",
        weight: 800,
      },
    ],
    getResultShareSource: async () => ({ status: "unavailable" }),
    imageResponse: () => new Response(),
    notFound: () => {
      throw new Error("NEXT_NOT_FOUND");
    },
  });

  await assert.rejects(
    () =>
      renderImage({
        params: Promise.resolve({
          submissionId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    /NEXT_NOT_FOUND/,
  );
});

test("og image element encodes truncation rules on the intended nodes", () => {
  const element = createResultOgImageElement({
    headline: "the linter filed a complaint",
    languageLabel: "lang: typescript",
    lineCountLabel: "7 lines",
    scoreLabel: "3.5",
    status: "completed",
    verdictLabel: "rough verdict that still needs truncation",
  });

  const rootChildren = toChildArray(element.props.children);
  const scoreSection = asElement(rootChildren[1]);
  const headline = asElement(rootChildren[2]);
  const scoreSectionChildren = toChildArray(scoreSection.props.children);
  const verdict = asElement(scoreSectionChildren[1]);
  const metadata = asElement(scoreSectionChildren[2]);
  const verdictStyle = verdict.props.style ?? {};
  const metadataStyle = metadata.props.style ?? {};
  const headlineStyle = headline.props.style ?? {};

  assert.equal(verdictStyle.textOverflow, "ellipsis");
  assert.equal(verdictStyle.whiteSpace, "nowrap");
  assert.equal(metadataStyle.textOverflow, "ellipsis");
  assert.equal(metadataStyle.whiteSpace, "nowrap");
  assert.equal(headlineStyle.display, undefined);
  assert.equal(headlineStyle.lineClamp, 2);
  assert.equal(headlineStyle.textOverflow, "ellipsis");
});

test("font loader retries after a transient failure instead of caching a rejected promise forever", async () => {
  let stylesheetRequests = 0;

  const getFonts = createOgImageJetBrainsMonoFontsLoader(
    async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("css2")) {
        stylesheetRequests += 1;

        if (stylesheetRequests === 1) {
          return new Response(null, { status: 503 });
        }

        return new Response(
          [500, 700, 800]
            .map(
              (weight) =>
                `@font-face { font-family: 'JetBrains Mono'; font-style: normal; font-weight: ${weight}; src: url(https://fonts.example.com/${weight}.woff2) format('woff2'); }`,
            )
            .join("\n"),
        );
      }

      return new Response(new Uint8Array([1, 2, 3]).buffer);
    },
  );

  await assert.rejects(
    () => getFonts(),
    /Unable to load JetBrains Mono stylesheet/,
  );

  const fonts = await getFonts();

  assert.equal(stylesheetRequests, 2);
  assert.deepEqual(
    fonts.map((font: { weight?: number }) => font.weight),
    [500, 700, 800],
  );
});

test("font stylesheet request uses a deterministic broad Latin glyph set", () => {
  const stylesheetUrl = buildOgImageJetBrainsMonoStylesheetUrl();
  const parsedUrl = new URL(stylesheetUrl);

  assert.equal(
    parsedUrl.searchParams.get("family"),
    "JetBrains Mono:wght@500;700;800",
  );
  assert.equal(parsedUrl.searchParams.get("display"), "swap");
  const glyphs = parsedUrl.searchParams.get("text") ?? "";

  assert.match(glyphs, /D/);
  assert.match(glyphs, /v/);
  assert.match(glyphs, /á/);
  assert.match(glyphs, /ç/);
  assert.match(glyphs, /ê/);
  assert.match(glyphs, /"/);
  assert.match(glyphs, /!/);
  assert.match(glyphs, /@/);
  assert.match(glyphs, /0/);
  assert.doesNotMatch(stylesheetUrl, /subset=/);
});
