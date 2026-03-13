import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

export const textareaVariants = tv({
  base: "w-full resize-none border-0 bg-bg-input p-4 font-mono text-sm leading-6 text-text-primary outline-none placeholder:text-text-tertiary disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    size: {
      md: "min-h-[320px]",
      lg: "min-h-[360px]",
    },
  },
  defaultVariants: {
    size: "lg",
  },
});

export type TextareaProps = ComponentProps<"textarea"> &
  VariantProps<typeof textareaVariants>;

export function Textarea({ className, size, ...props }: TextareaProps) {
  return (
    <textarea className={textareaVariants({ className, size })} {...props} />
  );
}
