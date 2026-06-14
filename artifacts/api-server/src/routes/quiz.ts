import { Router, type IRouter } from "express";
import { eq, sql, desc, and, gte, lte, like } from "drizzle-orm";
import { db } from "@workspace/db";
import { quizSessionsTable, quizResultsTable } from "@workspace/db";
import {
  CreateQuizSessionBody,
  SubmitQuizResultBody,
  SubmitQuizResultParams,
  ListResultsQueryParams,
  GetResultParams,
  GetMissedKanaQueryParams,
  GetScoreTrendQueryParams,
  DeleteResultParams,
} from "@workspace/api-zod";
import { sendEmailNotification, sendDiscordNotification } from "../lib/notifications";

const router: IRouter = Router();

function getGrade(percentage: number): string {
  if (percentage >= 97) return "A+";
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  return "D";
}

// POST /quiz/session
router.post("/quiz/session", async (req, res): Promise<void> => {
  const parsed = CreateQuizSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(quizSessionsTable)
    .values({
      quizType: parsed.data.quizType,
      totalQuestions: parsed.data.totalQuestions,
      playerName: parsed.data.playerName ?? null,
    })
    .returning();

  res.status(201).json(session);
});

// POST /quiz/session/:sessionId/submit
router.post("/quiz/session/:sessionId/submit", async (req, res): Promise<void> => {
  const params = SubmitQuizResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SubmitQuizResultBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const session = await db
    .select()
    .from(quizSessionsTable)
    .where(eq(quizSessionsTable.id, params.data.sessionId))
    .then(r => r[0]);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const percentage = (body.data.score / body.data.totalQuestions) * 100;
  const grade = getGrade(percentage);

  const [result] = await db
    .insert(quizResultsTable)
    .values({
      sessionId: params.data.sessionId,
      playerName: session.playerName ?? null,
      quizType: session.quizType,
      score: body.data.score,
      totalQuestions: body.data.totalQuestions,
      percentage,
      timeTakenSeconds: body.data.timeTakenSeconds,
      grade,
      answers: body.data.answers,
    })
    .returning();

  void Promise.all([
    sendEmailNotification({ ...result, playerName: result.playerName ?? undefined }),
    sendDiscordNotification({ ...result, playerName: result.playerName ?? undefined }),
  ]);

  res.status(201).json({ ...result, answers: result.answers });
});

