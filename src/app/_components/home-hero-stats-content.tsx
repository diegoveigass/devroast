"use client";

import { default as NumberFlow, NumberFlowGroup } from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useTRPC } from "@/trpc/client";

type AnimatedStats = {
  averageScore: number;
  totalRoasted: number;
};

export function HomeHeroStatsContent() {
  const trpc = useTRPC();
  const [animatedStats, setAnimatedStats] = useState<AnimatedStats>({
    averageScore: 0,
    totalRoasted: 0,
  });
  const { data } = useQuery(trpc.home.getStats.queryOptions());

  useEffect(() => {
    if (!data) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setAnimatedStats({
        averageScore: data.averageScore,
        totalRoasted: data.totalRoasted,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [data]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-tertiary lg:gap-6">
      <NumberFlowGroup>
        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-text-tertiary">
          <NumberFlow
            className="font-mono tabular-nums text-text-tertiary"
            format={{ maximumFractionDigits: 0, useGrouping: true }}
            value={animatedStats.totalRoasted}
          />
          <span>codes roasted</span>
        </span>

        <span className="font-mono">{"·"}</span>

        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-text-tertiary">
          <span>avg score:</span>
          <NumberFlow
            className="font-mono tabular-nums text-text-tertiary"
            format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
            value={animatedStats.averageScore}
          />
          <span>/10</span>
        </span>
      </NumberFlowGroup>
    </div>
  );
}
