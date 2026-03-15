import { router } from "../init";
import { homeRouter } from "./home";
import { leaderboardRouter } from "./leaderboard";

export const appRouter = router({
  home: homeRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
