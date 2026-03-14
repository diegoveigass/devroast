"use client";

import { useState } from "react";

import { HomeHero } from "./_components/home-hero";
import { HomeLeaderboardPreview } from "./_components/home-leaderboard-preview";

export default function Home() {
  const [code, setCode] = useState("");

  return (
    <main className="bg-bg-page text-text-primary">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 pb-16 pt-20 lg:px-10">
        <HomeHero
          code={code}
          isSubmitDisabled={code.trim().length === 0}
          onCodeChange={setCode}
        />
        <HomeLeaderboardPreview />
      </div>
    </main>
  );
}
