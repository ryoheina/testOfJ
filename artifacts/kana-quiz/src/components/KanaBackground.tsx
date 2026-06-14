import { useEffect, useRef } from "react";
import { allKana } from "@/lib/kana-data";

interface Particle {
  x: number;
  y: number;
  speed: number;
  opacity: number;
  size: number;
  char: string;
  drift: number;
}

export function KanaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Particle[] = Array.from({ length: 30 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 0.2 + Math.random() * 0.4,
      opacity: 0.03 + Math.random() * 0.07,
      size: 16 + Math.random() * 32,
      char: allKana[Math.floor(Math.random() * allKana.length)].kana,
      drift: (Math.random() - 0.5) * 0.3,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.font = `${p.size}px 'Inter', sans-serif`;
        ctx.fillStyle = `rgba(0, 212, 255, ${p.opacity})`;
        ctx.fillText(p.char, p.x, p.y);
        p.y += p.speed;
        p.x += p.drift;
        if (p.y > canvas.height + 60) {
          p.y = -60;
          p.x = Math.random() * canvas.width;
          p.char = allKana[Math.floor(Math.random() * allKana.length)].kana;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
