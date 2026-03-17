"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants, Card, Section } from "@/components/ui";

type ResultRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const RESULT_ROUTE_ERROR_MESSAGE =
  "We couldn't load this roast right now. Try again in a moment or head back home to start fresh.";

export default function ResultRouteError({
  error,
  reset,
}: ResultRouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="bg-bg-page text-text-primary">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col justify-center gap-10 px-6 py-16 lg:px-20">
        <Card className="max-w-3xl gap-6" size="lg" surface="surface">
          <Section.Header className="gap-3">
            <Section.Title>result_unavailable</Section.Title>
            <Section.Description>
              {RESULT_ROUTE_ERROR_MESSAGE}
            </Section.Description>
          </Section.Header>

          <div className="flex flex-wrap gap-3">
            <Button onClick={reset} size="sm" variant="secondary">
              {"$ try_again"}
            </Button>

            <Link
              className={buttonVariants({ size: "sm", variant: "link" })}
              href="/"
            >
              {"$ back_home"}
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
