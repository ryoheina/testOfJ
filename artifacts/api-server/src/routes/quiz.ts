import { Router } from "express";
import { db, quizResultsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SubmitResultBody, GetResultsQueryParams, GetResultParams, DeleteResultParams } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

router.get("/share/:id", async (req, res) => {
  const id = Number(req.params["id"]);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  try {
    const [result] = await db.select().from(quizResultsTable).where(eq(quizResultsTable.id, id));
    if (!result) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ...result, submittedAt: result.submittedAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Failed to fetch shared result");
    res.status(500).json({ error: "Failed to fetch result" });
  }
});

router.post("/submit-result", async (req, res) => {
  const parsed = SubmitResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  try {
    const [result] = await db
      .insert(quizResultsTable)
      .values({
        name: data.name,
        discord: data.discord ?? null,
        email: data.email ?? null,
        mode: data.mode,
        quizMode: data.quizMode ?? null,
        score: data.score,
        totalQuestions: data.totalQuestions,
        accuracy: data.accuracy,
        timeTaken: data.timeTaken,
        correctAnswers: data.correctAnswers,
        incorrectAnswers: data.incorrectAnswers,
        detailedAnswers: data.detailedAnswers ?? null,
      })
      .returning();

    res.status(201).json({
      ...result,
      submittedAt: result.submittedAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, "Failed to save quiz result");
    res.status(500).json({ error: "Failed to save result" });
  }
});

router.get("/results", requireAuth, async (req, res) => {
  const parsed = GetResultsQueryParams.safeParse(req.query);
  const { search, mode, sortBy, sortOrder } = parsed.success ? parsed.data : ({} as Record<string, string>);

  try {
    let results = await db.select().from(quizResultsTable);

    if (search) {
      const s = search.toLowerCase();
      results = results.filter((r) => r.name.toLowerCase().includes(s));
    }
    if (mode) {
      results = results.filter((r) => r.mode === mode);
    }

    const order = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "score") {
      results.sort((a, b) => (a.score - b.score) * order);
    } else {
      results.sort((a, b) => (a.submittedAt.getTime() - b.submittedAt.getTime()) * order);
    }

    res.json(results.map((r) => ({ ...r, submittedAt: r.submittedAt.toISOString() })));
  } catch (err) {
    logger.error({ err }, "Failed to fetch results");
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

router.get("/results/export/csv", requireAuth, async (req, res) => {
  try {
    const results = await db.select().from(quizResultsTable);

    const headers = [
      "id", "name", "discord", "email", "mode", "quizMode",
      "score", "totalQuestions", "accuracy", "timeTaken",
      "correctAnswers", "incorrectAnswers", "submittedAt",
    ];

    const rows = results.map((r) => [
      r.id,
      `"${r.name.replace(/"/g, '""')}"`,
      r.discord ? `"${r.discord}"` : "",
      r.email ? `"${r.email}"` : "",
      r.mode,
      r.quizMode ?? "",
      r.score,
      r.totalQuestions,
      r.accuracy.toFixed(1),
      r.timeTaken,
      r.correctAnswers,
      r.incorrectAnswers,
      r.submittedAt.toISOString(),
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=kana-quiz-results.csv");
    res.send(csv);
  } catch (err) {
    logger.error({ err }, "Failed to export CSV");
    res.status(500).json({ error: "Failed to export" });
  }
});

router.get("/results/:id", requireAuth, async (req, res) => {
  const parsed = GetResultParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const [result] = await db
      .select()
      .from(quizResultsTable)
      .where(eq(quizResultsTable.id, parsed.data.id));

    if (!result) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ ...result, submittedAt: result.submittedAt.toISOString() });
  } catch (err) {
    logger.error({ err }, "Failed to fetch result");
    res.status(500).json({ error: "Failed to fetch result" });
  }
});

router.delete("/results/:id", requireAuth, async (req, res) => {
  const parsed = DeleteResultParams.safeParse({ id: Number(req.params["id"]) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  try {
    const deleted = await db
      .delete(quizResultsTable)
      .where(eq(quizResultsTable.id, parsed.data.id))
      .returning();

    if (deleted.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete result");
    res.status(500).json({ error: "Failed to delete" });
  }
});

export default router;
