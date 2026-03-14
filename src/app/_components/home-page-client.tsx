"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { HomeHero } from "./home-hero";

type HomePageClientProps = {
  characterLimit: number;
  children: ReactNode;
};

export function HomePageClient({
  characterLimit,
  children,
}: HomePageClientProps) {
  const [code, setCode] = useState("");
  const isCodeOverLimit = code.length > characterLimit;

  return (
    <HomeHero
      characterLimit={characterLimit}
      code={code}
      isSubmitDisabled={code.trim().length === 0 || isCodeOverLimit}
      onCodeChange={setCode}
    >
      {children}
    </HomeHero>
  );
}
