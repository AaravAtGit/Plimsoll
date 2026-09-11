"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";

const wrapRange = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

type RowProps = {
  children: ReactNode;
  baseVelocity: number;
  scrollVelocity: MotionValue<number>;
};

function VelocityRow({
  children,
  baseVelocity,
  scrollVelocity,
}: RowProps) {
  const baseX = useMotionValue(0);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    let moveBy = direction.current * baseVelocity * (delta / 1000);
    const sv = scrollVelocity.get();
    if (sv < 0) direction.current = -1;
    else if (sv > 0) direction.current = 1;
    // add scroll-derived kick, clamped so it never runs away
    moveBy += direction.current * moveBy * Math.max(-3, Math.min(3, sv / 400));
    baseX.set(wrapRange(-50, 0, baseX.get() + moveBy));
  });

  const x = useTransform(baseX, (v) => `${v}%`);

  return (
    <motion.div style={{ x }} className="flex w-max shrink-0">
      <div className="flex shrink-0 items-center">{children}</div>
      <div className="flex shrink-0 items-center" aria-hidden>
        {children}
      </div>
    </motion.div>
  );
}

type ScrollVelocityProps = {
  text: string;
  className?: string;
  baseVelocity?: number;
};

/** Infinite marquee whose direction/impulse follows page scroll velocity. */
export default function ScrollVelocity({
  text,
  className = "",
  baseVelocity = 3,
}: ScrollVelocityProps) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const velocityFactor = useTransform(
    scrollVelocity,
    [-1200, 0, 1200],
    [-4, 0, 4],
    { clamp: false },
  );

  return (
    <div className={`overflow-hidden ${className}`}>
      <VelocityRow baseVelocity={baseVelocity} scrollVelocity={velocityFactor}>
        <span className="block whitespace-nowrap">{text}</span>
      </VelocityRow>
    </div>
  );
}
