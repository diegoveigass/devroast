import { HomeHeroStats } from "./_components/home-hero-stats";
import { HomeLeaderboardPreview } from "./_components/home-leaderboard-preview";
import { HomePageClient } from "./_components/home-page-client";

const MAX_CODE_CHARACTERS = 2_000;

export default function Home() {
  return (
    <main className="bg-bg-page text-text-primary">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-6 pb-16 pt-20 lg:px-10">
        <HomePageClient characterLimit={MAX_CODE_CHARACTERS}>
          <HomeHeroStats />
        </HomePageClient>
        <HomeLeaderboardPreview />
      </div>
    </main>
  );
}
