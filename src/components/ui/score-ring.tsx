import type { ComponentProps } from "react";

export type ScoreRingProps = Omit<ComponentProps<"div">, "children"> & {
  decimals?: number;
  max?: number;
  value: number;
};

const SIZE = 180;
const STROKE_WIDTH = 4;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreRing({
  className,
  decimals = 1,
  max = 10,
  value,
  ...props
}: ScoreRingProps) {
  const safeMax = max <= 0 ? 10 : max;
  const clampedValue = Math.min(Math.max(value, 0), safeMax);
  const progress = clampedValue / safeMax;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className={[
        "relative inline-flex size-45 items-center justify-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 -rotate-90"
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
      >
        <defs>
          <linearGradient
            id="score-ring-gradient"
            x1="0%"
            x2="100%"
            y1="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="var(--color-accent-green)" />
            <stop offset="100%" stopColor="var(--color-accent-amber)" />
          </linearGradient>
        </defs>

        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="none"
          r={RADIUS}
          stroke="var(--color-border-primary)"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="none"
          r={RADIUS}
          stroke="url(#score-ring-gradient)"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={STROKE_WIDTH}
        />
      </svg>

      <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-bg-page">
        <span className="font-mono text-5xl font-bold leading-none text-text-primary">
          {clampedValue.toFixed(decimals)}
        </span>
        <span className="font-mono text-lg leading-none text-text-tertiary">
          {`/${safeMax}`}
        </span>
      </div>
    </div>
  );
}
