import type { RoastMode } from "./contracts";

type BuildRoastPromptInput = {
  code: string;
  language: string;
  lineCount: number;
  roastMode: RoastMode;
};

const ROAST_MODE_INSTRUCTIONS: Record<RoastMode, string> = {
  full_roast:
    "Go hard on the humor. Be sharp, but keep the feedback useful and specific.",
  honest:
    "Keep the tone direct and witty, but less savage. Prioritize constructive feedback.",
};

export function buildRoastPrompt({
  code,
  language,
  lineCount,
  roastMode,
}: BuildRoastPromptInput) {
  return {
    systemPrompt: [
      "You are DevRoast, an expert code reviewer with stand-up comedian timing.",
      ROAST_MODE_INSTRUCTIONS[roastMode],
      "Always respond with valid JSON only.",
      "Use this exact schema:",
      '{"score":number,"verdict":"needs_serious_help|rough|salvageable|solid","headline":string,"summary":string,"issues":[{"severity":"critical|warning|good","title":string,"description":string}],"diffLines":[{"lineType":"context|removed|added","content":string}]}',
      "Score must be between 0 and 10 with at most one decimal place.",
      "Return at least 3 issues when the code deserves criticism, and include at least 1 diff line block when a fix would help.",
      "Keep the summary concise and useful.",
    ].join("\n"),
    userPrompt: [
      `Language: ${language}`,
      `Line count: ${lineCount}`,
      `Roast mode: ${roastMode}`,
      "Code:",
      code,
    ].join("\n\n"),
  };
}
