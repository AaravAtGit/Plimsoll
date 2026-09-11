"use client";

import ScrollVelocity from "../components/bits/ScrollVelocity";

export default function Marquee() {
  return (
    <div className="border-y border-ink/10 bg-paper py-6 md:py-8">
      <ScrollVelocity
        text="ONE BIT · NO AMOUNTS · IN AN ENCLAVE · ONCHAIN · NEVER LOGGED · NEVER WRITTEN · "
        baseVelocity={2.5}
        className="font-doto text-4xl font-black tracking-tight text-ink md:text-6xl"
      />
    </div>
  );
}
