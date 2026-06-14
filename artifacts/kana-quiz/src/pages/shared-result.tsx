import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Target, Home } from "lucide-react";

type QuizResult = {
  id: number;
  name: string;
  mode: string;
  quizMode: string | null;
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeTaken: number;
  correctAnswers: number;
  incorrectAnswers: number;
  detailedAnswers: string | null;
  submittedAt: string;
};

type AnswerRecord = {
  kana: string;
  reading: string;
  userAnswer: string;
  correct: boolean;
};

function getGrade(accuracy: number) {
  if (accuracy === 100) return { grade: "S", color: "#a855f7" };
  if (accuracy >= 90)  return { grade: "A", color: "#22c55e" };
  if (accuracy >= 75)  return { grade: "B", color: "#4f8ef7" };
  if (accuracy >= 60)  return { grade: "C", color: "#f97316" };
  return { grade: "F", color: "#ef4444" };
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default function SharedResult() {
  const params = useParams<{ id: string }>();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = params.id;
    if (!id) { setNotFound(true); setLoading(false); return; }

    fetch(`/api/share/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setResult(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading result…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (notFound || !result) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
          <p className="text-6xl">404</p>
          <h1 className="text-2xl font-semibold">Result not found</h1>
          <p className="text-muted-foreground">This result may have been deleted or the link is invalid.</p>
          <Link href="/">
            <Button><Home className="w-4 h-4 mr-2" />Go Home</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const { grade, color } = getGrade(result.accuracy);
  const parsedAnswers: AnswerRecord[] = (() => {
    try { return result.detailedAnswers ? JSON.parse(result.detailedAnswers) : []; }
    catch { return []; }
  })();

  const modeLabel = result.mode.charAt(0).toUpperCase() + result.mode.slice(1);
  const quizModeLabel = result.quizMode === "typing" ? "Typing" : "Multiple Choice";

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-2">
            Shared Result
          </div>
          <div className="text-lg font-semibold mb-6">{result.name}'s Quiz</div>
          <div className="text-8xl md:text-9xl font-bold mb-4" style={{ color }}>
            {grade}
          </div>
          <div className="text-muted-foreground text-sm">
            {modeLabel} · {quizModeLabel} · {result.totalQuestions} questions
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Target className="w-5 h-5 text-blue-400" />, value: `${Math.round(result.accuracy)}%`, label: "Accuracy", delay: 0.1 },
            { icon: <Clock className="w-5 h-5 text-purple-400" />, value: formatTime(result.timeTaken), label: "Time", delay: 0.2 },
            { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, value: result.correctAnswers, label: "Correct", delay: 0.3 },
            { icon: <XCircle className="w-5 h-5 text-red-500" />, value: result.incorrectAnswers, label: "Wrong", delay: 0.4 },
          ].map(({ icon, value, label, delay }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
              <Card className="bg-card/50">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                  <div className="mb-2">{icon}</div>
                  <div className="text-3xl font-semibold mb-1">{value}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-center gap-4">
          <Link href="/">
            <Button size="lg" className="px-8 rounded-full">
              <Home className="w-4 h-4 mr-2" /> Take the Quiz Yourself
            </Button>
          </Link>
        </motion.div>

        {parsedAnswers.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Answer Review</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {parsedAnswers.map((ans, i) => (
                    <div
                      key={i}
                      className={`flex flex-col items-center p-3 rounded-lg border ${
                        ans.correct
                          ? "bg-green-500/5 border-green-500/20"
                          : "bg-red-500/5 border-red-500/20"
                      }`}
                    >
                      <span className="text-2xl mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{ans.kana}</span>
                      <span className="text-sm font-mono text-muted-foreground">{ans.reading}</span>
                      {!ans.correct && (
                        <span className="text-xs font-mono text-red-400 mt-1 line-through">
                          {ans.userAnswer || "—"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
}
