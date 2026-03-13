"use client";

import { Toggle } from "@/components/ui";

export function ToggleShowcase() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
      <Toggle.Root>
        <Toggle.Control defaultChecked />
        <Toggle.Label>roast mode</Toggle.Label>
      </Toggle.Root>
      <Toggle.Root>
        <Toggle.Control />
        <Toggle.Label>roast mode</Toggle.Label>
      </Toggle.Root>
      <Toggle.Root>
        <Toggle.Control defaultChecked disabled />
        <Toggle.Label>disabled</Toggle.Label>
      </Toggle.Root>
    </div>
  );
}
