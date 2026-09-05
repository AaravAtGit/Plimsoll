"use client";

import { useRef, useState, type ReactNode } from "react";

type MagnetProps = {
  children: ReactNode;
  strength?: number;
  className?: string;
};

/** Attracts its child toward the cursor within its bounds. */
export default function Magnet({
  children,
  strength = 0.3,
  className = "",
}: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      className={`inline-block will-change-transform ${className}`}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: "transform 0.18s ease-out",
      }}
    >
      {children}
    </div>
  );
}
