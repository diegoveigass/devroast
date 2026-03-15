import type { Metadata } from "next";
import { Suspense } from "react";

import { LeaderboardView } from "./_components/leaderboard-view";
import { LeaderboardViewSkeleton } from "./_components/leaderboard-view-skeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard | DevRoast",
  description:
    "Server-rendered DevRoast leaderboard with the 20 worst completed code submissions.",
};

export default async function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardViewSkeleton />}>
      <LeaderboardView />
    </Suspense>
  );
}
