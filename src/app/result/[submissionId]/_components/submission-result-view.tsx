import Link from "next/link";

import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CodeBlock,
  DiffLine,
  ScoreRing,
  Section,
} from "@/components/ui";

import type { SubmissionResultViewModel } from "../_lib/map-result-view-model";

type SubmissionResultViewProps = {
  result: SubmissionResultViewModel;
};

type StatusTone = "critical" | "warning" | "good";

type ResultIssueCardProps = Extract<
  SubmissionResultViewModel,
  { status: "completed" }
>["analysisItems"][number];

function ResultIssueCard({ description, title, tone }: ResultIssueCardProps) {
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

function ResultStatusState({ result }: SubmissionResultViewProps) {
  const toneByStatus: Record<
    Exclude<SubmissionResultViewModel["status"], "completed">,
    StatusTone
  > = {
    failed: "critical",
    not_found: "warning",
    processing: "good",
  };

  const ctaByStatus: Record<
    Exclude<SubmissionResultViewModel["status"], "completed">,
    string
  > = {
    failed: "$ retry_from_home",
    not_found: "$ create_new_roast",
    processing: "$ back_home",
  };

  if (result.status === "completed") {
    return null;
  }

  return (
    <main className="bg-bg-page text-text-primary">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-16 pt-10 lg:px-20">
        <section className="flex flex-col gap-6">
          <Badge size="sm" variant={toneByStatus[result.status]}>
            {result.status}
          </Badge>

          <div className="flex max-w-3xl flex-col gap-4">
            <h1 className="font-mono text-2xl leading-10 text-text-primary sm:text-3xl">
              {result.title}
            </h1>
            <p className="text-sm leading-7 text-text-secondary">
              {result.description}
            </p>
          </div>
        </section>

        <div className="h-px bg-border-primary" />

        <Card className="gap-5" size="lg" surface="surface">
          <Section.Header className="gap-3">
            <Section.Title>result_status</Section.Title>
            <Section.Description>
              {
                "This page stays server-rendered and reflects the stored submission state."
              }
            </Section.Description>
          </Section.Header>

          <div className="flex flex-wrap gap-3">
            <Link
              className={buttonVariants({ size: "sm", variant: "secondary" })}
              href="/"
            >
              {ctaByStatus[result.status]}
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}

export function SubmissionResultView({ result }: SubmissionResultViewProps) {
  if (result.status !== "completed") {
    return <ResultStatusState result={result} />;
  }

  const codeLines = result.code.split("\n");

  return (
    <main className="bg-bg-page text-text-primary">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-16 pt-10 lg:px-20">
        <section className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <ScoreRing value={result.score} />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Badge size="sm" variant="verdict">
              {result.roastLabel}
            </Badge>

            <h1 className="max-w-4xl font-mono text-2xl leading-10 text-text-primary sm:text-3xl">
              {result.headline}
            </h1>

            <p className="max-w-3xl text-sm leading-7 text-text-secondary">
              {result.summary}
            </p>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-text-tertiary">
              <span>{`lang: ${result.language}`}</span>
              <span>{"·"}</span>
              <span>{`${result.lineCount} lines`}</span>
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
                code={result.code}
                lang={result.shikiLanguage}
              />
            </CodeBlock.Body>
          </CodeBlock.Root>
        </Section.Root>

        <div className="h-px bg-border-primary" />

        <Section.Root className="flex flex-col gap-6">
          <Section.Header className="gap-3">
            <Section.Title>detailed_analysis</Section.Title>
            <Section.Description>{result.summary}</Section.Description>
          </Section.Header>

          <div className="grid gap-5 md:grid-cols-2">
            {result.analysisItems.map((item) => (
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
              {result.diffLines.map((line, index) => (
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
