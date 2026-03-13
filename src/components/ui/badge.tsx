import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const badgeVariants = tv({
  base: "inline-flex items-center gap-2 font-mono leading-none",
  variants: {
    variant: {
      critical: "text-accent-red",
      warning: "text-accent-amber",
      good: "text-accent-green",
      verdict: "text-accent-red",
    },
    size: {
      sm: "text-xs",
      md: "text-sm",
    },
    showDot: {
      true: "",
      false: "gap-0",
    },
  },
  defaultVariants: {
    variant: "good",
    size: "sm",
    showDot: true,
  },
});

const badgeDotVariants = tv({
  base: "rounded-full",
  variants: {
    variant: {
      critical: "bg-accent-red",
      warning: "bg-accent-amber",
      good: "bg-accent-green",
      verdict: "bg-accent-red",
    },
    size: {
      sm: "size-2",
      md: "size-2",
    },
  },
  defaultVariants: {
    variant: "good",
    size: "sm",
  },
});

export type BadgeProps = Omit<ComponentProps<"span">, "color"> &
  VariantProps<typeof badgeVariants>;

export function Badge({
  children,
  className,
  showDot,
  size,
  variant,
  ...props
}: BadgeProps) {
  return (
    <span
      className={badgeVariants({ className, showDot, size, variant })}
      {...props}
    >
      {showDot ? (
        <span className={badgeDotVariants({ size, variant })} />
      ) : null}
      <span>{children}</span>
    </span>
  );
}
