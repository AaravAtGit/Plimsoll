"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import DotGrid from "../components/bits/DotGrid";
import SplitText from "../components/bits/SplitText";
import Magnet from "../components/bits/Magnet";
import ClickSpark from "../components/bits/ClickSpark";
import { HullLine } from "../components/LoadLine";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // the hull sinks a few px past the line mid-hero, then settles back
  const hullY = useTransform(scrollYProgress, [0, 0.5, 1], [0, 4, 0]);

  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-[calc(100vh-6.5rem)] flex-col overflow-hidden"
    >
      <DotGrid />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-5 py-16 text-center md:px-8">
        <p className="label-mono mb-8 flex items-center gap-3 text-ink/60">
          <span className="h-1.5 w-1.5 animate-pulse-dot bg-signal" />
          THE LOAD LINE FOR AUTONOMOUS AGENTS
        </p>

        <h1 className="font-doto text-[clamp(2.4rem,8.5vw,7rem)] font-black leading-[1.02] tracking-tight">
          <span className="block">
            <SplitText text="PROOF OF ENOUGH," delay={0.1} />
          </span>
          <span className="block">
            <SplitText text="NOT PROOF OF " delay={0.5} />
            <span className="text-signal">
              <SplitText text="MUCH" delay={0.85} />
            </span>
            <SplitText text="." delay={1.05} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.5, ease: "easeOut" }}
          className="mt-8 max-w-xl text-base leading-relaxed text-ink/70 md:text-lg"
        >
          A counterparty asks one question —{" "}
          <em className="not-italic font-medium text-ink">
            is this agent above the line?
          </em>{" "}
          — and a Chainlink enclave answers with a single onchain bit. No
          balances. No disclosure.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.5, ease: "easeOut" }}
          className="mt-10 flex flex-wrap items-center justify-center gap-5"
        >
          <Magnet strength={0.25}>
            <ClickSpark sparkColor="#D71921">
              <Link
                href="/dashboard"
                className="label-mono flex items-center gap-2 border border-ink bg-ink px-7 py-3.5 text-paper transition-colors hover:bg-signal hover:border-signal"
              >
                OPEN PROTOCOL CONSOLE
                <ArrowUpRight size={14} strokeWidth={1.5} />
              </Link>
            </ClickSpark>
          </Magnet>
          <Link
            href="/guide"
            className="label-mono border-b border-ink/40 pb-0.5 text-ink/70 transition-colors hover:border-signal hover:text-signal"
          >
            READ PROTOCOL GUIDE
          </Link>
        </motion.div>
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-6 md:px-8">
        <motion.div style={reduced ? undefined : { y: hullY }}>
          <HullLine className="w-full text-ink/70" />
        </motion.div>
        <p className="label-mono mt-3 flex justify-between text-ink/50">
          <span>THE SUMMER LOAD LINE</span>
          <span className="hidden sm:inline">
            THE HARBOURMASTER NEVER OPENS THE HOLD
          </span>
          <span>FIG. 01</span>
        </p>
      </div>
    </section>
  );
}
