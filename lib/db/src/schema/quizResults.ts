import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quizResultsTable = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  discord: text("discord"),
  email: text("email"),
  mode: text("mode").notNull(),
  quizMode: text("quiz_mode"),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  accuracy: real("accuracy").notNull(),
  timeTaken: integer("time_taken").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  incorrectAnswers: integer("incorrect_answers").notNull(),
  detailedAnswers: text("detailed_answers"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertQuizResultSchema = createInsertSchema(quizResultsTable).omit({
  id: true,
  submittedAt: true,
});

export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResultsTable.$inferSelect;
