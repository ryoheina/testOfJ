import { Router, type IRouter, type Request, type Response } from "express";
import healthRouter from "./health";
import quizRouter from "./quiz";
import { adminAuth } from "../middleware/adminAuth";

const router: IRouter = Router();

router.use(healthRouter);

// Admin password check — public (no auth)
router.post("/admin/auth", (req: Request, res: Response): void => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) { res.status(500).json({ error: "Admin password not configured" }); return; }
  const { password } = req.body as { password?: string };
  if (password === adminPassword) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ error: "Incorrect password" });
  }
});

// Protect admin and results routes
router.use(
  ["/admin/stats", "/admin/user-stats", "/admin/missed-kana", "/admin/score-trend", "/results", "/results/:id"],
  adminAuth
);

// Mount all quiz routes
router.use(quizRouter);

export default router;
