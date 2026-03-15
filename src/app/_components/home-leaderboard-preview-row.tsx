"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import type { ReactNode } from "react";
import { useState } from "react";

type HomeLeaderboardPreviewRowProps = {
  codeBlock: ReactNode;
  isLast: boolean;
  language: string;
  rank: number;
  score: number;
};

export function HomeLeaderboardPreviewRow({
  codeBlock,
  isLast,
  language,
  rank,
  score,
}: HomeLeaderboardPreviewRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root
      className={isLast ? "border-b-0" : "border-b border-border-primary"}
      onOpenChange={setOpen}
      open={open}
    >
      <div className="grid grid-cols-[40px_60px_minmax(0,1fr)_100px] items-center gap-6 px-5 py-4 font-mono">
        <span className="text-sm text-text-tertiary">{rank}</span>
        <span className="text-sm font-bold text-accent-red">
          {score.toFixed(1)}
        </span>
        <span className="text-xs text-text-tertiary">snippet</span>
        <span className="text-xs text-text-tertiary">{language}</span>
      </div>

      <div className="border-t border-border-primary">
        <div className="relative">
          <div
            className={[
              "transition-all duration-300",
              open ? "max-h-96" : "max-h-24 overflow-hidden",
            ].join(" ")}
          >
            {codeBlock}
          </div>

          {!open ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-t from-bg-page to-transparent" />
          ) : null}
        </div>

        <div className="flex justify-end px-5 py-3">
          <Collapsible.Trigger className="text-xs text-accent-green transition-colors hover:text-text-primary">
            {open ? "$ show_less <<" : "$ show_more >>"}
          </Collapsible.Trigger>
        </div>
      </div>
    </Collapsible.Root>
  );
}
