"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import type { ReactNode } from "react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

type LeaderboardEntryRowProps = {
  codeBlock: ReactNode;
  language: string;
  lineCount: number;
  rank: number;
  score: number;
};

export function LeaderboardEntryRow({
  codeBlock,
  language,
  lineCount,
  rank,
  score,
}: LeaderboardEntryRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <article className="border border-border-primary">
      <div className="flex flex-col justify-center gap-3 border-b border-border-primary px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary">#</span>
            <span className="font-bold text-accent-amber">{rank}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-text-tertiary">score:</span>
            <span className="font-bold text-accent-red">
              {score.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <span className="text-text-secondary">{language}</span>
          <span className="text-text-tertiary">{`${lineCount} lines`}</span>
        </div>
      </div>

      <Collapsible.Root onOpenChange={setOpen} open={open}>
        <div className="relative">
          <div
            className={twMerge(
              "transition-all duration-300",
              open ? "max-h-160" : "max-h-24 overflow-hidden",
            )}
          >
            {codeBlock}
          </div>

          {!open ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-bg-page to-transparent" />
          ) : null}
        </div>

        <div className="flex justify-end border-t border-border-primary px-5 py-3">
          <Collapsible.Trigger className="font-mono text-xs text-accent-green transition-colors hover:text-text-primary">
            {open ? "$ show_less <<" : "$ show_more >>"}
          </Collapsible.Trigger>
        </div>
      </Collapsible.Root>
    </article>
  );
}
