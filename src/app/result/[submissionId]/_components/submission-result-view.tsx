import Link from "next/link";

import type { SubmissionResultViewModel } from "@/app/result/submission-result-view-model";
import {
  Badge,
  buttonVariants,
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

type SubmissionResultViewProps = {
  result: SubmissionResultViewModel;
};

export function SubmissionResultView({ result }: SubmissionResultViewProps) {
  if (result.status === "not_found") {
    return <ResultStatusCard message={result.message} status="not_found" />;
  }

  if (result.status === "processing") {
    return (
      <ResultStatusCard
        message="// your roast is still cooking. refresh in a moment."
        status="processing"
      />
    );
  }

  if (result.status === "failed") {
    return (
      <ResultStatusCard message={result.processingError} status="failed" />
    );
  }

  const codeLines = result.code.split("\n");

  return (
    <main className="bg-bg-page text-text-primary">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 pb-16 pt-10 lg:px-20">
        <section className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <ScoreRing value={result.score} />

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <Badge size="sm" variant="verdict">
              {result.verdictLabel}
            </Badge>

            <h1 className="max-w-4xl font-mono text-2xl leading-10 text-text-primary sm:text-3xl">
              {result.headline}
            </h1>

            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-text-tertiary">
              <span>{`lang: ${result.language ?? "unknown"}`}</span>
              <span>{"·"}</span>
              <span>{`${result.lineCount} lines`}</span>
            </div>

            <div>
              <Link
                className={buttonVariants({ size: "sm", variant: "secondary" })}
                href="/"
              >
                {"$ roast_another"}
              </Link>
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
          <Section.Title>detailed_analysis</Section.Title>
          <div className="grid gap-5 md:grid-cols-2">
            {result.summary.map((item) => (
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

function ResultStatusCard({
  message,
  status,
}: {
  message: string;
  status: "failed" | "not_found" | "processing";
}) {
  const title =
    status === "processing"
      ? "roast_in_progress"
      : status === "failed"
        ? "roast_failed"
        : "roast_not_found";

  const badgeVariant =
    status === "processing"
      ? "warning"
      : status === "failed"
        ? "critical"
        : "warning";

  return (
    <main className="bg-bg-page text-text-primary">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pb-16 pt-16 lg:px-10">
        <Card className="gap-5 bg-bg-surface p-8" size="lg" surface="surface">
          <Badge size="sm" variant={badgeVariant}>
            {title}
          </Badge>
          <h1 className="font-mono text-2xl text-text-primary">{title}</h1>
          <p className="text-sm leading-6 text-text-secondary">{message}</p>
          <div>
            <Link
              className={buttonVariants({ size: "sm", variant: "secondary" })}
              href="/"
            >
              {"$ back_home"}
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
