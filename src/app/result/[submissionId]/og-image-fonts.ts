import type { FontDetails } from "@takumi-rs/core";

const OG_IMAGE_FONT_WEIGHTS = [500, 700, 800] as const;

// The app uses `next/font/google` for JetBrains Mono in `src/app/layout.tsx`.
// The OG runtime cannot safely reuse Next's emitted font assets, so this loader
// fetches the same Google-hosted family directly with a single broad Latin glyph
// set that covers the product's likely punctuation and accented text needs.
const GOOGLE_FONTS_BASE_URL = "https://fonts.googleapis.com/css2";
const OG_IMAGE_LATIN_GLYPHS = [
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "abcdefghijklmnopqrstuvwxyz",
  "0123456789",
  " '\".,:;!?+-_/\\@#%&*()[]{}<>|=~`^$",
  "ÁÀÂÃÄÅÆÇÉÈÊËÍÌÎÏÑÓÒÔÕÖØÚÙÛÜÝŸ",
  "áàâãäåæçéèêëíìîïñóòôõöøúùûüýÿ",
].join("");

type FontWeight = (typeof OG_IMAGE_FONT_WEIGHTS)[number];
type FetchLike = typeof fetch;

export function buildOgImageJetBrainsMonoStylesheetUrl() {
  const url = new URL(GOOGLE_FONTS_BASE_URL);

  url.searchParams.set("family", "JetBrains Mono:wght@500;700;800");
  url.searchParams.set("display", "swap");
  url.searchParams.set("text", OG_IMAGE_LATIN_GLYPHS);

  return url.toString();
}

function extractFontAssetUrl(stylesheet: string, weight: FontWeight) {
  const match = stylesheet.match(
    new RegExp(
      `font-weight:\\s*${weight};[\\s\\S]*?src:\\s*url\\(([^)]+)\\)`,
      "m",
    ),
  );

  if (!match) {
    throw new Error(
      `Unable to resolve JetBrains Mono font asset for weight ${weight}.`,
    );
  }

  return match[1];
}

async function loadJetBrainsMonoFontsOnce(
  fetchImplementation: FetchLike,
): Promise<FontDetails[]> {
  const stylesheetResponse = await fetchImplementation(
    buildOgImageJetBrainsMonoStylesheetUrl(),
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  if (!stylesheetResponse.ok) {
    throw new Error("Unable to load JetBrains Mono stylesheet.");
  }

  const stylesheet = await stylesheetResponse.text();

  return Promise.all(
    OG_IMAGE_FONT_WEIGHTS.map(async (weight) => {
      const fontResponse = await fetchImplementation(
        extractFontAssetUrl(stylesheet, weight),
      );

      if (!fontResponse.ok) {
        throw new Error(
          `Unable to load JetBrains Mono font asset for weight ${weight}.`,
        );
      }

      return {
        data: await fontResponse.arrayBuffer(),
        name: "JetBrains Mono",
        style: "normal",
        weight,
      } satisfies FontDetails;
    }),
  );
}

export function createOgImageJetBrainsMonoFontsLoader(
  fetchImplementation: FetchLike,
) {
  let pendingFontsPromise: Promise<FontDetails[]> | undefined;

  return function getOgImageJetBrainsMonoFonts() {
    if (!pendingFontsPromise) {
      pendingFontsPromise = loadJetBrainsMonoFontsOnce(
        fetchImplementation,
      ).catch((error: unknown) => {
        pendingFontsPromise = undefined;
        throw error;
      });
    }

    return pendingFontsPromise;
  };
}

export const getOgImageJetBrainsMonoFonts =
  createOgImageJetBrainsMonoFontsLoader(fetch);
