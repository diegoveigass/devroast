import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const buttonVariants = tv({
  base: "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-none px-6 py-2.5 font-mono text-sm font-medium leading-none outline-none transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
  variants: {
    variant: {
      primary: "bg-accent-green text-bg-page hover:bg-green-primary",
      secondary:
        "border border-border-primary bg-bg-surface text-text-primary hover:bg-bg-elevated",
      link: "border border-border-primary bg-transparent text-text-secondary hover:bg-bg-surface hover:text-text-primary",
      ghost: "bg-transparent text-text-primary hover:bg-bg-surface",
    },
    size: {
      sm: "px-4 py-2 text-xs",
      md: "px-6 py-2.5 text-sm",
      lg: "px-8 py-3 text-sm",
    },
    fullWidth: {
      true: "w-full",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    fullWidth: false,
  },
});

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  fullWidth,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ className, variant, size, fullWidth })}
      type={type}
      {...props}
    />
  );
}
