import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, quizResultsTable } from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { signAdminToken } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD_HASH = bcrypt.hashSync("rlaeoqja20070925", 10);

router.post("/admin/login", async (req, res) => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { username, password } = parsed.data;

  if (username !== ADMIN_USERNAME) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signAdminToken();
  res.json({ token });
});

router.get("/admin/stats", requireAuth, async (req, res) => {
  try {
    const results = await db.select().from(quizResultsTable);

    if (results.length === 0) {
      res.json({
        totalUsers: 0,
        totalQuizzes: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        mostMissedKana: [],
      });
      return;
    }

    const uniqueNames = new Set(results.map((r) => r.name));
    const scores = results.map((r) => r.accuracy);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...results.map((r) => r.accuracy));
    const lowestScore = Math.min(...results.map((r) => r.accuracy));

    const missedKanaCounts: Record<string, number> = {};
    for (const result of results) {
      if (!result.detailedAnswers) continue;
      try {
        const answers: Array<{ kana: string; reading: string; userAnswer: string; correct: boolean }> =
          JSON.parse(result.detailedAnswers);
        for (const a of answers) {
          if (!a.correct) {
            missedKanaCounts[a.kana] = (missedKanaCounts[a.kana] ?? 0) + 1;
          }
        }
      } catch {
        logger.warn({ id: result.id }, "Failed to parse detailedAnswers");
      }
    }

    const mostMissedKana = Object.entries(missedKanaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kana, count]) => ({ kana, count }));

    res.json({
      totalUsers: uniqueNames.size,
      totalQuizzes: results.length,
      averageScore: Math.round(avgScore * 10) / 10,
      highestScore: Math.round(highestScore * 10) / 10,
      lowestScore: Math.round(lowestScore * 10) / 10,
      mostMissedKana,
    });
  } catch (err) {
    logger.error({ err }, "Failed to compute stats");
    res.status(500).json({ error: "Failed to compute stats" });
  }
});

export default router;
