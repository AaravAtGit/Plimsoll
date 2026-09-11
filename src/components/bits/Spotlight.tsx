"use client";

import { useRef, useState, type ReactNode, type CSSProperties } from "react";

type SpotlightProps = {
  children: ReactNode;
  className?: string;
  /** rgba spotlight color, e.g. "rgba(250,250,247,0.10)" */
  spotlightColor?: string;
  size?: number;
};

/** Radial highlight that follows the cursor over the card. */
export default function Spotlight({
  children,
  className = "",
  spotlightColor = "rgba(250,250,247,0.10)",
  size = 260,
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const overlay: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage: `radial-gradient(circle ${size}px at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 70%)`,
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setPos({ x: -9999, y: -9999 })}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      <div style={overlay} aria-hidden />
    </div>
  );
}
