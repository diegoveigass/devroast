import { Button, Toggle } from "@/components/ui";

import { HomeCodeEditor } from "./home-code-editor";

type HomeHeroProps = {
  characterLimit: number;
  code: string;
  isSubmitDisabled: boolean;
  onCodeChange: (value: string) => void;
};

export function HomeHero({
  characterLimit,
  code,
  isSubmitDisabled,
  onCodeChange,
}: HomeHeroProps) {
  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 font-mono text-4xl font-bold tracking-tight text-text-primary lg:text-5xl">
          <span className="text-accent-green">{"$"}</span>
          <h1>paste your code. get roasted.</h1>
        </div>

        <p className="max-w-3xl text-sm leading-6 text-text-secondary">
          {
            "// drop your code below and we'll rate it - brutally honest or full roast mode"
          }
        </p>
      </div>

      <HomeCodeEditor
        characterLimit={characterLimit}
        code={code}
        onCodeChange={onCodeChange}
      />

      <div className="flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
            <Toggle.Root>
              <Toggle.Control defaultChecked />
              <Toggle.Label>roast mode</Toggle.Label>
            </Toggle.Root>
            <p className="text-xs leading-5 text-text-tertiary">
              {"// maximum sarcasm enabled"}
            </p>
          </div>

          <Button disabled={isSubmitDisabled}>{"$ roast_my_code"}</Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-text-tertiary lg:gap-6">
          <span>2,847 codes roasted</span>
          <span className="font-mono">{"·"}</span>
          <span>avg score: 4.2/10</span>
        </div>
      </div>
    </section>
  );
}
