import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { KanaBackground } from "@/components/KanaBackground";

type QuizMode = "hiragana" | "katakana" | "mixed";

const modes: { id: QuizMode; label: string; sublabel: string; kana: string; color: string; max: number }[] = [
  { id: "hiragana", label: "Hiragana", sublabel: "46 characters", kana: "あ", color: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-400/60", max: 46 },
  { id: "katakana", label: "Katakana", sublabel: "46 characters", kana: "ア", color: "from-purple-500/20 to-purple-500/5 border-purple-500/30 hover:border-purple-400/60", max: 46 },
  { id: "mixed", label: "Mixed Challenge", sublabel: "All 92 characters", kana: "混", color: "from-pink-500/20 to-pink-500/5 border-pink-500/30 hover:border-pink-400/60", max: 92 },
];

const QUESTION_OPTIONS = [10, 20, 30, 46];

export default function Home() {
  const [selected, setSelected] = useState<QuizMode | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [questionCount, setQuestionCount] = useState(20);
  const [, setLocation] = useLocation();

  const selectedMode = modes.find(m => m.id === selected);
  const maxQuestions = selectedMode?.max ?? 92;
  const effectiveCount = Math.min(questionCount, maxQuestions);

  const handleStart = () => {
    if (!selected) return;
    const params = new URLSearchParams({
      mode: selected,
      count: String(effectiveCount),
    });
    if (playerName.trim()) params.set("name", playerName.trim());
    setLocation(`/quiz?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      <KanaBackground />

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="mb-2 text-sm font-semibold tracking-[0.3em] uppercase text-cyan-400 text-glow-cyan">
            Japanese Kana Training
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-4 leading-none">
            <span className="text-white">Master</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent text-glow-cyan">
              Japanese Kana
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto leading-relaxed">
            Hiragana and Katakana training that feels as good as it works.
            Every correct answer is satisfying.
          </p>
        </motion.div>

        {/* Mode cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          {modes.map((mode, i) => (
            <motion.button
              key={mode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(mode.id)}
              className={`relative p-6 rounded-2xl border bg-gradient-to-b backdrop-blur-sm transition-all duration-300 cursor-pointer ${mode.color} ${
                selected === mode.id ? "ring-2 ring-offset-0 ring-cyan-400 scale-105" : ""
              }`}
            >
              <div className="text-5xl mb-3 font-bold">{mode.kana}</div>
              <div className="font-bold text-lg text-white">{mode.label}</div>
              <div className="text-sm text-muted-foreground mt-1">{mode.sublabel}</div>
              {selected === mode.id && (
                <motion.div layoutId="selected-ring" className="absolute inset-0 rounded-2xl ring-2 ring-cyan-400" initial={false} />
              )}
            </motion.button>
          ))}
        </motion.div>

        {/* Name + question count config */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden mb-8"
            >
              <div className="glass-card rounded-2xl border border-border/50 p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                {/* Player name */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Your Name</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    placeholder="Enter your name (optional)"
                    maxLength={40}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/50 bg-transparent text-white placeholder:text-muted-foreground focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                  />
                </div>

                {/* Question count */}
                <div className="shrink-0">
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Questions</label>
                  <div className="flex gap-2">
                    {QUESTION_OPTIONS.filter(n => n <= maxQuestions).concat(
                      maxQuestions > 46 ? [92] : []
                    ).filter((v, i, a) => a.indexOf(v) === i).map(n => (
                      <button
                        key={n}
                        onClick={() => setQuestionCount(n)}
                        className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                          effectiveCount === n || (n === maxQuestions && effectiveCount >= maxQuestions)
                            ? "border-cyan-400 bg-cyan-400/15 text-cyan-300"
                            : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            disabled={!selected}
            className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
              selected
                ? "bg-cyan-400 text-background hover:bg-cyan-300 glow-cyan cursor-pointer"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {selected && playerName.trim()
              ? `Start — ${playerName.trim()}`
              : "Start Training"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setLocation("/admin")}
            className="px-8 py-4 rounded-2xl font-semibold text-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all duration-300 glass-card cursor-pointer"
          >
            Admin Dashboard
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6"
        >
          <button
            onClick={() => setLocation("/practice")}
            className="text-sm text-muted-foreground hover:text-cyan-400 transition-colors cursor-pointer"
          >
            Practice weak kana
          </button>
        </motion.div>
      </div>
    </div>
  );
}
