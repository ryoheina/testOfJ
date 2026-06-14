import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

import { MainLayout } from "@/components/layout/MainLayout";
import { useQuizContext } from "@/store/quiz-context";
import { getKanaDataset, KanaChar, allKana } from "@/data/kana";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useSubmitResult } from "@workspace/api-client-react";

function shuffle<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function Quiz() {
  const [, setLocation] = useLocation();
  const { settings, questions, setQuestions, answers, addAnswer, timeTaken, setTimeTaken, setShareId } = useQuizContext();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  
  const submitResultMutation = useSubmitResult();

  // Initialize quiz
  useEffect(() => {
    if (!settings) {
      setLocation("/setup");
      return;
    }

    if (questions.length === 0) {
      let dataset = getKanaDataset(settings.mode);
      dataset = shuffle(dataset);
      
      if (settings.questionCount !== "all") {
        dataset = dataset.slice(0, settings.questionCount);
      }
      
      setQuestions(dataset);
    }
  }, [settings, questions, setQuestions, setLocation]);

  // Timer
  useEffect(() => {
    if (!settings || questions.length === 0 || currentIndex >= questions.length) return;
    
    const interval = setInterval(() => {
      setTimeTaken(timeTaken + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeTaken, setTimeTaken, settings, questions, currentIndex]);

  // Generate options for multiple choice
  useEffect(() => {
    if (!settings || questions.length === 0 || currentIndex >= questions.length || settings.quizMode !== "multiple-choice") return;

    const currentQ = questions[currentIndex];
    // Deduplicate by reading so mixed-mode can't produce two options with the same label
    const seenReadings = new Set<string>([currentQ.reading]);
    const uniqueOtherKana = allKana.filter(k => {
      if (k.reading === currentQ.reading || seenReadings.has(k.reading)) return false;
      seenReadings.add(k.reading);
      return true;
    });
    const wrongOptions = shuffle(uniqueOtherKana).slice(0, 3).map(k => k.reading);

    setOptions(shuffle([currentQ.reading, ...wrongOptions]));
  }, [currentIndex, questions, settings]);

  const handleAnswer = useCallback((answer: string) => {
    if (feedback !== null) return; // Prevent double submission
    
    const currentQ = questions[currentIndex];
    const isCorrect = answer.toLowerCase().trim() === currentQ.reading.toLowerCase();
    
    addAnswer({
      kana: currentQ.kana,
      reading: currentQ.reading,
      userAnswer: answer,
      correct: isCorrect
    });
    
    setFeedback(isCorrect ? "correct" : "incorrect");
    
    setTimeout(() => {
      setFeedback(null);
      setTypedAnswer("");
      if (currentIndex + 1 >= questions.length) {
        finishQuiz();
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }, 800);
  }, [currentIndex, questions, feedback, addAnswer]);

  const finishQuiz = async () => {
    if (!settings) return;
    
    const correctCount = answers.filter(a => a.correct).length + (feedback === "correct" ? 1 : 0);
    const incorrectCount = answers.length + 1 - correctCount;
    const accuracy = ((correctCount / (answers.length + 1)) * 100) || 0;
    
    const finalAnswers = [...answers];
    const currentQ = questions[currentIndex];
    // the last answer was already added in handleAnswer before the timeout, but we need to submit now.
    // wait, handleAnswer calls addAnswer synchronously, so 'answers' in state might not have updated yet in this closure.
    // We should rely on the mutation body for the actual data.
    
    try {
      const result = await submitResultMutation.mutateAsync({
        data: {
          name: settings.name,
          discord: settings.discord || null,
          email: null,
          mode: settings.mode,
          quizMode: settings.quizMode,
          score: correctCount,
          totalQuestions: questions.length,
          accuracy,
          timeTaken,
          correctAnswers: correctCount,
          incorrectAnswers: incorrectCount,
          detailedAnswers: JSON.stringify(finalAnswers),
        }
      });
      setShareId(result.id);
      setLocation("/results");
    } catch (e) {
      // Even if API fails, go to results
      setLocation("/results");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (settings?.quizMode !== "multiple-choice" || feedback !== null) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= 4) {
        handleAnswer(options[num - 1]);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, settings, feedback, handleAnswer]);

  if (!settings || questions.length === 0 || currentIndex >= questions.length) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex) / questions.length) * 100;
  
  const currentScore = answers.filter(a => a.correct).length;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pt-8">
        <div className="flex justify-between items-end mb-4 text-sm text-muted-foreground font-mono">
          <div>
            Score: <span className="font-semibold text-foreground">{currentScore}</span>
          </div>
          <div>
            Time: <span className="font-semibold text-foreground">{formatTime(timeTaken)}</span>
          </div>
        </div>
        
        <Progress value={progressPercent} className="h-2 mb-12" />
        
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-widest">
            Question {currentIndex + 1} of {questions.length}
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className={`w-64 h-64 md:w-80 md:h-80 flex items-center justify-center rounded-3xl bg-card border-2 shadow-sm mb-12
                ${feedback === "correct" ? "border-green-500 bg-green-50 dark:bg-green-950/30" : ""}
                ${feedback === "incorrect" ? "border-destructive bg-destructive/5" : ""}
                ${feedback === null ? "border-border" : ""}
                transition-colors duration-200
              `}
            >
              <span className="text-8xl md:text-[8rem] font-serif text-foreground">
                {currentQ?.kana}
              </span>
            </motion.div>
          </AnimatePresence>

          {settings.quizMode === "multiple-choice" ? (
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              {options.map((opt, i) => (
                <Button
                  key={opt}
                  variant="outline"
                  size="lg"
                  className={`h-16 text-xl font-mono relative overflow-hidden group
                    ${feedback !== null ? "pointer-events-none" : "hover:border-primary hover:bg-primary/5"}
                    ${feedback !== null && opt === currentQ.reading ? "bg-green-100 border-green-500 text-green-700 dark:bg-green-900/40 dark:text-green-300" : ""}
                    ${feedback === "incorrect" && opt !== currentQ.reading ? "opacity-50" : ""}
                  `}
                  onClick={() => handleAnswer(opt)}
                >
                  <span className="absolute top-1 left-2 text-xs text-muted-foreground opacity-50">{i + 1}</span>
                  {opt}
                </Button>
              ))}
            </div>
          ) : (
            <form 
              onSubmit={(e) => { e.preventDefault(); handleAnswer(typedAnswer); }}
              className="w-full max-w-sm flex gap-3"
            >
              <Input
                type="text"
                placeholder="Type reading (romaji)..."
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                disabled={feedback !== null}
                autoFocus
                className="h-14 text-xl font-mono text-center"
              />
              <Button type="submit" disabled={!typedAnswer || feedback !== null} className="h-14 px-8">
                Enter
              </Button>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
