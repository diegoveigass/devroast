import { router } from "../init";
import { homeRouter } from "./home";
import { leaderboardRouter } from "./leaderboard";
import { roastsRouter } from "./roasts";

export const appRouter = router({
  home: homeRouter,
  leaderboard: leaderboardRouter,
  roasts: roastsRouter,
});

export type AppRouter = typeof appRouter;
