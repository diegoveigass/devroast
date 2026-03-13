import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const diffLineVariants = tv({
  base: "flex w-full items-center gap-2 px-4 py-2 font-mono text-sm",
  variants: {
    variant: {
      added: "bg-bg-success-soft text-text-primary",
      removed: "bg-bg-critical-soft text-text-secondary",
      context: "bg-transparent text-text-secondary",
    },
  },
  defaultVariants: {
    variant: "context",
  },
});

const diffPrefixMap = {
  added: "+",
  context: " ",
  removed: "-",
} as const;

const diffPrefixVariants = tv({
  base: "w-3 shrink-0",
  variants: {
    variant: {
      added: "text-accent-green",
      removed: "text-accent-red",
      context: "text-text-tertiary",
    },
  },
  defaultVariants: {
    variant: "context",
  },
});

export type DiffLineProps = Omit<ComponentProps<"div">, "children"> &
  VariantProps<typeof diffLineVariants> & {
    children: string;
    prefix?: string;
  };

export function DiffLine({
  children,
  className,
  prefix,
  variant = "context",
  ...props
}: DiffLineProps) {
  return (
    <div className={diffLineVariants({ className, variant })} {...props}>
      <span className={diffPrefixVariants({ variant })}>
        {prefix ?? diffPrefixMap[variant]}
      </span>
      <span>{children}</span>
    </div>
  );
}
