import Link from "next/link";

import { buttonVariants, Card, Section, TableRow } from "@/components/ui";

const leaderboardRows = [
  {
    codePreview: "function calculateTotal(items) { var total = 0; ...",
    language: "javascript",
    rank: "1",
    score: "1.2",
    tone: "critical" as const,
  },
  {
    codePreview: "if (a = b) { return false } else { return true }",
    language: "typescript",
    rank: "2",
    score: "1.9",
    tone: "critical" as const,
  },
  {
    codePreview: "SELECT * FROM users WHERE id = 5 AND deleted_at IS NULL",
    language: "sql",
    rank: "3",
    score: "2.4",
    tone: "critical" as const,
  },
];

export function HomeLeaderboardPreview() {
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

        {leaderboardRows.map((row, index) => (
          <TableRow.Root
            className={
              index === leaderboardRows.length - 1 ? "border-b-0" : undefined
            }
            key={row.rank}
          >
            <TableRow.Rank>{row.rank}</TableRow.Rank>
            <TableRow.Score tone={row.tone}>{row.score}</TableRow.Score>
            <TableRow.Code>{row.codePreview}</TableRow.Code>
            <TableRow.Language>{row.language}</TableRow.Language>
          </TableRow.Root>
        ))}
      </Card>

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs leading-5 text-text-tertiary">
          showing top 3 of 2,847
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
