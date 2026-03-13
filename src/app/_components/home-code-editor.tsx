import { Card, Textarea } from "@/components/ui";

type HomeCodeEditorProps = {
  code: string;
  lineNumbers: string[];
  onCodeChange: (value: string) => void;
};

export function HomeCodeEditor({
  code,
  lineNumbers,
  onCodeChange,
}: HomeCodeEditorProps) {
  return (
    <Card className="w-full gap-0 overflow-hidden" size="sm" surface="surface">
      <div className="flex h-10 items-center gap-2 border-b border-border-primary px-4">
        <span className="size-2 rounded-full bg-accent-red" />
        <span className="size-2 rounded-full bg-accent-amber" />
        <span className="size-2 rounded-full bg-accent-green" />
      </div>

      <div className="flex min-h-[360px] bg-bg-input text-left font-mono text-sm text-text-secondary">
        <div className="flex w-12 shrink-0 flex-col items-end border-r border-border-primary px-3 py-4 font-mono text-sm leading-6 text-text-tertiary">
          {lineNumbers.map((lineNumber) => (
            <span className="block h-6" key={lineNumber}>
              {lineNumber}
            </span>
          ))}
        </div>

        <Textarea
          aria-label="Code input"
          className="min-h-[360px] border-0 p-4"
          onChange={(event) => onCodeChange(event.target.value)}
          placeholder={
            "function calculateTotal(items) {\n  let total = 0;\n\n  for (const item of items) {\n    total += item.price;\n  }\n\n  return total;\n}"
          }
          spellCheck={false}
          value={code}
        />
      </div>
    </Card>
  );
}
