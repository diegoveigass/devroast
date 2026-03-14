import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

import {
  DEFAULT_LANGUAGE_ID,
  DETECTION_LANGUAGE_SUBSET,
  normalizeLanguageAlias,
  type SupportedLanguageId,
} from "./languages";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("go", go);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("python", python);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);

const MIN_DETECTION_INPUT_LENGTH = 12;
const MIN_DETECTION_RELEVANCE = 4;

function looksLikeJson(code: string) {
  const trimmedCode = code.trim();

  if (!(trimmedCode.startsWith("{") || trimmedCode.startsWith("["))) {
    return false;
  }

  try {
    JSON.parse(trimmedCode);
    return true;
  } catch {
    return false;
  }
}

function looksLikeHtml(code: string) {
  return /<([a-z][\w-]*)(\s+[^>]*)?>[\s\S]*<\/\1>|<([a-z][\w-]*)(\s+[^>]*)?\/>/i.test(
    code,
  );
}

function looksLikeSql(code: string) {
  return /(\bselect\b[\s\S]*\bfrom\b|\binsert\s+into\b|\bupdate\b[\s\S]*\bset\b|\bdelete\s+from\b)/i.test(
    code,
  );
}

function looksLikeTsx(code: string) {
  return /(return\s*\(|=>\s*\()?[\s\S]*<([A-Z][\w]*|[a-z][\w-]*)(\s+[^>]*)?>/.test(
    code,
  );
}

function looksLikeJava(code: string) {
  return /(public\s+class\s+\w+|public\s+static\s+void\s+main\s*\(|System\.out\.println\s*\(|import\s+java\.|package\s+[\w.]+\s*;)/.test(
    code,
  );
}

function looksLikeTypescript(code: string) {
  return /\b(interface|implements|type\s+[A-Z]|enum|as const|readonly|import\s+type|declare\s+global|export\s+(const|function|class|type|interface)|import\s+\{|import\s+\*\s+as)\b/.test(
    code,
  );
}

function looksLikePython(code: string) {
  return /\bdef\s+\w+\(|\bfrom\s+\w+\s+import\b|\bprint\(/.test(code);
}

function looksLikeMarkdown(code: string) {
  return /(^#{1,6}\s)|(^[-*+]\s)|(```[\s\S]*```)/m.test(code);
}

function detectByHeuristic(code: string): SupportedLanguageId | null {
  if (looksLikeJson(code)) {
    return "json";
  }

  if (looksLikeTsx(code)) {
    return looksLikeTypescript(code) ? "tsx" : "jsx";
  }

  if (looksLikeHtml(code)) {
    return "html";
  }

  if (looksLikeSql(code)) {
    return "sql";
  }

  if (looksLikeJava(code)) {
    return "java";
  }

  if (looksLikeTypescript(code)) {
    return "typescript";
  }

  if (looksLikePython(code)) {
    return "python";
  }

  if (looksLikeMarkdown(code)) {
    return "markdown";
  }

  return null;
}

export function detectLanguage(code: string): SupportedLanguageId {
  const trimmedCode = code.trim();

  if (trimmedCode.length < MIN_DETECTION_INPUT_LENGTH) {
    return DEFAULT_LANGUAGE_ID;
  }

  const heuristicLanguage = detectByHeuristic(trimmedCode);

  if (heuristicLanguage) {
    return heuristicLanguage;
  }

  const result = hljs.highlightAuto(trimmedCode, DETECTION_LANGUAGE_SUBSET);
  const detectedLanguage = normalizeLanguageAlias(result.language);

  if (!detectedLanguage || result.relevance < MIN_DETECTION_RELEVANCE) {
    return DEFAULT_LANGUAGE_ID;
  }

  if (detectedLanguage === "typescript" && looksLikeTsx(trimmedCode)) {
    return "tsx";
  }

  if (detectedLanguage === "typescript" && looksLikeJava(trimmedCode)) {
    return "java";
  }

  if (detectedLanguage === "javascript" && looksLikeTsx(trimmedCode)) {
    return "jsx";
  }

  return detectedLanguage;
}
