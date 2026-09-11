"use client";

import { useCallback, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

type Spark = { id: number; x: number; y: number; angle: number };

type ClickSparkProps = {
  children: ReactNode;
  sparkColor?: string;
  sparkCount?: number;
  sparkSize?: number;
  className?: string;
};

/** Emits radiating hairline sparks from the click point inside the wrapper. */
export default function ClickSpark({
  children,
  sparkColor = "#0A0A0A",
  sparkCount = 6,
  sparkSize = 10,
  className = "",
}: ClickSparkProps) {
  const [sparks, setSparks] = useState<Spark[]>([]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = Date.now();
      const batch: Spark[] = Array.from({ length: sparkCount }, (_, i) => ({
        id: now * 1000 + i,
        x,
        y,
        angle: (360 / sparkCount) * i + Math.random() * 20,
      }));
      setSparks((s) => [...s, ...batch]);
      window.setTimeout(
        () => setSparks((s) => s.filter((sp) => !batch.some((b) => b.id === sp.id))),
        600,
      );
    },
    [sparkCount],
  );

  return (
    <div onClick={onClick} className={`relative inline-block ${className}`}>
      {children}
      <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        <AnimatePresence>
          {sparks.map((s) => (
            <motion.span
              key={s.id}
              className="absolute h-px origin-left"
              style={{
                left: s.x,
                top: s.y,
                width: sparkSize,
                background: sparkColor,
                rotate: s.angle,
              }}
              initial={{ opacity: 1, scaleX: 0.2, x: 0 }}
              animate={{ opacity: 0, scaleX: 1, x: sparkSize }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
