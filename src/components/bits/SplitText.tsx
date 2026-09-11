"use client";

import { motion } from "motion/react";

type SplitTextProps = {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
};

/** Per-character staggered entrance. Renders real text for a11y. */
export default function SplitText({
  text,
  className = "",
  delay = 0,
  stagger = 0.028,
}: SplitTextProps) {
  const chars = Array.from(text);
  return (
    <span className={className} aria-label={text} role="text">
      {chars.map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          aria-hidden
          className="inline-block will-change-transform"
          initial={{ y: "0.55em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: delay + i * stagger,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}
