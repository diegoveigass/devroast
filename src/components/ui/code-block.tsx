/* biome-ignore-all lint/security/noDangerouslySetInnerHtml: Shiki returns trusted server-side syntax-highlighted HTML. */

import type { ComponentProps } from "react";
import type { BundledLanguage } from "shiki";
import { codeToHtml } from "shiki";

import { Card } from "./card";

export type CodeBlockRootProps = ComponentProps<typeof Card>;

function CodeBlockRoot({ className, ...props }: CodeBlockRootProps) {
  return <Card className={className} size="sm" surface="surface" {...props} />;
}

export type CodeBlockHeaderProps = ComponentProps<"div">;

function CodeBlockHeader({ className, ...props }: CodeBlockHeaderProps) {
  return (
    <div
      className={[
        "flex h-10 items-center gap-3 border-b border-border-primary px-4 text-xs text-text-tertiary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export type CodeBlockWindowDotsProps = ComponentProps<"div">;

function CodeBlockWindowDots({
  className,
  ...props
}: CodeBlockWindowDotsProps) {
  return (
    <div
      className={["flex items-center gap-3", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className="size-2.5 rounded-full bg-accent-red" />
      <span className="size-2.5 rounded-full bg-accent-amber" />
      <span className="size-2.5 rounded-full bg-accent-green" />
    </div>
  );
}

export type CodeBlockFileNameProps = ComponentProps<"span">;

function CodeBlockFileName({ className, ...props }: CodeBlockFileNameProps) {
  return (
    <span
      className={["font-mono", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export type CodeBlockBodyProps = ComponentProps<"div">;

function CodeBlockBody({ className, ...props }: CodeBlockBodyProps) {
  return (
    <div
      className={[
        "flex bg-bg-input font-mono text-xs text-text-secondary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export type CodeBlockLineNumbersProps = ComponentProps<"div"> & {
  lines: string[];
};

function CodeBlockLineNumbers({
  className,
  lines,
  ...props
}: CodeBlockLineNumbersProps) {
  return (
    <div
      className={[
        "flex w-10 shrink-0 flex-col items-end gap-1 border-r border-border-primary px-2 py-3 text-text-tertiary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {lines.map((line, index) => (
        <span key={`${index + 1}-${line}`}>{index + 1}</span>
      ))}
    </div>
  );
}

export type CodeBlockContentProps = Omit<ComponentProps<"div">, "children"> & {
  code: string;
  lang: BundledLanguage;
};

async function CodeBlockContent({
  className,
  code,
  lang,
  ...props
}: CodeBlockContentProps) {
  const html = await codeToHtml(code, {
    lang,
    theme: "vesper",
  });

  return (
    <div
      className={[
        "code-block-content min-w-0 flex-1 px-3 py-3 text-text-primary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
}

export const CodeBlock = {
  Body: CodeBlockBody,
  Content: CodeBlockContent,
  FileName: CodeBlockFileName,
  Header: CodeBlockHeader,
  LineNumbers: CodeBlockLineNumbers,
  Root: CodeBlockRoot,
  WindowDots: CodeBlockWindowDots,
};
