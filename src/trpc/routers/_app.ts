import { router } from "../init";
import { homeRouter } from "./home";

export const appRouter = router({
  home: homeRouter,
});

export type AppRouter = typeof appRouter;
