import {
  Badge,
  Button,
  Card,
  CodeBlock,
  DiffLine,
  ScoreRing,
  Section,
  TableRow,
} from "@/components/ui";

import { ToggleShowcase } from "./_components/toggle-showcase";

const buttonVariants = ["primary", "secondary", "link", "ghost"] as const;
const buttonSizes = ["sm", "md", "lg"] as const;
const badgeVariants = ["critical", "warning", "good", "verdict"] as const;

const sampleCode = [
  "function calculateTotal(items) {",
  "  let total = 0;",
  "",
  "  for (const item of items) {",
  "    total += item.price;",
  "  }",
  "",
  "  return total;",
  "}",
].join("\n");

const sampleCodeLines = sampleCode.split("\n");

export default function ComponentsPage() {
  return (
    <main className="min-h-screen bg-bg-page text-text-primary">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:px-10">
        <header className="flex flex-col gap-4 border border-border-primary bg-bg-surface p-6 lg:p-8">
          <div className="flex items-center gap-3 font-mono text-sm text-text-secondary">
            <span className="text-accent-green">{"//"}</span>
            <span>ui_showcase</span>
          </div>

          <div className="flex flex-col gap-3 lg:max-w-3xl">
            <h1 className="font-mono text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">
              component_library
            </h1>
            <p className="text-base leading-7 text-text-secondary">
              Visual reference page for the shared UI components in
              `src/components/ui`. Every new generic component should be added
              here with its supported variants.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
          <aside className="flex h-fit flex-col gap-3 border border-border-primary bg-bg-surface p-4">
            <p className="font-mono text-xs uppercase tracking-wide text-text-tertiary">
              Components
            </p>
            <a
              className="font-mono text-sm text-text-primary transition-colors hover:text-accent-green"
              href="#button"
            >
              Button
            </a>
            <a
              className="font-mono text-sm text-text-primary transition-colors hover:text-accent-green"
              href="#toggle"
            >
              Toggle
            </a>
            <a
              className="font-mono text-sm text-text-primary transition-colors hover:text-accent-green"
              href="#badge"
            >
              Badge
            </a>
            <a
              className="font-mono text-sm text-text-primary transition-colors hover:text-accent-green"
              href="#card"
            >
              Card
            </a>
            <a
              className="font-mono text-sm text-text-primary transition-colors hover:text-accent-green"
              href="#code-block"
            >
              CodeBlock
            </a>
            <a
              className="font-mono text-sm text-text-primary transition-colors hover:text-accent-green"
              href="#diff-line"
            >
              DiffLine
            </a>
            <a
              className="font-mono text-sm text-text-primary transition-colors hover:text-accent-green"
              href="#table-row"
            >
              TableRow
            </a>
            <a
              className="font-mono text-sm text-text-primary transition-colors hover:text-accent-green"
              href="#score-ring"
            >
              ScoreRing
            </a>
          </aside>

          <div className="flex flex-col gap-6">
            <Section.Root
              className="flex flex-col gap-6 border border-border-primary bg-bg-surface p-6 lg:p-8"
              id="button"
            >
              <Section.Header>
                <Section.Title>button</Section.Title>
                <Section.Description>
                  Base action component derived from the selected Pencil button.
                  Supports `primary`, `secondary`, `link`, and `ghost` styles,
                  three sizes, disabled states, and `fullWidth` layout.
                </Section.Description>
              </Section.Header>

              <div className="grid gap-4 lg:grid-cols-4">
                {buttonVariants.map((variant) => (
                  <article
                    className="flex flex-col gap-4 border border-border-primary bg-bg-page p-4"
                    key={variant}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border-primary pb-3">
                      <h2 className="font-mono text-sm font-medium text-text-primary">
                        {variant}
                      </h2>
                      <span className="font-mono text-xs text-text-tertiary">
                        variant
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {buttonSizes.map((size) => (
                        <div
                          className="flex flex-wrap items-center gap-3"
                          key={`${variant}-${size}`}
                        >
                          <Button size={size} variant={variant}>
                            {"$ roast_my_code"}
                          </Button>
                          <span className="font-mono text-xs text-text-tertiary">
                            {size}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <article className="flex flex-col gap-4 border border-border-primary bg-bg-page p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-border-primary pb-3">
                    <h2 className="font-mono text-sm font-medium text-text-primary">
                      states
                    </h2>
                    <span className="font-mono text-xs text-text-tertiary">
                      interactive
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button>{"$ default"}</Button>
                    <Button disabled>{"$ disabled"}</Button>
                    <Button variant="secondary">{"$ share_roast"}</Button>
                    <Button variant="link">{"$ view_all >>"}</Button>
                  </div>
                </article>

                <article className="flex flex-col gap-4 border border-border-primary bg-bg-page p-4">
                  <div className="flex items-center justify-between gap-3 border-b border-border-primary pb-3">
                    <h2 className="font-mono text-sm font-medium text-text-primary">
                      layout
                    </h2>
                    <span className="font-mono text-xs text-text-tertiary">
                      full width
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button fullWidth>{"$ roast_my_code"}</Button>
                    <Button fullWidth variant="secondary">
                      {"$ share_roast"}
                    </Button>
                  </div>
                </article>
              </div>
            </Section.Root>

            <Section.Root
              className="flex flex-col gap-6 border border-border-primary bg-bg-surface p-6 lg:p-8"
              id="toggle"
            >
              <Section.Header>
                <Section.Title>toggle</Section.Title>
                <Section.Description>
                  Interactive switch powered by Base UI primitives, now exposed
                  through compound components.
                </Section.Description>
              </Section.Header>

              <ToggleShowcase />
            </Section.Root>

            <Section.Root
              className="flex flex-col gap-6 border border-border-primary bg-bg-surface p-6 lg:p-8"
              id="badge"
            >
              <Section.Header>
                <Section.Title>badge_status</Section.Title>
                <Section.Description>
                  Compact status badges for verdicts, health states, and quick
                  severity labels.
                </Section.Description>
              </Section.Header>

              <div className="flex flex-wrap items-center gap-6">
                {badgeVariants.map((variant) => (
                  <Badge
                    key={variant}
                    size={variant === "verdict" ? "md" : "sm"}
                    variant={variant}
                  >
                    {variant === "verdict" ? "needs_serious_help" : variant}
                  </Badge>
                ))}
              </div>
            </Section.Root>

            <Section.Root
              className="flex flex-col gap-6 border border-border-primary bg-bg-surface p-6 lg:p-8"
              id="card"
            >
              <Section.Header>
                <Section.Title>cards</Section.Title>
                <Section.Description>
                  Generic bordered container for reusable panels and analysis
                  summaries.
                </Section.Description>
              </Section.Header>

              <Card className="max-w-xl" size="md" surface="page">
                <Badge variant="critical">critical</Badge>
                <h3 className="font-mono text-sm text-text-primary">
                  using var instead of const/let
                </h3>
                <p className="text-sm leading-6 text-text-secondary">
                  The `var` keyword is function-scoped rather than block-scoped,
                  which can lead to unexpected behavior and bugs. Modern
                  JavaScript uses `const` for immutable bindings and `let` for
                  mutable ones.
                </p>
              </Card>
            </Section.Root>

            <Section.Root
              className="flex flex-col gap-6 border border-border-primary bg-bg-surface p-6 lg:p-8"
              id="code-block"
            >
              <Section.Header>
                <Section.Title>code_block</Section.Title>
                <Section.Description>
                  Server-rendered syntax highlighting with Shiki using the
                  `vesper` theme through compound building blocks.
                </Section.Description>
              </Section.Header>

              <CodeBlock.Root className="max-w-3xl">
                <CodeBlock.Header>
                  <CodeBlock.WindowDots />
                  <span className="flex-1" />
                  <CodeBlock.FileName>calculate.js</CodeBlock.FileName>
                </CodeBlock.Header>
                <CodeBlock.Body>
                  <CodeBlock.LineNumbers lines={sampleCodeLines} />
                  <CodeBlock.Content code={sampleCode} lang="javascript" />
                </CodeBlock.Body>
              </CodeBlock.Root>
            </Section.Root>

            <Section.Root
              className="flex flex-col gap-6 border border-border-primary bg-bg-surface p-6 lg:p-8"
              id="diff-line"
            >
              <Section.Header>
                <Section.Title>diff_line</Section.Title>
                <Section.Description>
                  Lightweight diff rows for code review summaries and before /
                  after snippets.
                </Section.Description>
              </Section.Header>

              <Card className="max-w-2xl" size="sm" surface="page">
                <DiffLine variant="removed">var total = 0;</DiffLine>
                <DiffLine variant="added">const total = 0;</DiffLine>
                <DiffLine variant="context">
                  {"for (let i = 0; i < items.length; i++) {"}
                </DiffLine>
              </Card>
            </Section.Root>

            <Section.Root
              className="flex flex-col gap-6 border border-border-primary bg-bg-surface p-6 lg:p-8"
              id="table-row"
            >
              <Section.Header>
                <Section.Title>table_row</Section.Title>
                <Section.Description>
                  Reusable leaderboard row for ranked code snippets, scores, and
                  metadata using compound cells.
                </Section.Description>
              </Section.Header>

              <Card
                className="max-w-4xl gap-0 overflow-hidden"
                size="sm"
                surface="page"
              >
                <TableRow.Root>
                  <TableRow.Rank>#1</TableRow.Rank>
                  <TableRow.Score tone="critical">2.1</TableRow.Score>
                  <TableRow.Code>
                    function calculateTotal(items) {"{"} var total = 0; ...
                  </TableRow.Code>
                  <TableRow.Language>javascript</TableRow.Language>
                </TableRow.Root>
                <TableRow.Root>
                  <TableRow.Rank>#2</TableRow.Rank>
                  <TableRow.Score tone="warning">5.7</TableRow.Score>
                  <TableRow.Code>
                    const fetchData = async () =&gt; await api.get('/users')
                  </TableRow.Code>
                  <TableRow.Language>typescript</TableRow.Language>
                </TableRow.Root>
                <TableRow.Root className="border-b-0">
                  <TableRow.Rank>#3</TableRow.Rank>
                  <TableRow.Score tone="good">8.9</TableRow.Score>
                  <TableRow.Code>
                    export function sum(a, b) {"{"} return a + b {"}"}
                  </TableRow.Code>
                  <TableRow.Language>javascript</TableRow.Language>
                </TableRow.Root>
              </Card>
            </Section.Root>

            <Section.Root
              className="flex flex-col gap-6 border border-border-primary bg-bg-surface p-6 lg:p-8"
              id="score-ring"
            >
              <Section.Header>
                <Section.Title>score_ring</Section.Title>
                <Section.Description>
                  Circular score indicator for summary cards and overall roast
                  ratings.
                </Section.Description>
              </Section.Header>

              <div className="flex flex-wrap items-center gap-8">
                <ScoreRing value={3.2} />
                <ScoreRing value={5.8} />
                <ScoreRing value={9.1} />
              </div>
            </Section.Root>
          </div>
        </section>
      </div>
    </main>
  );
}
