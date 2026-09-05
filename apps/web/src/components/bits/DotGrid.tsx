"use client";

import { useEffect, useRef } from "react";

type DotGridProps = {
  dotSize?: number;
  spacing?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  className?: string;
};

/** Cursor-reactive dot grid on canvas. pointer-events: none; listens on window. */
export default function DotGrid({
  dotSize = 2,
  spacing = 26,
  baseColor = "rgba(10,10,10,0.10)",
  activeColor = "rgba(215,25,33,0.55)",
  proximity = 140,
  className = "",
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dots: { x: number; y: number }[] = [];
    const mouse = { x: -9999, y: -9999 };
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = spacing / 2; y < h; y += spacing) {
        for (let x = spacing / 2; x < w; x += spacing) {
          dots.push({ x, y });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      for (const d of dots) {
        const dist = Math.hypot(d.x - mouse.x, d.y - mouse.y);
        const t = Math.max(0, 1 - dist / proximity);
        const r = dotSize / 2 + t * dotSize * 1.4;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = t > 0.001 ? activeColor : baseColor;
        ctx.globalAlpha = 1;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [dotSize, spacing, baseColor, activeColor, proximity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
