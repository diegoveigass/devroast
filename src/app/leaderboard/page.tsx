import type { Metadata } from "next";

import { LeaderboardView } from "./_components/leaderboard-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard | DevRoast",
  description:
    "Server-rendered DevRoast leaderboard with static ranking data for search-friendly indexing.",
};

export default async function LeaderboardPage() {
  return <LeaderboardView />;
}
