"use client";

import { Switch } from "@base-ui/react/switch";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useId,
} from "react";
import { tv } from "tailwind-variants";

const toggleContext = createContext<{ id: string } | null>(null);

function useToggleContext() {
  const context = useContext(toggleContext);

  if (!context) {
    throw new Error("Toggle components must be used within Toggle.Root.");
  }

  return context;
}

export const toggleControlVariants = tv({
  base: "peer relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full bg-border-primary p-0.5 outline-none transition-colors duration-200 data-[checked]:justify-end data-[checked]:bg-accent-green data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
});

export const toggleLabelVariants = tv({
  base: "font-mono text-xs text-text-secondary transition-colors duration-200 peer-data-[checked]:text-accent-green",
});

export type ToggleRootProps = ComponentProps<"div"> & {
  children: ReactNode;
};

function ToggleRoot({ children, className, ...props }: ToggleRootProps) {
  const id = useId();

  return (
    <toggleContext.Provider value={{ id }}>
      <div
        className={["inline-flex items-center gap-3", className]
          .filter(Boolean)
          .join(" ")}
        {...props}
      >
        {children}
      </div>
    </toggleContext.Provider>
  );
}

export type ToggleControlProps = Omit<
  ComponentProps<typeof Switch.Root>,
  "children" | "className"
> & {
  className?: string;
};

function ToggleControl({ className, ...props }: ToggleControlProps) {
  const { id } = useToggleContext();

  return (
    <Switch.Root
      className={toggleControlVariants({ className })}
      id={id}
      nativeButton={false}
      {...props}
    >
      <Switch.Thumb className="block size-4 rounded-full bg-bg-page transition-transform duration-200" />
    </Switch.Root>
  );
}

export type ToggleLabelProps = ComponentProps<"label">;

function ToggleLabel({ children, className, ...props }: ToggleLabelProps) {
  const { id } = useToggleContext();

  return (
    <label
      className={toggleLabelVariants({ className })}
      htmlFor={id}
      {...props}
    >
      {children}
    </label>
  );
}

export const Toggle = {
  Control: ToggleControl,
  Label: ToggleLabel,
  Root: ToggleRoot,
};
