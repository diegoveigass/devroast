import { Card, Section } from "@/components/ui";

export function HomeLeaderboardPreviewSkeleton() {
  const placeholderRows = ["row-1", "row-2", "row-3"] as const;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <Section.Header className="gap-3">
          <Section.Title>shame_leaderboard</Section.Title>
          <Section.Description className="leading-6 text-text-tertiary">
            {"// the worst code on the internet, ranked by shame"}
          </Section.Description>
        </Section.Header>

        <span className="inline-flex h-6 w-24 animate-pulse rounded-full bg-bg-elevated" />
      </div>

      <Card className="gap-0 overflow-hidden" size="sm" surface="page">
        <div className="grid grid-cols-[40px_60px_minmax(0,1fr)_100px] items-center gap-6 border-b border-border-primary bg-bg-surface px-5 py-3 font-mono text-xs text-text-tertiary">
          <span>#</span>
          <span>score</span>
          <span>code</span>
          <span>lang</span>
        </div>

        {placeholderRows.map((rowId, index) => (
          <div
            className={[
              "grid grid-cols-1 items-center gap-4 border-b border-border-primary px-5 py-4 font-mono md:grid-cols-[40px_60px_minmax(0,1fr)_100px] md:gap-6",
              index === 2 ? "border-b-0" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={rowId}
          >
            <span className="inline-flex h-4 w-6 animate-pulse rounded-full bg-bg-elevated" />
            <span className="inline-flex h-4 w-10 animate-pulse rounded-full bg-bg-elevated" />
            <span className="inline-flex h-4 w-full animate-pulse rounded-full bg-bg-elevated" />
            <span className="inline-flex h-4 w-16 animate-pulse rounded-full bg-bg-elevated" />
          </div>
        ))}
      </Card>

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex h-4 w-36 animate-pulse rounded-full bg-bg-elevated" />
        <span className="inline-flex h-6 w-44 animate-pulse rounded-full bg-bg-elevated" />
      </div>
    </section>
  );
}
