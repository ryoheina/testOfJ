import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";

import { MainLayout } from "@/components/layout/MainLayout";
import { useQuizContext } from "@/store/quiz-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Target, RotateCcw, Share2, Check } from "lucide-react";

function getGrade(accuracy: number) {
  if (accuracy === 100) return { grade: "S", color: "text-purple-500" };
  if (accuracy >= 90) return { grade: "A", color: "text-green-500" };
  if (accuracy >= 75) return { grade: "B", color: "text-blue-500" };
  if (accuracy >= 60) return { grade: "C", color: "text-orange-500" };
  return { grade: "F", color: "text-destructive" };
}

export default function Results() {
  const [, setLocation] = useLocation();
  const { settings, answers, timeTaken, shareId, resetQuiz } = useQuizContext();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!settings || answers.length === 0) {
      setLocation("/");
    }
  }, [settings, answers, setLocation]);

  if (!settings || answers.length === 0) return null;

  const correctCount = answers.filter(a => a.correct).length;
  const incorrectCount = answers.length - correctCount;
  const accuracy = Math.round((correctCount / answers.length) * 100);
  const { grade, color } = getGrade(accuracy);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const handleRestart = () => {
    resetQuiz();
    setLocation("/setup");
  };

  const handleShare = async () => {
    if (!shareId) return;
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    const url = `${window.location.origin}${base}/share/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      prompt("Copy this link:", url);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">
            Practice Complete
          </div>
          <div className={`text-8xl md:text-9xl font-bold font-serif mb-6 ${color}`}>
            {grade}
          </div>
          <h1 className="text-2xl font-medium">Well done, {settings.name}</h1>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card/50">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Target className="w-6 h-6 text-muted-foreground mb-2" />
                <div className="text-3xl font-semibold mb-1">{accuracy}%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Accuracy</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card/50">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Clock className="w-6 h-6 text-muted-foreground mb-2" />
                <div className="text-3xl font-semibold mb-1">{formatTime(timeTaken)}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Time Taken</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card/50">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
                <div className="text-3xl font-semibold mb-1">{correctCount}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Correct</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-card/50">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <XCircle className="w-6 h-6 text-destructive mb-2" />
                <div className="text-3xl font-semibold mb-1">{incorrectCount}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Incorrect</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3 py-4"
        >
          <Button size="lg" onClick={handleRestart} variant="outline" className="px-8 rounded-full">
            <RotateCcw className="w-4 h-4 mr-2" />
            Practice Again
          </Button>
          {shareId && (
            <Button size="lg" onClick={handleShare} className="px-8 rounded-full">
              {copied
                ? <><Check className="w-4 h-4 mr-2" />Link Copied!</>
                : <><Share2 className="w-4 h-4 mr-2" />Share Results</>
              }
            </Button>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {answers.map((ans, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center p-3 rounded-lg border ${
                      ans.correct ? "bg-green-500/5 border-green-500/20" : "bg-destructive/5 border-destructive/20"
                    }`}
                  >
                    <span className="text-2xl font-serif mb-1">{ans.kana}</span>
                    <span className="text-sm font-mono text-muted-foreground">{ans.reading}</span>
                    {!ans.correct && (
                      <span className="text-xs font-mono text-destructive mt-1 line-through decoration-destructive/50">
                        {ans.userAnswer || "-"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
