import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetResult, getGetResultQueryKey } from "@workspace/api-client-react";
import { getGrade } from "@/lib/kana-data";

interface AnswerDetail {
  kana: string;
  romaji: string;
  userAnswer: string;
  correct: boolean;
}

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#00d4ff", "#7c3aed", "#ec4899", "#fbbf24", "#34d399"];
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.vy += 0.05;
      }
      if (particles.some(p => p.y < canvas.height + 20)) {
        raf = requestAnimationFrame(draw);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
}

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const raf = requestAnimationFrame(function step(ts) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const gradeColors: Record<string, string> = {
  "A+": "text-cyan-400 text-glow-cyan",
  "A": "text-cyan-300",
  "B": "text-purple-400",
  "C": "text-yellow-400",
  "D": "text-red-400",
};

const gradeLabels: Record<string, string> = {
  "A+": "Outstanding",
  "A": "Excellent",
  "B": "Good",
  "C": "Average",
  "D": "Keep Practicing",
};

export default function ResultsPage() {
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const resultId = params.get("id") ? parseInt(params.get("id")!) : null;

  const fallbackScore = parseInt(params.get("score") || "0");
  const fallbackTotal = parseInt(params.get("total") || "20");
  const fallbackTime = parseInt(params.get("time") || "0");
  const fallbackPct = parseInt(params.get("pct") || "0");
  const fallbackGrade = params.get("grade") || getGrade(fallbackPct);

  const { data: result } = useGetResult(resultId!, {
    query: {
      enabled: !!resultId,
      queryKey: getGetResultQueryKey(resultId!),
    },
  });

  const score = result?.score ?? fallbackScore;
  const total = result?.totalQuestions ?? fallbackTotal;
  const pct = result ? Math.round(result.percentage) : fallbackPct;
  const grade = result?.grade ?? fallbackGrade;
  const time = result?.timeTakenSeconds ?? fallbackTime;
  const answers: AnswerDetail[] = (result?.answers ?? []) as AnswerDetail[];

  const displayScore = useCountUp(pct, 1200);
  const showConfetti = pct >= 90;

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start px-4 py-16 overflow-hidden">
      {showConfetti && <ConfettiCanvas />}

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Score reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
          className="text-center mb-10"
        >
          <div className="relative inline-flex items-center justify-center w-48 h-48 mb-6">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 44 * (1 - pct / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#00d4ff" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <div className="text-4xl font-black text-white">{displayScore}%</div>
              <div className="text-xs text-muted-foreground mt-1">{score}/{total}</div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className={`text-6xl font-black mb-1 ${gradeColors[grade] ?? "text-white"}`}>
              {grade}
            </div>
            <div className="text-muted-foreground text-lg">{gradeLabels[grade]}</div>
          </motion.div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: "Correct", value: String(score), color: "text-cyan-400" },
            { label: "Incorrect", value: String(total - score), color: "text-red-400" },
            { label: "Time", value: formatTime(time), color: "text-purple-400" },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-2xl p-4 text-center border border-border/50">
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Answer breakdown */}
        {answers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Answer Breakdown</h3>
            <div className="space-y-2">
              {answers.map((answer, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.04 }}
                >
                  <button
                    data-testid={`answer-row-${i}`}
                    onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                    className={`w-full flex items-center justify-between px-5 py-3 rounded-xl glass-card border transition-all duration-200 cursor-pointer text-left ${
                      answer.correct ? "border-cyan-400/20 hover:border-cyan-400/40" : "border-red-500/20 hover:border-red-500/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold w-8">{answer.kana}</span>
                      <span className="text-muted-foreground text-sm">{answer.romaji}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {!answer.correct && (
                        <span className="text-xs text-red-400">You: {answer.userAnswer}</span>
                      )}
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        answer.correct ? "bg-cyan-400/20 text-cyan-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {answer.correct ? "✓" : "✗"}
                      </span>
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedIdx === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 py-3 glass-card border-x border-b border-border/50 rounded-b-xl text-sm text-muted-foreground">
                          <strong>Correct answer:</strong> {answer.romaji} |{" "}
                          <strong>Your answer:</strong>{" "}
                          <span className={answer.correct ? "text-cyan-400" : "text-red-400"}>
                            {answer.userAnswer}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            data-testid="try-again"
            onClick={() => setLocation("/")}
            className="flex-1 py-4 rounded-2xl bg-cyan-400 text-background font-bold hover:bg-cyan-300 transition-colors glow-cyan cursor-pointer"
          >
            Try Again
          </button>
          <button
            data-testid="go-practice"
            onClick={() => setLocation("/practice")}
            className="flex-1 py-4 rounded-2xl glass-card border border-purple-400/30 text-purple-400 font-semibold hover:border-purple-400/60 transition-colors cursor-pointer"
          >
            Practice Weak Kana
          </button>
          <button
            data-testid="go-admin"
            onClick={() => setLocation("/admin")}
            className="flex-1 py-4 rounded-2xl glass-card border border-border text-muted-foreground font-semibold hover:border-foreground/30 transition-colors cursor-pointer"
          >
            View Results
          </button>
        </motion.div>
      </div>
    </div>
  );
}
