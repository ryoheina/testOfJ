import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateQuizSession, useSubmitQuizResult } from "@workspace/api-client-react";
import { getKanaSet, shuffle, generateChoices, getGrade, type Kana } from "@/lib/kana-data";
import { KanaBackground } from "@/components/KanaBackground";

type AnswerState = "idle" | "correct" | "wrong";
type QuizMode = "hiragana" | "katakana" | "mixed";

interface QuizQuestion {
  kana: Kana;
  choices: string[];
}

interface SubmittedAnswer {
  kana: string;
  romaji: string;
  userAnswer: string;
  correct: boolean;
}

export default function QuizPage() {
  const [, setLocation] = useLocation();

  // Read URL params once on mount — not reactive, quiz doesn't change mid-session
  const paramsRef = useRef(new URLSearchParams(window.location.search));
  const mode = ((paramsRef.current.get("mode") as QuizMode) || "hiragana");
  const playerName = paramsRef.current.get("name") ?? undefined;
  const totalQuestions = Math.max(5, Math.min(92, parseInt(paramsRef.current.get("count") ?? "20", 10) || 20));

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<SubmittedAnswer[]>([]);
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());
  const [typingMode, setTypingMode] = useState(false);
  const [typedValue, setTypedValue] = useState("");
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use refs so finishQuiz always gets the latest values without stale closures
  const sessionIdRef = useRef<number | null>(null);
  const sessionCreatedRef = useRef(false); // prevent double session creation
  const submittedRef = useRef(false);      // prevent double submission

  const createSession = useCreateQuizSession();
  const submitResult = useSubmitQuizResult();

  useEffect(() => {
    // Guard: only create one session per quiz mount
    if (sessionCreatedRef.current) return;
    sessionCreatedRef.current = true;

    const kanaPool = getKanaSet(mode);
    const shuffled = shuffle(kanaPool).slice(0, totalQuestions);
    const qs: QuizQuestion[] = shuffled.map(k => ({
      kana: k,
      choices: generateChoices(k, kanaPool),
    }));
    setQuestions(qs);

    createSession.mutate(
      { data: { quizType: mode, totalQuestions, playerName } },
      { onSuccess: (s) => { sessionIdRef.current = s.id; } }
    );
  // Empty deps: quiz params come from URL and never change mid-session
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestion = questions[currentIndex];

  const finishQuiz = useCallback((finalAnswers: SubmittedAnswer[], finalScore: number) => {
    // Guard: submit only once
    if (submittedRef.current) return;
    submittedRef.current = true;

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    const percentage = (finalScore / totalQuestions) * 100;
    const grade = getGrade(percentage);

    const sid = sessionIdRef.current;
    if (sid) {
      submitResult.mutate(
        {
          sessionId: sid,
          data: {
            score: finalScore,
            totalQuestions,
            timeTakenSeconds: timeTaken,
            answers: finalAnswers,
          },
        },
        {
          onSuccess: (result) => {
            setLocation(`/results?id=${result.id}`);
          },
          onError: () => {
            setLocation(`/results?score=${finalScore}&total=${totalQuestions}&time=${timeTaken}&grade=${grade}&pct=${Math.round(percentage)}`);
          },
        }
      );
    } else {
      setLocation(`/results?score=${finalScore}&total=${totalQuestions}&time=${timeTaken}&grade=${grade}&pct=${Math.round(percentage)}`);
    }
  }, [startTime, totalQuestions, submitResult, setLocation]);

  const handleAnswer = useCallback((choice: string) => {
    if (answerState !== "idle" || !currentQuestion) return;
    const correct = choice === currentQuestion.kana.romaji;
    setSelectedChoice(choice);
    setAnswerState(correct ? "correct" : "wrong");
    if (!correct) setShakeKey(k => k + 1);
    const newAnswers = [...answers, {
      kana: currentQuestion.kana.kana,
      romaji: currentQuestion.kana.romaji,
      userAnswer: choice,
      correct,
    }];
    setAnswers(newAnswers);
    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);

    setTimeout(() => {
      setAnswerState("idle");
      setSelectedChoice(null);
      setTypedValue("");
      if (currentIndex + 1 >= totalQuestions) {
        finishQuiz(newAnswers, newScore);
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 900);
  }, [answerState, currentQuestion, answers, currentIndex, score, totalQuestions, finishQuiz]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (answerState !== "idle") return;
      if (typingMode) return;
      if (!currentQuestion) return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < currentQuestion.choices.length) {
        handleAnswer(currentQuestion.choices[idx]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [answerState, typingMode, currentQuestion, handleAnswer]);

  useEffect(() => {
    if (typingMode && inputRef.current) inputRef.current.focus();
  }, [typingMode, currentIndex]);

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading quiz...</div>
      </div>
    );
  }

  const getChoiceStyle = (choice: string) => {
    if (answerState === "idle") {
      return "border-border/50 bg-card/60 hover:border-cyan-400/50 hover:bg-cyan-400/5 hover:scale-102 cursor-pointer";
    }
    if (choice === currentQuestion.kana.romaji) {
      return "border-cyan-400 bg-cyan-400/15 text-cyan-300 correct-pulse";
    }
    if (choice === selectedChoice && choice !== currentQuestion.kana.romaji) {
      return "border-red-500 bg-red-500/15 text-red-400";
    }
    return "border-border/20 bg-card/30 text-muted-foreground";
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <KanaBackground />

      {/* Header bar */}
      <div className="fixed top-0 left-0 right-0 z-20 px-6 py-4">
        <div className="max-w-2xl mx-auto glass-card rounded-2xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-medium">
              {currentIndex + 1} <span className="text-border">/</span> {totalQuestions}
            </span>
            <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            {playerName && (
              <span className="text-xs text-purple-400 font-medium hidden sm:block">{playerName}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-cyan-400">{score} correct</span>
            <button
              onClick={() => setTypingMode(m => !m)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                typingMode ? "border-cyan-400 text-cyan-400" : "border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {typingMode ? "Typing" : "Multiple Choice"}
            </button>
          </div>
        </div>
      </div>

      {/* Main quiz area */}
      <div className="relative z-10 w-full max-w-2xl mx-auto pt-24 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <motion.div
              key={shakeKey}
              animate={answerState === "wrong" ? { x: [-8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`text-9xl font-black mb-4 leading-none select-none ${
                answerState === "correct" ? "text-cyan-300 text-glow-cyan" :
                answerState === "wrong" ? "text-red-400" : "text-white"
              }`}
            >
              {currentQuestion.kana.kana}
            </motion.div>
            <div className="text-sm uppercase tracking-widest text-muted-foreground">
              {currentQuestion.kana.type}
            </div>
          </motion.div>
        </AnimatePresence>

        {typingMode ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={typedValue}
              onChange={e => setTypedValue(e.target.value.toLowerCase())}
              onKeyDown={e => {
                if (e.key === "Enter" && typedValue.trim()) handleAnswer(typedValue.trim());
              }}
              disabled={answerState !== "idle"}
              placeholder="Type the romaji..."
              className="flex-1 px-6 py-4 rounded-2xl glass-card border border-border/50 bg-transparent text-lg text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <button
              onClick={() => typedValue.trim() && handleAnswer(typedValue.trim())}
              disabled={answerState !== "idle" || !typedValue.trim()}
              className="px-6 py-4 rounded-2xl bg-cyan-400 text-background font-bold hover:bg-cyan-300 transition-colors disabled:opacity-40 cursor-pointer"
            >
              Check
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.choices.map((choice, i) => (
              <motion.button
                key={choice}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={answerState === "idle" ? { scale: 1.03 } : {}}
                whileTap={answerState === "idle" ? { scale: 0.97 } : {}}
                onClick={() => handleAnswer(choice)}
                disabled={answerState !== "idle"}
                className={`relative p-5 rounded-2xl border font-bold text-xl glass-card transition-all duration-200 ${getChoiceStyle(choice)}`}
              >
                <span className="text-xs absolute top-2 left-3 text-muted-foreground font-normal opacity-50">{i + 1}</span>
                {choice}
              </motion.button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {answerState !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-6 text-center text-lg font-semibold ${answerState === "correct" ? "text-cyan-400" : "text-red-400"}`}
            >
              {answerState === "correct" ? "Correct!" : `Correct: ${currentQuestion.kana.romaji}`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
