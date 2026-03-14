import type { BundledLanguage } from "shiki";

import {
  Badge,
  Button,
  Card,
  CodeBlock,
  DiffLine,
  ScoreRing,
  Section,
} from "@/components/ui";

type AnalysisItem = {
  description: string;
  tone: "critical" | "good" | "warning";
  title: string;
};

type DiffItem = {
  code: string;
  variant: "added" | "context" | "removed";
};

type SubmissionResult = {
  code: string;
  headline: string;
  language: string;
  lineCount: number;
  roastLabel: string;
  score: number;
  shikiLanguage: BundledLanguage;
  summary: AnalysisItem[];
  suggestedFix: DiffItem[];
};

const submissionResult: SubmissionResult = {
  code: [
    "function calculateTotal(items) {",
    "  var total = 0;",
    "",
    "  for (var i = 0; i < items.length; i++) {",
    "    total = total + items[i].price;",
    "  }",
    "",
    "  if (total > 100) {",
    '    console.log("discount applied");',
    "    total = total * 0.9;",
    "  }",
    "",
    "  // TODO: handle tax calculation",
    "  // TODO: handle currency conversion",
    "",
    "  return total;",
    "}",
  ].join("\n"),
  headline:
    '"this code looks like it was written during a power outage... in 2005."',
  language: "javascript",
  lineCount: 7,
  roastLabel: "verdict: needs_serious_help",
  score: 3.5,
  shikiLanguage: "javascript",
  suggestedFix: [
    {
      code: "function calculateTotal(items) {",
      variant: "context",
    },
    {
      code: "  var total = 0;",
      variant: "removed",
    },
    {
      code: "  for (var i = 0; i < items.length; i++) {",
      variant: "removed",
    },
    {
      code: "    total = total + items[i].price;",
      variant: "removed",
    },
    {
      code: "  }",
      variant: "removed",
    },
    {
      code: "  return items.reduce((sum, item) => sum + item.price, 0);",
      variant: "added",
    },
    {
      code: "}",
      variant: "context",
    },
  ],
  summary: [
    {
      description:
        "var is function-scoped and invites hoisting bugs. Prefer const by default, and use let only when reassignment is real.",
      title: "outdated mutation pattern",
      tone: "critical",
    },
    {
      description:
        "The manual for loop works, but reduce() expresses the intent more directly and trims the ceremony.",
      title: "imperative loop structure",
      tone: "warning",
    },
    {
      description:
        "calculateTotal and items are descriptive names that make the purpose obvious without extra comments.",
      title: "clear naming choices",
      tone: "good",
    },
    {
      description:
        "The function still owns too much policy. Logging, discounting, and tax placeholders point to rules that should be isolated.",
      title: "business rules are leaking in",
      tone: "warning",
    },
  ],
};

function ResultIssueCard({ description, title, tone }: AnalysisItem) {
  return (
    <Card className="gap-3 bg-bg-page" size="lg" surface="page">
      <Badge size="sm" variant={tone}>
        {tone}
      </Badge>
      <h3 className="font-mono text-sm font-medium text-text-primary">
        {title}
      </h3>
      <p className="text-sm leading-6 text-text-secondary">{description}</p>
    </Card>
  );
}

export async function SubmissionResultView() {
  const codeLines = submissionResult.code.split("\n");

  return (
    <main className="bg-bg-page text-text-primary">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-16 pt-10 lg:px-20">
        <section className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <ScoreRing value={submissionResult.score} />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Badge size="sm" variant="verdict">
              {submissionResult.roastLabel}
            </Badge>

            <h1 className="max-w-4xl font-mono text-2xl leading-10 text-text-primary sm:text-3xl">
              {submissionResult.headline}
            </h1>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-text-tertiary">
              <span>{`lang: ${submissionResult.language}`}</span>
              <span>{"·"}</span>
              <span>{`${submissionResult.lineCount} lines`}</span>
            </div>

            <div>
              <Button size="sm" variant="secondary">
                {"$ share_roast"}
              </Button>
            </div>
          </div>
        </section>

        <div className="h-px bg-border-primary" />

        <Section.Root className="flex flex-col gap-4">
          <Section.Title>your_submission</Section.Title>
          <CodeBlock.Root
            className="gap-0 overflow-hidden bg-bg-input p-0"
            size="sm"
            surface="surface"
          >
            <CodeBlock.Body className="min-h-80">
              <CodeBlock.LineNumbers
                className="w-12 gap-2 bg-bg-surface px-3 py-4"
                lines={codeLines}
              />
              <CodeBlock.Content
                className="px-4 py-4"
                code={submissionResult.code}
                lang={submissionResult.shikiLanguage}
              />
            </CodeBlock.Body>
          </CodeBlock.Root>
        </Section.Root>

        <div className="h-px bg-border-primary" />

        <Section.Root className="flex flex-col gap-6">
          <Section.Title>detailed_analysis</Section.Title>
          <div className="grid gap-5 md:grid-cols-2">
            {submissionResult.summary.map((item) => (
              <ResultIssueCard key={item.title} {...item} />
            ))}
          </div>
        </Section.Root>

        <div className="h-px bg-border-primary" />

        <Section.Root className="flex flex-col gap-6">
          <Section.Title>suggested_fix</Section.Title>
          <Card
            className="gap-0 overflow-hidden p-0"
            size="sm"
            surface="surface"
          >
            <div className="border-b border-border-primary px-4 py-3 font-mono text-xs text-text-secondary">
              your_code.ts -&gt; improved_code.ts
            </div>

            <div className="flex flex-col py-1">
              {submissionResult.suggestedFix.map((line, index) => (
                <DiffLine
                  key={`${line.variant}-${index}`}
                  variant={line.variant}
                >
                  {line.code}
                </DiffLine>
              ))}
            </div>
          </Card>
        </Section.Root>
      </div>
    </main>
  );
}
