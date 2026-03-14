import { asc, eq, or } from "drizzle-orm";

import { db } from "@/db";
import {
  roastDiffLines,
  roastIssues,
  roastResults,
  submissions,
} from "@/db/schema";

export async function getRoastByIdentifier(identifier: string) {
  const [result] = await db
    .select({
      submissionId: submissions.id,
      publicId: submissions.publicId,
      originalCode: submissions.originalCode,
      roastMode: submissions.roastMode,
      language: submissions.language,
      lineCount: submissions.lineCount,
      score: roastResults.score,
      verdict: roastResults.verdict,
      headline: roastResults.headline,
      summary: roastResults.summary,
      languageLabel: roastResults.languageLabel,
      shareSlug: roastResults.shareSlug,
      provider: roastResults.provider,
      providerModel: roastResults.providerModel,
      createdAt: roastResults.createdAt,
    })
    .from(submissions)
    .innerJoin(roastResults, eq(roastResults.submissionId, submissions.id))
    .where(
      or(
        eq(submissions.publicId, identifier),
        eq(roastResults.shareSlug, identifier),
      ),
    )
    .limit(1);

  if (!result) {
    return null;
  }

  const submissionId = result.submissionId as string;

  const [issues, diffLines] = await Promise.all([
    db
      .select({
        id: roastIssues.id,
        severity: roastIssues.severity,
        title: roastIssues.title,
        description: roastIssues.description,
        position: roastIssues.position,
      })
      .from(roastIssues)
      .where(eq(roastIssues.submissionId, submissionId))
      .orderBy(asc(roastIssues.position)),
    db
      .select({
        id: roastDiffLines.id,
        lineType: roastDiffLines.lineType,
        content: roastDiffLines.content,
        position: roastDiffLines.position,
      })
      .from(roastDiffLines)
      .where(eq(roastDiffLines.submissionId, submissionId))
      .orderBy(asc(roastDiffLines.position)),
  ]);

  return {
    ...result,
    diffLines,
    issues,
  };
}