// GET /results
router.get("/results", async (req, res): Promise<void> => {
  const query = ListResultsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { quizType, playerName, dateFrom, dateTo, minScore, maxScore, limit = 50, offset = 0 } = query.data;

  const conditions = [];
  if (quizType) conditions.push(eq(quizResultsTable.quizType, quizType));
  if (playerName) conditions.push(like(quizResultsTable.playerName, `%${playerName}%`));
  if (dateFrom) conditions.push(gte(quizResultsTable.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(quizResultsTable.createdAt, new Date(dateTo)));
  if (minScore != null) conditions.push(gte(quizResultsTable.score, minScore));
  if (maxScore != null) conditions.push(lte(quizResultsTable.score, maxScore));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [results, countResult] = await Promise.all([
    db.select().from(quizResultsTable).where(whereClause).orderBy(desc(quizResultsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(quizResultsTable).where(whereClause),
  ]);

  res.json({ results: results.map(r => ({ ...r, answers: r.answers })), total: countResult[0]?.count ?? 0 });
});

// GET /results/:id
router.get("/results/:id", async (req, res): Promise<void> => {
  const params = GetResultParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [result] = await db.select().from(quizResultsTable).where(eq(quizResultsTable.id, params.data.id));
  if (!result) { res.status(404).json({ error: "Result not found" }); return; }
  res.json({ ...result, answers: result.answers });
});

// DELETE /results/:id
router.delete("/results/:id", async (req, res): Promise<void> => {
  const params = DeleteResultParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [deleted] = await db.delete(quizResultsTable).where(eq(quizResultsTable.id, params.data.id)).returning();
  if (!deleted) { res.status(404).json({ error: "Result not found" }); return; }
  res.json({ deleted: 1 });
});

// DELETE /results
router.delete("/results", async (_req, res): Promise<void> => {
  const result = await db.execute(sql`DELETE FROM quiz_results`);
  res.json({ deleted: result.rowCount ?? 0 });
});

// GET /admin/stats
router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [statsRow] = await db.select({
    totalSessions: sql<number>`count(*)::int`,
    averageScore: sql<number>`avg(score)::float`,
    averagePercentage: sql<number>`avg(percentage)::float`,
    bestScore: sql<number>`max(score)::int`,
    totalKanaAnswered: sql<number>`sum(total_questions)::int`,
    hiraganaCount: sql<number>`count(*) filter (where quiz_type = 'hiragana')::int`,
    katakanaCount: sql<number>`count(*) filter (where quiz_type = 'katakana')::int`,
    mixedCount: sql<number>`count(*) filter (where quiz_type = 'mixed')::int`,
  }).from(quizResultsTable);

  res.json({
    totalSessions: statsRow.totalSessions ?? 0,
    averageScore: statsRow.averageScore ?? 0,
    averagePercentage: statsRow.averagePercentage ?? 0,
    bestScore: statsRow.bestScore ?? 0,
    totalKanaAnswered: statsRow.totalKanaAnswered ?? 0,
    hiraganaCount: statsRow.hiraganaCount ?? 0,
    katakanaCount: statsRow.katakanaCount ?? 0,
    mixedCount: statsRow.mixedCount ?? 0,
  });
});

// GET /admin/user-stats
router.get("/admin/user-stats", async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      coalesce(player_name, 'Anonymous') AS player_name,
      count(*)::int AS total_tests,
      avg(percentage)::float AS average_percentage,
      max(score)::int AS best_score,
      sum(total_questions)::int AS total_questions
    FROM quiz_results
    GROUP BY coalesce(player_name, 'Anonymous')
    ORDER BY total_tests DESC, average_percentage DESC
  `);

  res.json(
    (rows.rows as Array<{ player_name: string; total_tests: number; average_percentage: number; best_score: number; total_questions: number }>).map(r => ({
      playerName: r.player_name,
      totalTests: r.total_tests,
      averagePercentage: r.average_percentage,
      bestScore: r.best_score,
      totalQuestions: r.total_questions,
    }))
  );
});

// GET /admin/missed-kana
router.get("/admin/missed-kana", async (req, res): Promise<void> => {
  const query = GetMissedKanaQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const limit = query.data.limit ?? 20;

  const results = await db.execute(sql`
    SELECT a->>'kana' AS kana, a->>'romaji' AS romaji, count(*)::int AS miss_count
    FROM quiz_results, jsonb_array_elements(answers) AS a
    WHERE (a->>'correct')::boolean = false
    GROUP BY a->>'kana', a->>'romaji'
    ORDER BY miss_count DESC
    LIMIT ${limit}
  `);

  res.json((results.rows as Array<{ kana: string; romaji: string; miss_count: number }>).map(r => ({
    kana: r.kana, romaji: r.romaji, missCount: r.miss_count,
  })));
});

// GET /admin/score-trend
router.get("/admin/score-trend", async (req, res): Promise<void> => {
  const query = GetScoreTrendQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const days = query.data.days ?? 30;

  const results = await db.execute(sql`
    SELECT
      to_char(created_at AT TIME ZONE 'UTC', 'MM/DD') AS date,
      avg(percentage)::float AS average_percentage,
      count(*)::int AS session_count
    FROM quiz_results
    WHERE created_at >= now() - (${days} || ' days')::interval
    GROUP BY to_char(created_at AT TIME ZONE 'UTC', 'MM/DD'), date_trunc('day', created_at)
    ORDER BY date_trunc('day', created_at) ASC
  `);

  res.json((results.rows as Array<{ date: string; average_percentage: number; session_count: number }>).map(r => ({
    date: r.date, averagePercentage: r.average_percentage, sessionCount: r.session_count,
  })));
});

export default router;
