"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

type CountUpProps = {
  to: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
};

/** Counts from 0 to `to` when scrolled into view (once). */
export default function CountUp({
  to,
  duration = 1.4,
  className = "",
  prefix = "",
  suffix = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {Math.round(val).toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
