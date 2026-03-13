import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const cardVariants = tv({
  base: "flex flex-col border border-border-primary",
  variants: {
    surface: {
      page: "bg-bg-page",
      surface: "bg-bg-surface",
      elevated: "bg-bg-elevated",
    },
    size: {
      sm: "gap-3 p-4",
      md: "gap-3 p-5",
      lg: "gap-4 p-6",
    },
  },
  defaultVariants: {
    surface: "page",
    size: "md",
  },
});

export type CardProps = ComponentProps<"div"> &
  VariantProps<typeof cardVariants>;

export function Card({ className, size, surface, ...props }: CardProps) {
  return (
    <div className={cardVariants({ className, size, surface })} {...props} />
  );
}
