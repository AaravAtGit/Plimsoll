"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Honors prefers-reduced-motion for decorative animations: transform/layout
 * animations are disabled for those users while opacity fades remain.
 * Scroll-driven MotionValue styles (the pipeline scrub) are unaffected.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
