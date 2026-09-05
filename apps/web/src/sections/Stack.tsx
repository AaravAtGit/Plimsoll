"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import SectionLabel from "@/components/SectionLabel";
import ScrambleText from "@/components/bits/ScrambleText";

const CHAINLINK = [
  "CRE CONFIDENTIAL WORKFLOWS",
  "AWS NITRO ENCLAVE · us-west-2",
  "PRICE FEEDS",
  "VAULT DON",
  "SEPOLIA",
];

const BAZANTIC = [
  "X402-PAID SURVEY GATEWAY",
  "MCP SERVER",
  "RECIPE: request_mark",
  "RECIPE: underwrite_counterparty",
];

const EASE = [0.22, 1, 0.36, 1] as const;

function StackCard({
  title,
  rows,
  accent = false,
}: {
  title: string;
  rows: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={`h-full border p-7 transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 md:p-9 ${
        accent
          ? "border-ink bg-ink text-paper shadow-[6px_6px_0_0_#d71921] hover:shadow-[8px_8px_0_0_#d71921]"
          : "border-ink/20 bg-paper hover:border-ink hover:shadow-[6px_6px_0_0_rgba(10,10,10,0.15)]"
      }`}
    >
      <h3 className="font-doto text-2xl font-black tracking-tight md:text-3xl">
        {title}
      </h3>
      <ul
        className="mt-6 border-t pt-1"
        style={{
          borderColor: accent ? "rgba(250,250,247,0.2)" : "rgba(10,10,10,0.15)",
        }}
      >
        {rows.map((r, i) => (
          <motion.li
            key={r}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{
              delay: 0.25 + i * 0.07,
              duration: 0.35,
              ease: "easeOut",
            }}
            className="group/row flex items-center gap-3 border-b py-3 font-mono text-xs md:text-sm"
            style={{
              borderColor: accent
                ? "rgba(250,250,247,0.2)"
                : "rgba(10,10,10,0.15)",
            }}
          >
            <span className="h-1.5 w-1.5 shrink-0 bg-signal transition-transform duration-200 group-hover/row:scale-150" />
            <span className="transition-transform duration-200 group-hover/row:translate-x-1">
              {r}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/** The center column: scrambled label, nudging arrow, and a red data pulse on a track. */
function DataFlow() {
  return (
    <div className="flex flex-row items-center justify-center gap-4 md:flex-col md:gap-3">
      <span className="label-mono text-ink/60">
        <ScrambleText text="DATA MOVES" />
      </span>

      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ delay: 0.4, duration: 0.4, ease: EASE }}
        className="flex h-12 w-12 items-center justify-center border border-ink/20 bg-paper"
      >
        <motion.span
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowRight
            className="h-5 w-5 rotate-90 text-signal md:rotate-0"
            strokeWidth={1.5}
          />
        </motion.span>
      </motion.div>

      <div className="flex flex-col items-center gap-2">
        <span className="label-mono text-ink/50">PRICE → LINE → VERDICT</span>
        <div className="relative h-px w-24 bg-ink/15">
          <motion.span
            animate={{ left: ["0%", "100%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[3px] h-[7px] w-[7px] bg-signal"
          />
        </div>
      </div>
    </div>
  );
}

export default function Stack() {
  return (
    <section id="stack" className="scroll-mt-24 border-b border-ink/10">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <SectionLabel index="05" title="THE STACK" className="mb-12" />

        <div className="relative grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            <StackCard title="CHAINLINK" rows={CHAINLINK} />
          </motion.div>

          <DataFlow />

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ delay: 0.1, duration: 0.55, ease: EASE }}
          >
            <StackCard title="BAZANTIC" rows={BAZANTIC} accent />
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="label-mono mt-12 flex flex-wrap gap-x-3 gap-y-2 text-ink/50"
        >
          <span>ETHONLINE 2026</span>
          <span className="text-signal">·</span>
          <span>START FRESH</span>
          <span className="text-signal">·</span>
          <span>SEPOLIA TESTNET ONLY</span>
          <span className="text-signal">·</span>
          <span>NO MAINNET ANYTHING</span>
        </motion.p>
      </div>
    </section>
  );
}
