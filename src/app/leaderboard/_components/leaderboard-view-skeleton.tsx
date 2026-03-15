export function LeaderboardViewSkeleton() {
  const placeholderRows = Array.from(
    { length: 6 },
    (_, index) => `row-${index}`,
  );

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
            <span className="inline-flex h-4 w-28 animate-pulse rounded-full bg-bg-elevated" />
            <span>{"·"}</span>
            <span className="inline-flex h-4 w-24 animate-pulse rounded-full bg-bg-elevated" />
          </div>
        </section>

        <section className="flex flex-col gap-5">
          {placeholderRows.map((rowId) => (
            <article className="border border-border-primary" key={rowId}>
              <div className="flex h-12 items-center justify-between border-b border-border-primary px-5 py-3">
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-4 w-8 animate-pulse rounded-full bg-bg-elevated" />
                  <span className="inline-flex h-4 w-14 animate-pulse rounded-full bg-bg-elevated" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-4 w-16 animate-pulse rounded-full bg-bg-elevated" />
                  <span className="inline-flex h-4 w-12 animate-pulse rounded-full bg-bg-elevated" />
                </div>
              </div>

              <div className="border-b border-border-primary px-5 py-4">
                <span className="inline-flex h-16 w-full animate-pulse rounded-md bg-bg-elevated" />
              </div>

              <div className="flex justify-end px-5 py-3">
                <span className="inline-flex h-4 w-24 animate-pulse rounded-full bg-bg-elevated" />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
