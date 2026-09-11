"use client";

import { motion } from "motion/react";
import SectionLabel from "../components/SectionLabel";

const TERMS: { term: string; def: string }[] = [
  {
    term: "HOLD",
    def: "The subject's private balance sheet. It never leaves the enclave.",
  },
  {
    term: "LINE",
    def: "The threshold predicate being tested. e.g. observed_net_assets_usd ≥ 250,000.",
  },
  {
    term: "SURVEY",
    def: "One confidential workflow execution. Costs cents, paid by whoever benefits.",
  },
  {
    term: "MARK",
    def: "The signed onchain boolean. Verdict plus metadata. No amounts.",
  },
  {
    term: "STANDING",
    def: "An unbroken run of true Marks across a window. What a counterparty actually underwrites against.",
  },
];

export default function Glossary() {
  return (
    <section id="glossary" className="scroll-mt-24 border-b border-ink/10">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <SectionLabel index="03" title="THE GLOSSARY" className="mb-12" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
          {TERMS.map((t, i) => (
            <motion.article
              key={t.term}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
              className="border border-ink/20 bg-paper p-6 transition-colors hover:border-ink"
            >
              <span className="font-doto text-sm font-black text-signal">
                0{i + 1}
              </span>
              <h3 className="mt-4 font-doto text-xl font-black tracking-tight">
                {t.term}
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-ink/70">
                {t.def}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
