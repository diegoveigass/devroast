import { cacheLife } from "next/cache";
import Link from "next/link";
import { cache } from "react";

import type { BundledLanguage } from "shiki";

import { buttonVariants, Card, CodeBlock, Section } from "@/components/ui";
import {
  LANGUAGE_BY_ID,
  normalizeLanguageAlias,
} from "@/lib/code-highlight/languages";
import { getQueryClient, trpc } from "@/trpc/server";

import { HomeLeaderboardPreviewRow } from "./home-leaderboard-preview-row";

const getLeaderboardPreview = cache(async () => {
  const queryClient = getQueryClient();

  return queryClient.fetchQuery(trpc.home.getLeaderboardPreview.queryOptions());
});

export async function HomeLeaderboardPreview() {
  "use cache";
  cacheLife("hours");

  const { rows, totalRoasted } = await getLeaderboardPreview();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <Section.Header className="gap-3">
          <Section.Title>shame_leaderboard</Section.Title>
          <Section.Description className="leading-6 text-text-tertiary">
            {"// the worst code on the internet, ranked by shame"}
          </Section.Description>
        </Section.Header>

        <Link
          className={buttonVariants({ size: "sm", variant: "link" })}
          href="/leaderboard"
        >
          {"$ view_all >>"}
        </Link>
      </div>

      <Card className="gap-0 overflow-hidden" size="sm" surface="page">
        <div className="grid grid-cols-[40px_60px_minmax(0,1fr)_100px] items-center gap-6 border-b border-border-primary bg-bg-surface px-5 py-3 font-mono text-xs text-text-tertiary">
          <span>#</span>
          <span>score</span>
          <span>code</span>
          <span>lang</span>
        </div>

        {rows.map((row, index) => (
          <HomeLeaderboardPreviewRow
            codeBlock={
              <CodeBlock.Root
                className="gap-0 border-0 bg-bg-input p-0"
                surface="surface"
              >
                <CodeBlock.Body>
                  <CodeBlock.LineNumbers
                    className="w-10 gap-1.5 bg-bg-surface px-2.5 py-3.5"
                    lines={row.originalCode.split("\n")}
                  />
                  <CodeBlock.Content
                    className="px-4 py-3.5"
                    code={row.originalCode}
                    lang={resolveLeaderboardLanguage(row.language)}
                  />
                </CodeBlock.Body>
              </CodeBlock.Root>
            }
            isLast={index === rows.length - 1}
            key={row.publicId}
            language={row.language}
            rank={row.rank}
            score={row.score}
          />
        ))}
      </Card>

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs leading-5 text-text-tertiary">
          {`showing top 3 of ${totalRoasted.toLocaleString("en-US")}`}
        </p>
        <Link
          className={buttonVariants({ size: "sm", variant: "link" })}
          href="/leaderboard"
        >
          {"$ view_full_leaderboard >>"}
        </Link>
      </div>
    </section>
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
