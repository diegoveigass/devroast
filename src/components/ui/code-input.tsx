/* biome-ignore-all lint/security/noDangerouslySetInnerHtml: Shiki returns trusted syntax-highlighted HTML and plaintext content is escaped before rendering. */

"use client";

import type { ComponentProps, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPlainTextHtml,
  highlightCode,
  preloadHighlightEngine,
} from "@/lib/code-highlight/highlight-code";
import type { SupportedLanguageId } from "@/lib/code-highlight/languages";

import { Card } from "./card";

const DEFAULT_LINE_COUNT = 12;
const INDENTATION = "  ";
const MAX_REALTIME_HIGHLIGHT_LINES = 500;

function getLineCount(code: string) {
  if (!code) {
    return DEFAULT_LINE_COUNT;
  }

  return code.split("\n").length;
}

function getCurrentLine(textarea: HTMLTextAreaElement) {
  const { selectionStart, value } = textarea;
  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const lineEnd = value.indexOf("\n", selectionStart);

  return value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);
}

function handleEnter(textarea: HTMLTextAreaElement) {
  const currentLine = getCurrentLine(textarea);
  const indentationMatch = currentLine.match(/^\s+/);
  const shouldIncreaseIndentation = /([[{:(])\s*$/.test(currentLine);
  const nextIndentation = `${indentationMatch?.[0] ?? ""}${
    shouldIncreaseIndentation ? INDENTATION : ""
  }`;

  textarea.setRangeText(
    `\n${nextIndentation}`,
    textarea.selectionStart,
    textarea.selectionEnd,
    "end",
  );
}

function handleTab(textarea: HTMLTextAreaElement, shouldOutdent: boolean) {
  const { selectionEnd, selectionStart, value } = textarea;

  if (selectionStart === selectionEnd && !shouldOutdent) {
    textarea.setRangeText(INDENTATION, selectionStart, selectionEnd, "end");
    return;
  }

  const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
  const nextLineBreakIndex = value.indexOf("\n", selectionEnd);
  const blockEnd =
    nextLineBreakIndex === -1 ? value.length : nextLineBreakIndex;
  const selectedBlock = value.slice(lineStart, blockEnd);
  const lines = selectedBlock.split("\n");

  if (shouldOutdent) {
    let removedCharactersBeforeSelectionStart = 0;
    let removedCharactersTotal = 0;

    const updatedLines = lines.map((line, index) => {
      if (line.startsWith(INDENTATION)) {
        removedCharactersTotal += INDENTATION.length;

        if (index === 0) {
          removedCharactersBeforeSelectionStart = INDENTATION.length;
        }

        return line.slice(INDENTATION.length);
      }

      if (line.startsWith(" ")) {
        removedCharactersTotal += 1;

        if (index === 0) {
          removedCharactersBeforeSelectionStart = 1;
        }

        return line.slice(1);
      }

      return line;
    });

    textarea.setRangeText(
      updatedLines.join("\n"),
      lineStart,
      blockEnd,
      "start",
    );

    const nextSelectionStart = Math.max(
      lineStart,
      selectionStart - removedCharactersBeforeSelectionStart,
    );
    const nextSelectionEnd = Math.max(
      nextSelectionStart,
      blockEnd - removedCharactersTotal,
    );

    textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    return;
  }

  const updatedBlock = lines.map((line) => `${INDENTATION}${line}`).join("\n");
  const indentedCharacters = INDENTATION.length * lines.length;

  textarea.setRangeText(updatedBlock, lineStart, blockEnd, "start");
  textarea.setSelectionRange(
    selectionStart + INDENTATION.length,
    selectionEnd + indentedCharacters,
  );
}

export type CodeInputProps = Omit<ComponentProps<typeof Card>, "children"> & {
  characterLimit?: number;
  code: string;
  headerAside?: ReactNode;
  language: SupportedLanguageId;
  onCodeChange: (value: string) => void;
  placeholder?: string;
};

export function CodeInput({
  characterLimit,
  className,
  code,
  headerAside,
  language,
  onCodeChange,
  placeholder,
  ...props
}: CodeInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [resolvedHighlight, setResolvedHighlight] = useState<{
    code: string;
    html: string;
    language: SupportedLanguageId;
  } | null>(null);
  const lineNumbers = useMemo(
    () =>
      Array.from({ length: getLineCount(code) }, (_, index) =>
        String(index + 1),
      ),
    [code],
  );
  const plainTextHtml = useMemo(() => getPlainTextHtml(code), [code]);
  const displayedHtml =
    resolvedHighlight?.code === code && resolvedHighlight.language === language
      ? resolvedHighlight.html
      : plainTextHtml;
  const currentCharacterCount = code.length;
  const isOverCharacterLimit =
    typeof characterLimit === "number" &&
    currentCharacterCount > characterLimit;

  useEffect(() => {
    void preloadHighlightEngine();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const lineCount = code.split("\n").length;

    void (async () => {
      const html =
        lineCount > MAX_REALTIME_HIGHLIGHT_LINES
          ? await highlightCode(code, "plaintext")
          : await highlightCode(code, language);

      if (isMounted) {
        setResolvedHighlight({
          code,
          html,
          language,
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [code, language]);

  useEffect(() => {
    if (
      !textareaRef.current ||
      !highlightRef.current ||
      !lineNumbersRef.current
    ) {
      return;
    }

    const { scrollLeft, scrollTop } = textareaRef.current;

    highlightRef.current.scrollLeft = scrollLeft;
    highlightRef.current.scrollTop = scrollTop;
    lineNumbersRef.current.style.transform = `translateY(-${scrollTop}px)`;
  });

  function syncScroll() {
    if (
      !textareaRef.current ||
      !highlightRef.current ||
      !lineNumbersRef.current
    ) {
      return;
    }

    const { scrollLeft, scrollTop } = textareaRef.current;

    highlightRef.current.scrollLeft = scrollLeft;
    highlightRef.current.scrollTop = scrollTop;
    lineNumbersRef.current.style.transform = `translateY(-${scrollTop}px)`;
  }

  return (
    <Card
      className={["w-full gap-0 overflow-hidden", className]
        .filter(Boolean)
        .join(" ")}
      size="sm"
      surface="surface"
      {...props}
    >
      <div className="flex h-10 items-center justify-between gap-4 border-b border-border-primary px-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-accent-red" />
          <span className="size-2 rounded-full bg-accent-amber" />
          <span className="size-2 rounded-full bg-accent-green" />
        </div>

        {headerAside ? <div className="min-w-0">{headerAside}</div> : null}
      </div>

      <div className="flex min-h-[360px] max-h-[40rem] overflow-hidden bg-bg-input text-left font-mono text-sm text-text-secondary">
        <div className="w-14 shrink-0 overflow-hidden border-r border-border-primary px-3 py-4 text-text-tertiary">
          <div
            className="flex flex-col items-end text-sm leading-6"
            ref={lineNumbersRef}
          >
            {lineNumbers.map((lineNumber) => (
              <span className="block h-6" key={lineNumber}>
                {lineNumber}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-w-0 flex-1">
          <div
            aria-hidden="true"
            className="code-input-highlight absolute inset-0 overflow-hidden px-4 py-4 text-text-primary"
            dangerouslySetInnerHTML={{ __html: displayedHtml }}
            ref={highlightRef}
          />

          <textarea
            aria-label="Code input"
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            className="code-input-scroll absolute inset-0 h-full w-full resize-none overflow-auto border-0 bg-transparent px-4 py-4 font-mono text-sm leading-6 text-transparent caret-text-primary outline-none placeholder:text-text-tertiary"
            onChange={(event) => onCodeChange(event.target.value)}
            onKeyDown={(event) => {
              const textarea = event.currentTarget;

              if (event.key === "Tab") {
                event.preventDefault();
                handleTab(textarea, event.shiftKey);
                onCodeChange(textarea.value);
                return;
              }

              if (event.key === "Enter") {
                event.preventDefault();
                handleEnter(textarea);
                onCodeChange(textarea.value);
              }
            }}
            onScroll={syncScroll}
            placeholder={placeholder}
            ref={textareaRef}
            spellCheck={false}
            value={code}
            wrap="off"
          />
        </div>
      </div>

      {typeof characterLimit === "number" ? (
        <div className="flex items-center justify-end border-t border-border-primary px-4 py-2">
          <span
            className={[
              "font-mono text-xs uppercase tracking-widest tabular-nums",
              isOverCharacterLimit ? "text-accent-red" : "text-text-tertiary",
            ].join(" ")}
          >
            {`${currentCharacterCount.toLocaleString()} / ${characterLimit.toLocaleString()} chars`}
          </span>
        </div>
      ) : null}
    </Card>
  );
}
