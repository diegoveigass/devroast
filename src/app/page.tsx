"use client";

import { useState } from "react";

import { HomeHero } from "./_components/home-hero";
import { HomeLeaderboardPreview } from "./_components/home-leaderboard-preview";

const MAX_CODE_CHARACTERS = 2_000;

export default function Home() {
  const [code, setCode] = useState("");
  const isCodeOverLimit = code.length > MAX_CODE_CHARACTERS;

  return (
    <main className="bg-bg-page text-text-primary">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 pb-16 pt-20 lg:px-10">
        <HomeHero
          characterLimit={MAX_CODE_CHARACTERS}
          code={code}
          isSubmitDisabled={code.trim().length === 0 || isCodeOverLimit}
          onCodeChange={setCode}
        />
        <HomeLeaderboardPreview />
      </div>
    </main>
  );
}
