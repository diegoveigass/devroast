import type { ComponentProps, ReactNode } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const tableRowVariants = tv({
  base: "grid items-center gap-4 border-b border-border-primary px-5 py-4 font-mono",
  variants: {
    compact: {
      false:
        "grid-cols-1 md:grid-cols-[40px_60px_minmax(0,1fr)_100px] md:gap-6",
      true: "grid-cols-[40px_60px_minmax(0,1fr)]",
    },
  },
  defaultVariants: {
    compact: false,
  },
});

export const tableRowScoreVariants = tv({
  base: "font-mono text-sm font-bold",
  variants: {
    tone: {
      critical: "text-accent-red",
      warning: "text-accent-amber",
      good: "text-accent-green",
    },
  },
  defaultVariants: {
    tone: "critical",
  },
});

export type TableRowRootProps = ComponentProps<"div"> &
  VariantProps<typeof tableRowVariants>;

function TableRowRoot({ className, compact, ...props }: TableRowRootProps) {
  return (
    <div className={tableRowVariants({ className, compact })} {...props} />
  );
}

export type TableRowCellProps = ComponentProps<"div"> & {
  children: ReactNode;
};

function TableRowRank({ className, ...props }: TableRowCellProps) {
  return (
    <div
      className={["text-sm text-text-tertiary", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export type TableRowScoreProps = TableRowCellProps &
  VariantProps<typeof tableRowScoreVariants>;

function TableRowScore({ className, tone, ...props }: TableRowScoreProps) {
  return (
    <div className={tableRowScoreVariants({ className, tone })} {...props} />
  );
}

function TableRowCode({ className, ...props }: TableRowCellProps) {
  return (
    <div
      className={["min-w-0 text-xs text-text-secondary md:text-sm", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

function TableRowLanguage({ className, ...props }: TableRowCellProps) {
  return (
    <div
      className={["text-xs text-text-tertiary md:text-sm", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export const TableRow = {
  Code: TableRowCode,
  Language: TableRowLanguage,
  Rank: TableRowRank,
  Root: TableRowRoot,
  Score: TableRowScore,
};
