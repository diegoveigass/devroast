import { z } from "zod";

import { getHomeLeaderboardPreview, getHomeStats } from "@/db/queries/home";

import { publicProcedure, router } from "../init";

const homeStatsSchema = z.object({
  averageScore: z.number().min(0),
  totalRoasted: z.number().int().min(0),
});

const homeLeaderboardRowSchema = z.object({
  language: z.string(),
  originalCode: z.string(),
  publicId: z.string(),
  rank: z.number().int().min(1),
  score: z.number().min(0),
});

const homeLeaderboardPreviewSchema = z.object({
  rows: z.array(homeLeaderboardRowSchema),
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
  getLeaderboardPreview: publicProcedure
    .output(homeLeaderboardPreviewSchema)
    .query(async () => {
      const [rows, stats] = await Promise.all([
        getHomeLeaderboardPreview(3),
        getHomeStats(),
      ]);

      return {
        rows: rows.map((row) => ({
          language: row.language,
          originalCode: row.originalCode,
          publicId: row.publicId,
          rank: Number(row.rank),
          score: Number.parseFloat(String(row.score)),
        })),
        totalRoasted: stats.totalRoasted,
      };
    }),
});
