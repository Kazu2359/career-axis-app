"use client";

import { useEffect, useState } from "react";

const CONFETTI_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  width: number;
  rotate: number;
}

function generatePieces(): Piece[] {
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.6 + Math.random() * 1.2,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    width: 6 + Math.random() * 6,
    rotate: Math.random() * 360,
  }));
}

export function Celebration({
  title,
  onDone,
}: {
  title: string;
  onDone: () => void;
}) {
  const [pieces] = useState<Piece[]>(() => generatePieces());

  useEffect(() => {
    const timer = setTimeout(onDone, 2400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti-fall absolute top-0 block rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.width * 0.6,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-celebration-pop rounded-2xl border border-accent bg-panel px-8 py-6 text-center shadow-xl">
          <div className="text-4xl">🎉</div>
          <div className="mt-2 text-lg font-bold text-foreground">
            {title}おめでとう！
          </div>
        </div>
      </div>
    </div>
  );
}
