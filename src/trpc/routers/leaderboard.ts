import { z } from "zod";

import { getHomeLeaderboardPreview, getHomeStats } from "@/db/queries/home";

import { publicProcedure, router } from "../init";

const leaderboardEntrySchema = z.object({
  language: z.string(),
  lineCount: z.number().int().min(1),
  originalCode: z.string(),
  publicId: z.string(),
  rank: z.number().int().min(1),
  score: z.number().min(0),
});

const leaderboardSummarySchema = z.object({
  averageScore: z.number().min(0),
  entries: z.array(leaderboardEntrySchema),
  totalRoasted: z.number().int().min(0),
});

export const leaderboardRouter = router({
  getTopWorst: publicProcedure
    .output(leaderboardSummarySchema)
    .query(async () => {
      const [entries, stats] = await Promise.all([
        getHomeLeaderboardPreview(20),
        getHomeStats(),
      ]);

      const averageScore = Number.parseFloat(stats.averageScore);

      return {
        averageScore: Number.isFinite(averageScore) ? averageScore : 0,
        entries: entries.map((entry) => ({
          language: entry.language,
          lineCount: entry.lineCount,
          originalCode: entry.originalCode,
          publicId: entry.publicId,
          rank: Number(entry.rank),
          score: Number.parseFloat(String(entry.score)),
        })),
        totalRoasted: stats.totalRoasted,
      };
    }),
});
