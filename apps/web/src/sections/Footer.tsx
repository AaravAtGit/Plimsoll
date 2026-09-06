"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Magnet from "../components/bits/Magnet";
import ClickSpark from "../components/bits/ClickSpark";
import { LoadDisc } from "../components/LoadLine";

const LINKS = [
  { label: "CONSOLE DASHBOARD", href: "/dashboard" },
  { label: "PROTOCOL GUIDE", href: "/guide" },
  { label: "REGISTRY ON SEPOLIA", href: "https://sepolia.etherscan.io" },
  { label: "BAZANTIC RECIPES", href: "/dashboard" },
];

export default function Footer() {
  return (
    <footer className="dot-bg-static relative bg-enclave text-paper">
      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-10 pt-24 md:px-8 md:pt-32">
        <div className="flex flex-col items-center text-center">
          <p className="label-mono mb-8 text-paper/50">
            THE QUESTION IS ONE BIT. SO IS THE ANSWER.
          </p>
          <h2 className="shiny-text font-doto text-[clamp(3rem,11vw,9rem)] font-black leading-none tracking-tight">
            ASK THE LINE.
          </h2>

          <Magnet strength={0.25} className="mt-12">
            <ClickSpark sparkColor="#FAFAF7">
              <Link
                href="/dashboard"
                className="label-mono flex items-center gap-2 border border-paper bg-paper px-8 py-4 text-ink transition-colors hover:bg-signal hover:border-signal hover:text-paper"
              >
                OPEN CONSOLE
                <ArrowUpRight size={14} strokeWidth={1.5} />
              </Link>
            </ClickSpark>
          </Magnet>
        </div>

        <div className="mt-24 flex flex-col items-center gap-6 border-t border-paper/15 pt-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-2.5">
            <LoadDisc className="h-4 w-10 text-paper/70" />
            <span className="font-doto text-base font-black">PLIMSOLL</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="label-mono flex items-center gap-1 text-paper/60 transition-colors hover:text-signal"
              >
                {l.label}
                <ArrowUpRight size={11} strokeWidth={1.5} />
              </a>
            ))}
          </nav>
        </div>

        <p className="label-mono mt-10 text-center font-medium tracking-[0.3em] text-signal">
          NEVER LOGGED · NEVER WRITTEN · NEVER SEEN
        </p>
      </div>
    </footer>
  );
}
