import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { useEffect, useState } from "react";
import { BookOpen, Type, Sparkles } from "lucide-react";

const KANA_CHARS = ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ", "さ", "し", "す", "せ", "そ", "ア", "イ", "ウ", "エ", "オ", "カ", "キ", "ク", "ケ", "コ"];

function FloatingBackground() {
  const [particles, setParticles] = useState<{ id: number; char: string; left: string; duration: string; delay: string; fontSize: string }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      char: KANA_CHARS[Math.floor(Math.random() * KANA_CHARS.length)],
      left: `${Math.random() * 100}%`,
      duration: `${15 + Math.random() * 20}s`,
      delay: `-${Math.random() * 20}s`,
      fontSize: `${2 + Math.random() * 4}rem`
    }));
    setParticles(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
      {particles.map((p) => (
        <div
          key={p.id}
          className="floating-kana"
          style={{
            left: p.left,
            animationDuration: p.duration,
            animationDelay: p.delay,
            fontSize: p.fontSize,
          }}
        >
          {p.char}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <MainLayout>
      <FloatingBackground />
      <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl w-full"
        >
          <div className="mb-8 flex flex-col items-center">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-8xl md:text-[10rem] font-black mb-2 leading-none kana-char text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
              あ
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-gradient pb-2"
            >
              Kana Study
            </motion.h1>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-xl mx-auto font-light"
          >
            Master Hiragana and Katakana with an immersive, distraction-free learning experience.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
          >
            <Link href="/setup">
              <Button size="lg" className="h-16 px-10 text-xl rounded-full font-semibold tracking-wide bg-gradient-primary text-white border-0 hover:scale-105 transition-transform glow-blue">
                Begin Practice
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left"
          >
            {[
              { title: "46 Hiragana", desc: "Learn the foundational characters of Japanese.", icon: <BookOpen className="w-6 h-6 text-primary" /> },
              { title: "46 Katakana", desc: "Master the characters used for foreign words.", icon: <Type className="w-6 h-6 text-secondary" /> },
              { title: "Mixed Mode", desc: "Challenge yourself with both alphabets.", icon: <Sparkles className="w-6 h-6 text-accent" /> },
            ].map((feature, i) => (
              <div key={i} className="glass p-6 rounded-2xl hover:-translate-y-1 transition-transform duration-300 group">
                <div className="bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="font-serif font-semibold text-xl mb-2 text-white">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
