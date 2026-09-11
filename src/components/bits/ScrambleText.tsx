"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

const GLYPHS = "!<>-_\\/[]{}=+*^?#@%&";

type ScrambleTextProps = {
  text: string;
  className?: string;
  speed?: number;
  /** cycles per reveal step */
  tick?: number;
};

/** Cyber-scramble reveal: random glyphs settle into the target text, triggered on view. */
export default function ScrambleText({
  text,
  className = "",
  speed = 35,
  tick = 2,
}: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [output, setOutput] = useState(text);

  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const total = text.length * tick;
    const id = window.setInterval(() => {
      frame++;
      const settled = Math.floor(frame / tick);
      const scrambled = text
        .split("")
        .map((ch, i) => {
          if (ch === " ") return " ";
          if (i < settled) return ch;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");
      setOutput(scrambled);
      if (frame >= total) {
        setOutput(text);
        window.clearInterval(id);
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [inView, text, speed, tick]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{output}</span>
    </span>
  );
}
