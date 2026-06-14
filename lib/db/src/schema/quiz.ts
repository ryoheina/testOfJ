import { pgTable, text, serial, timestamp, integer, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quizSessionsTable = pgTable("quiz_sessions", {
  id: serial("id").primaryKey(),
  playerName: text("player_name"),
  quizType: text("quiz_type").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quizResultsTable = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => quizSessionsTable.id),
  playerName: text("player_name"),
  quizType: text("quiz_type").notNull(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  percentage: real("percentage").notNull(),
  timeTakenSeconds: integer("time_taken_seconds").notNull(),
  grade: text("grade").notNull(),
  answers: jsonb("answers").notNull().$type<Array<{
    kana: string;
    romaji: string;
    userAnswer: string;
    correct: boolean;
  }>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuizSessionSchema = createInsertSchema(quizSessionsTable).omit({ id: true, createdAt: true });
export type InsertQuizSession = z.infer<typeof insertQuizSessionSchema>;
export type QuizSession = typeof quizSessionsTable.$inferSelect;

export const insertQuizResultSchema = createInsertSchema(quizResultsTable).omit({ id: true, createdAt: true });
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResultsTable.$inferSelect;
