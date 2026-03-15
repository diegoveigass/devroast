import { asc, count, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { roastResults, submissions } from "@/db/schema";

export async function getHomeStats() {
  const [result] = await db
    .select({
      totalRoasted: count(submissions.id),
      averageScore: sql<
        string | null
      >`to_char(avg(${roastResults.score}), 'FM999999990.0')`,
    })
    .from(submissions)
    .innerJoin(roastResults, eq(roastResults.submissionId, submissions.id))
    .where(eq(submissions.status, "completed"));

  return {
    averageScore: result?.averageScore ?? "0.0",
    totalRoasted: result?.totalRoasted ?? 0,
  };
}

export async function getHomeLeaderboardPreview(limit = 3) {
  return db
    .select({
      id: submissions.id,
      language: sql<string>`coalesce(${roastResults.languageLabel}, ${submissions.language}, 'plaintext')`,
      originalCode: submissions.originalCode,
      publicId: submissions.publicId,
      rank: sql<number>`row_number() over (order by ${roastResults.score} asc, ${submissions.createdAt} asc)`,
      score: roastResults.score,
    })
    .from(submissions)
    .innerJoin(roastResults, eq(roastResults.submissionId, submissions.id))
    .where(eq(submissions.status, "completed"))
    .orderBy(asc(roastResults.score), asc(submissions.createdAt))
    .limit(limit);
}
