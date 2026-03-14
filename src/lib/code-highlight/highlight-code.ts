import { createHighlighter } from "shiki";

import {
  DEFAULT_LANGUAGE_ID,
  LANGUAGE_BY_ID,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageId,
} from "./languages";

const SHIKI_THEME = "vesper";
const MAX_HIGHLIGHT_CACHE_SIZE = 100;

const highlightCache = new Map<string, string>();
const highlighterPromise = createHighlighter({
  langs: SUPPORTED_LANGUAGES.flatMap((language) =>
    language.shiki ? [language.shiki] : [],
  ),
  themes: [SHIKI_THEME],
});

function escapeHtml(code: string) {
  return code
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function getPlainTextHtml(code: string) {
  return `<pre class="code-input-pre"><code>${escapeHtml(code)}</code></pre>`;
}

function setHighlightCacheEntry(cacheKey: string, html: string) {
  if (highlightCache.size >= MAX_HIGHLIGHT_CACHE_SIZE) {
    const oldestEntry = highlightCache.keys().next().value;

    if (oldestEntry) {
      highlightCache.delete(oldestEntry);
    }
  }

  highlightCache.set(cacheKey, html);
}

export async function highlightCode(
  code: string,
  languageId: SupportedLanguageId,
) {
  const normalizedLanguageId =
    code.trim().length === 0 ? DEFAULT_LANGUAGE_ID : languageId;
  const cacheKey = `${normalizedLanguageId}::${code}`;
  const cachedHtml = highlightCache.get(cacheKey);

  if (cachedHtml) {
    return cachedHtml;
  }

  if (normalizedLanguageId === "plaintext") {
    const plainTextHtml = getPlainTextHtml(code);
    setHighlightCacheEntry(cacheKey, plainTextHtml);
    return plainTextHtml;
  }

  const language = LANGUAGE_BY_ID[normalizedLanguageId];

  try {
    const highlighter = await highlighterPromise;
    const html = highlighter.codeToHtml(code, {
      lang: language.shiki ?? DEFAULT_LANGUAGE_ID,
      theme: SHIKI_THEME,
    });

    setHighlightCacheEntry(cacheKey, html);
    return html;
  } catch {
    const plainTextHtml = getPlainTextHtml(code);
    setHighlightCacheEntry(cacheKey, plainTextHtml);
    return plainTextHtml;
  }
}

export function preloadHighlightEngine() {
  return highlighterPromise;
}
