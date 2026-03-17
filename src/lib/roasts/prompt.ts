import type { RoastMode } from "./contracts";

const RUBRIC = [
  "Technical rubric (always invariant):",
  "- correctness and logic",
  "- readability and naming",
  "- maintainability and architecture",
  "- performance trade-offs",
  "- security and reliability",
  "Return all categories regardless of roast mode.",
].join("\n");

const TONE_BY_MODE: Record<RoastMode, string> = {
  honest: "Tone: honest and direct. Keep feedback constructive and objective.",
  full_roast:
    "Tone: spicy and witty roast. Keep humor sharp but avoid abusive language.",
};

type BuildRoastPromptInput = {
  code: string;
  language: string;
  lineCount: number;
  roastMode: RoastMode;
};

export function buildRoastPrompt({
  code,
  language,
  lineCount,
  roastMode,
}: BuildRoastPromptInput) {
  const toneInstruction = TONE_BY_MODE[roastMode];

  return {
    rubric: RUBRIC,
    toneInstruction,
    systemPrompt: [
      "You are DevRoast, a senior code reviewer.",
      RUBRIC,
      toneInstruction,
      "Output ONLY valid JSON matching the requested schema.",
    ].join("\n\n"),
    userPrompt: [
      `language: ${language}`,
      `lineCount: ${lineCount}`,
      "code:",
      code,
    ].join("\n"),
  };
}
