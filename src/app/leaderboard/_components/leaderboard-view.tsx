import type { BundledLanguage } from "shiki";

import { CodeBlock } from "@/components/ui";

type LeaderboardEntry = {
  code: string;
  language: string;
  lineCount: number;
  rank: number;
  score: number;
  shikiLanguage: BundledLanguage;
};

const leaderboardEntries: LeaderboardEntry[] = [
  {
    code: [
      'eval(prompt("enter code"))',
      "document.write(response)",
      "// trust the user lol",
    ].join("\n"),
    language: "javascript",
    lineCount: 3,
    rank: 1,
    score: 1.2,
    shikiLanguage: "javascript",
  },
  {
    code: [
      "if (x == true) { return true; }",
      "else if (x == false) { return false; }",
      "else { return !false; }",
    ].join("\n"),
    language: "typescript",
    lineCount: 3,
    rank: 2,
    score: 1.8,
    shikiLanguage: "typescript",
  },
  {
    code: ["SELECT * FROM users WHERE 1=1", "-- TODO: add authentication"].join(
      "\n",
    ),
    language: "sql",
    lineCount: 2,
    rank: 3,
    score: 2.1,
    shikiLanguage: "sql",
  },
  {
    code: ["catch (e) {", "  // ignore", "}"].join("\n"),
    language: "java",
    lineCount: 3,
    rank: 4,
    score: 2.3,
    shikiLanguage: "java",
  },
  {
    code: ["const sleep = (ms) => {", "  while (Date.now() < ms) {}", "}"].join(
      "\n",
    ),
    language: "javascript",
    lineCount: 3,
    rank: 5,
    score: 2.5,
    shikiLanguage: "javascript",
  },
];

function LeaderboardEntryCard({ entry }: { entry: LeaderboardEntry }) {
  const lines = entry.code.split("\n");

  return (
    <article className="border border-border-primary">
      <div className="flex h-12 flex-col justify-center gap-3 border-b border-border-primary px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-0">
        <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary">#</span>
            <span className="font-bold text-accent-amber">{entry.rank}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary">score:</span>
            <span className="font-bold text-accent-red">
              {entry.score.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <span className="text-text-secondary">{entry.language}</span>
          <span className="text-text-tertiary">{`${entry.lineCount} lines`}</span>
        </div>
      </div>

      <div className="overflow-hidden border border-transparent bg-bg-input">
        <CodeBlock.Body className="h-30 bg-bg-input text-xs">
          <CodeBlock.LineNumbers
            className="w-10 gap-1.5 bg-bg-surface px-2.5 py-3.5"
            lines={lines}
          />
          <CodeBlock.Content
            className="px-4 py-3.5"
            code={entry.code}
            lang={entry.shikiLanguage}
          />
        </CodeBlock.Body>
      </div>
    </article>
  );
}

export function LeaderboardView() {
  return (
    <main className="bg-bg-page text-text-primary">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-16 pt-10 lg:px-20">
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 font-mono">
            <span className="text-4xl leading-none font-bold text-accent-green">
              {">"}
            </span>
            <h1 className="text-3xl font-bold tracking-tight">
              shame_leaderboard
            </h1>
          </div>

          <p className="text-sm text-text-secondary">
            {"// the most roasted code on the internet"}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
            <span>2,847 submissions</span>
            <span>{"·"}</span>
            <span>avg score: 4.2/10</span>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          {leaderboardEntries.map((entry) => (
            <LeaderboardEntryCard entry={entry} key={entry.rank} />
          ))}
        </section>
      </div>
    </main>
  );
}
