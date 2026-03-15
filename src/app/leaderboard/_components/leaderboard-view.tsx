import { cache } from "react";

import type { BundledLanguage } from "shiki";

import { Card, CodeBlock } from "@/components/ui";
import {
  LANGUAGE_BY_ID,
  normalizeLanguageAlias,
} from "@/lib/code-highlight/languages";
import { getQueryClient, trpc } from "@/trpc/server";

import { LeaderboardEntryRow } from "./leaderboard-entry-row";

const getLeaderboardData = cache(async () => {
  const queryClient = getQueryClient();

  return queryClient.fetchQuery(trpc.leaderboard.getTopWorst.queryOptions());
});

export async function LeaderboardView() {
  const { averageScore, entries, totalRoasted } = await getLeaderboardData();

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
            <span>{`${totalRoasted.toLocaleString("en-US")} submissions`}</span>
            <span>{"·"}</span>
            <span>{`avg score: ${averageScore.toFixed(1)}/10`}</span>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          {entries.map((entry) => (
            <LeaderboardEntryRow
              codeBlock={
                <Card
                  className="gap-0 overflow-hidden border border-transparent bg-bg-input p-0"
                  size="sm"
                  surface="surface"
                >
                  <CodeBlock.Body className="text-xs">
                    <CodeBlock.LineNumbers
                      className="w-10 gap-1.5 bg-bg-surface px-2.5 py-3.5"
                      lines={entry.originalCode.split("\n")}
                    />
                    <CodeBlock.Content
                      className="px-4 py-3.5"
                      code={entry.originalCode}
                      lang={resolveLeaderboardLanguage(entry.language)}
                    />
                  </CodeBlock.Body>
                </Card>
              }
              key={entry.publicId}
              language={entry.language}
              lineCount={entry.lineCount}
              rank={entry.rank}
              score={entry.score}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function resolveLeaderboardLanguage(language: string): BundledLanguage {
  const normalizedLanguage = normalizeLanguageAlias(language);

  if (!normalizedLanguage) {
    return "plaintext" as BundledLanguage;
  }

  return (LANGUAGE_BY_ID[normalizedLanguage].shiki ??
    "plaintext") as BundledLanguage;
}
