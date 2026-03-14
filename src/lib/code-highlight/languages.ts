import type { BundledLanguage } from "shiki";

export type SupportedLanguageId =
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "json"
  | "bash"
  | "python"
  | "java"
  | "go"
  | "rust"
  | "html"
  | "css"
  | "sql"
  | "yaml"
  | "markdown"
  | "plaintext";

export type SupportedLanguage = {
  detectionAliases: string[];
  id: SupportedLanguageId;
  label: string;
  shiki: BundledLanguage | null;
};

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    detectionAliases: ["javascript", "js"],
    id: "javascript",
    label: "JavaScript",
    shiki: "javascript",
  },
  {
    detectionAliases: ["typescript", "ts"],
    id: "typescript",
    label: "TypeScript",
    shiki: "typescript",
  },
  {
    detectionAliases: ["jsx"],
    id: "jsx",
    label: "JSX",
    shiki: "jsx",
  },
  {
    detectionAliases: ["tsx"],
    id: "tsx",
    label: "TSX",
    shiki: "tsx",
  },
  {
    detectionAliases: ["json"],
    id: "json",
    label: "JSON",
    shiki: "json",
  },
  {
    detectionAliases: ["bash", "shell", "sh"],
    id: "bash",
    label: "Bash",
    shiki: "bash",
  },
  {
    detectionAliases: ["python", "py"],
    id: "python",
    label: "Python",
    shiki: "python",
  },
  {
    detectionAliases: ["java"],
    id: "java",
    label: "Java",
    shiki: "java",
  },
  {
    detectionAliases: ["go", "golang"],
    id: "go",
    label: "Go",
    shiki: "go",
  },
  {
    detectionAliases: ["rust", "rs"],
    id: "rust",
    label: "Rust",
    shiki: "rust",
  },
  {
    detectionAliases: ["html", "xml"],
    id: "html",
    label: "HTML",
    shiki: "html",
  },
  {
    detectionAliases: ["css"],
    id: "css",
    label: "CSS",
    shiki: "css",
  },
  {
    detectionAliases: ["sql"],
    id: "sql",
    label: "SQL",
    shiki: "sql",
  },
  {
    detectionAliases: ["yaml", "yml"],
    id: "yaml",
    label: "YAML",
    shiki: "yaml",
  },
  {
    detectionAliases: ["markdown", "md"],
    id: "markdown",
    label: "Markdown",
    shiki: "markdown",
  },
  {
    detectionAliases: ["plaintext", "text", "txt"],
    id: "plaintext",
    label: "Plain text",
    shiki: null,
  },
];

export const DEFAULT_LANGUAGE_ID: SupportedLanguageId = "plaintext";

export const AUTO_LANGUAGE_VALUE = "auto";

export const LANGUAGE_BY_ID = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((language) => [language.id, language]),
) as Record<SupportedLanguageId, SupportedLanguage>;

export const DETECTION_LANGUAGE_SUBSET = [
  "javascript",
  "typescript",
  "json",
  "bash",
  "python",
  "java",
  "go",
  "rust",
  "xml",
  "css",
  "sql",
  "yaml",
  "markdown",
];

export function getLanguageLabel(languageId: SupportedLanguageId) {
  return LANGUAGE_BY_ID[languageId].label;
}

export function normalizeLanguageAlias(
  alias: string | null | undefined,
): SupportedLanguageId | null {
  if (!alias) {
    return null;
  }

  const normalizedAlias = alias.toLowerCase();

  const language = SUPPORTED_LANGUAGES.find((item) =>
    item.detectionAliases.includes(normalizedAlias),
  );

  return language?.id ?? null;
}
