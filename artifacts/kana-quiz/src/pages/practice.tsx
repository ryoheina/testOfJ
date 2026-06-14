import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useGetMissedKana, getGetMissedKanaQueryKey } from "@workspace/api-client-react";
import { allKana, shuffle, type Kana } from "@/lib/kana-data";
import { KanaBackground } from "@/components/KanaBackground";

interface PracticeCard {
  kana: Kana;
  mastery: number;
  choices: string[];
}

function generateChoices(correct: Kana): string[] {
  const wrong = allKana
    .filter(k => k.romaji !== correct.romaji)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(k => k.romaji);
  return shuffle([correct.romaji, ...wrong]);
}

export default function PracticePage() {
  const [, setLocation] = useLocation();
  const [deck, setDeck] = useState<PracticeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerState, setAnswerState] = useState<"idle" | "correct" | "wrong">("idle");
  const [masteredCount, setMasteredCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const { data: missedKana } = useGetMissedKana({ limit: 20 }, {
    query: { queryKey: getGetMissedKanaQueryKey({ limit: 20 }) },
  });

  useEffect(() => {
    let kanaList: Kana[];
    if (missedKana && missedKana.length >= 5) {
      const missedKanaChars = missedKana.map(m => m.kana);
      kanaList = allKana.filter(k => missedKanaChars.includes(k.kana));
      if (kanaList.length < 5) {
        const extras = allKana.filter(k => !missedKanaChars.includes(k.kana)).slice(0, 10);
        kanaList = [...kanaList, ...extras];
      }
    } else {
      kanaList = shuffle(allKana).slice(0, 15);
    }
    const cards: PracticeCard[] = kanaList.map(k => ({
      kana: k,
      mastery: 0,
      choices: generateChoices(k),
    }));
    setDeck(shuffle(cards));
  }, [missedKana]);

  const currentCard = deck[currentIndex];
  const masteryNeeded = 3;

  const handleAnswer = useCallback((choice: string) => {
    if (answerState !== "idle" || !currentCard) return;
    const correct = choice === currentCard.kana.romaji;
    setAnswerState(correct ? "correct" : "wrong");
    setTotalAnswered(t => t + 1);

    setTimeout(() => {
      setAnswerState("idle");
      setDeck(prev => {
        const updated = [...prev];
        const card = { ...updated[currentIndex] };
        if (correct) {
          card.mastery = Math.min(card.mastery + 1, masteryNeeded);
        } else {
          card.mastery = Math.max(card.mastery - 1, 0);
          card.choices = generateChoices(card.kana);
        }
        updated[currentIndex] = card;

        const mastered = updated.filter(c => c.mastery >= masteryNeeded);
        setMasteredCount(mastered.length);

        const unmastered = updated.filter(c => c.mastery < masteryNeeded);
        if (unmastered.length === 0) return updated;

        const nextUnmastered = updated.findIndex(
          (c, i) => c.mastery < masteryNeeded && i !== currentIndex
        );
        setCurrentIndex(nextUnmastered >= 0 ? nextUnmastered : currentIndex);
        return updated;
      });
    }, 800);
  }, [answerState, currentCard, currentIndex]);

  const allMastered = deck.length > 0 && deck.every(c => c.mastery >= masteryNeeded);

  if (deck.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading practice session...</div>
      </div>
    );
  }

  if (allMastered) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <KanaBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center"
        >
          <div className="text-8xl font-black text-cyan-400 text-glow-cyan mb-4">完璧</div>
          <h2 className="text-3xl font-bold text-white mb-2">Mastery Achieved</h2>
          <p className="text-muted-foreground mb-8">
            You mastered all {deck.length} kana in {totalAnswered} attempts
          </p>
          <div className="flex gap-4 justify-center">
            <button
              data-testid="go-home"
              onClick={() => setLocation("/")}
              className="px-8 py-4 rounded-2xl bg-cyan-400 text-background font-bold hover:bg-cyan-300 transition-colors glow-cyan cursor-pointer"
            >
              Take a Quiz
            </button>
            <button
              data-testid="practice-again"
              onClick={() => { setDeck(d => shuffle(d.map(c => ({ ...c, mastery: 0 })))); setCurrentIndex(0); setMasteredCount(0); setTotalAnswered(0); }}
              className="px-8 py-4 rounded-2xl glass-card border border-border text-muted-foreground font-semibold hover:border-foreground/30 transition-colors cursor-pointer"
            >
              Practice Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <KanaBackground />

      <div className="relative z-10 w-full max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            data-testid="go-home"
            onClick={() => setLocation("/")}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer"
          >
            Back
          </button>
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Practice Mode</div>
            <div className="text-sm font-semibold text-white mt-1">{masteredCount} / {deck.length} mastered</div>
          </div>
          <div className="w-12" />
        </div>

        {/* Progress */}
        <div className="h-2 bg-muted rounded-full mb-10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
            animate={{ width: `${(masteredCount / deck.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Mastery dots for current card */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: masteryNeeded }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < (currentCard?.mastery ?? 0) ? "bg-cyan-400 glow-cyan" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Kana */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mb-10"
          >
            <motion.div
              animate={answerState === "wrong" ? { x: [-8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`text-9xl font-black select-none ${
                answerState === "correct" ? "text-cyan-300 text-glow-cyan" :
                answerState === "wrong" ? "text-red-400" :
                "text-white"
              }`}
            >
              {currentCard.kana.kana}
            </motion.div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">
              {currentCard.kana.type}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Choices */}
        <div className="grid grid-cols-2 gap-4">
          {currentCard.choices.map((choice, i) => {
            let style = "border-border/50 bg-card/60 hover:border-cyan-400/50 cursor-pointer";
            if (answerState !== "idle") {
              if (choice === currentCard.kana.romaji) style = "border-cyan-400 bg-cyan-400/15 text-cyan-300";
              else if (choice !== currentCard.kana.romaji && answerState === "wrong") style = "border-red-500/20 bg-card/30 text-muted-foreground";
              else style = "border-border/20 bg-card/30 text-muted-foreground";
            }
            return (
              <motion.button
                key={`${currentIndex}-${choice}`}
                data-testid={`practice-choice-${i}`}
                whileHover={answerState === "idle" ? { scale: 1.03 } : {}}
                whileTap={answerState === "idle" ? { scale: 0.97 } : {}}
                onClick={() => handleAnswer(choice)}
                disabled={answerState !== "idle"}
                className={`p-5 rounded-2xl border glass-card font-bold text-xl transition-all duration-200 ${style}`}
              >
                {choice}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
