"use client";

import { motion } from "motion/react";
import SectionLabel from "../components/SectionLabel";
import Spotlight from "../components/bits/Spotlight";
import { LoadDisc } from "../components/LoadLine";

const CARDS = [
  {
    kicker: "OPTION 01",
    title: "DISCLOSE EVERYTHING",
    body: "Now the counterparty knows exactly how hard to squeeze — and so does anyone they leak the balance sheet to.",
    inverted: false,
  },
  {
    kicker: "OPTION 02",
    title: "TRUST THE WORD",
    body: "An agent's assurance is worth nothing. Ask it for a number and you get marketing.",
    inverted: false,
  },
  {
    kicker: "OPTION 03 — PLIMSOLL",
    title: "ASK THE LINE",
    body: "Is this agent above the line? Yes or no. One bit, attested onchain. That is the whole product.",
    inverted: true,
  },
];

export default function TheQuestion() {
  return (
    <section id="question" className="scroll-mt-24 border-b border-ink/10">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <SectionLabel index="01" title="THE QUESTION" className="mb-12" />

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {CARDS.map((c, i) => (
            <motion.article
              key={c.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
              className={
                c.inverted
                  ? "border border-ink bg-ink text-paper shadow-[6px_6px_0_0_#0a0a0a] transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#d71921]"
                  : "border border-ink/20 bg-paper shadow-[6px_6px_0_0_rgba(10,10,10,0.12)] transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-ink hover:shadow-[8px_8px_0_0_rgba(10,10,10,0.2)]"
              }
            >
              <Spotlight
                className="flex h-full flex-col p-7 md:p-8"
                spotlightColor={
                  c.inverted ? "rgba(250,250,247,0.08)" : "rgba(10,10,10,0.05)"
                }
              >
                {c.inverted && (
                  <LoadDisc className="mb-6 h-5 w-12 text-paper" />
                )}
                <p
                  className={`label-mono ${
                    c.inverted ? "text-paper/50" : "text-ink/50"
                  }`}
                >
                  {c.kicker}
                </p>
                <h3 className="mt-4 font-doto text-2xl font-black tracking-tight md:text-[1.7rem]">
                  {c.title}
                </h3>
                <p
                  className={`mt-4 flex-1 text-sm leading-relaxed ${
                    c.inverted ? "text-paper/70" : "text-ink/70"
                  }`}
                >
                  {c.body}
                </p>
                {c.inverted && (
                  <p className="label-mono mt-6 text-signal">
                    → IS THIS AGENT ABOVE THE LINE?
                  </p>
                )}
              </Spotlight>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
