import { z } from "zod";

import { getHomeStats } from "@/db/queries/home";

import { publicProcedure, router } from "../init";

const homeStatsSchema = z.object({
  averageScore: z.number().min(0),
  totalRoasted: z.number().int().min(0),
});

export const homeRouter = router({
  getStats: publicProcedure.output(homeStatsSchema).query(async () => {
    const stats = await getHomeStats();
    const averageScore = Number.parseFloat(stats.averageScore);

    return {
      averageScore: Number.isFinite(averageScore) ? averageScore : 0,
      totalRoasted: stats.totalRoasted,
    };
  }),
});
