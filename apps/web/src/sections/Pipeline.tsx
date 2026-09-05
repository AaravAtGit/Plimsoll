"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import SectionLabel from "../components/SectionLabel";
import ScrambleText from "../components/bits/ScrambleText";
import StarBorder from "../components/bits/StarBorder";
import { LoadDisc } from "../components/LoadLine";

/* ---------------------------------- hooks --------------------------------- */

/**
 * The scroll-scrubbed pipeline is desktop-only; narrow viewports get a
 * native snap carousel. prefers-reduced-motion does NOT trigger the fallback —
 * the scrub is tied to user scrolling, not autoplaying motion. Decorative
 * animations are tamed globally via MotionConfig instead.
 */
function useIsMobileViewport() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

/** The valuation number counts up, holds 400ms, then redacts to blocks. */
function RedactedValue() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const [phase, setPhase] = useState<"idle" | "counting" | "redacted">("idle");
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    setPhase("counting");
    const controls = animate(0, 287_400, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    const t = window.setTimeout(
      () => setPhase("redacted"),
      1_900, // 1.5s count + 400ms hold, then gone
    );
    return () => {
      controls.stop();
      window.clearTimeout(t);
    };
  }, [inView]);

  return (
    <div ref={ref} className="font-doto text-5xl font-black tracking-tight md:text-7xl">
      {phase === "redacted" ? (
        <span className="relative inline-block text-signal">
        ██████
          <span
            aria-hidden
            className="absolute left-[-4%] top-1/2 h-[3px] w-[108%] -rotate-2 bg-signal"
          />
        </span>
      ) : (
        <span className={phase === "idle" ? "text-paper/30" : "text-paper"}>
          {phase === "idle" ? "000,000" : Math.round(val).toLocaleString("en-US")}
        </span>
      )}
      <span className="ml-3 align-top font-mono text-xs tracking-[0.2em] text-paper/40">
        USD · HAIRCUT VALUE
      </span>
    </div>
  );
}

/* --------------------------------- panels --------------------------------- */

function GhostNumber({ n, dark = false }: { n: string; dark?: boolean }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -top-4 right-4 select-none font-doto text-[34vw] font-black leading-none md:text-[24vw] ${
        dark ? "text-paper/[0.04]" : "text-ink/[0.05]"
      }`}
    >
      {n}
    </span>
  );
}

function PanelFrame({
  children,
  dark = false,
  n,
}: {
  children: React.ReactNode;
  dark?: boolean;
  n: string;
}) {
  return (
    <div
      className={`relative flex h-full w-full items-center overflow-hidden px-5 md:px-24 ${
        dark ? "bg-enclave text-paper" : "bg-paper text-ink"
      }`}
    >
      {dark && <div className="dot-bg-static absolute inset-0" aria-hidden />}
      <GhostNumber n={n} dark={dark} />
      <div className="relative z-10 mx-auto w-full max-w-6xl">{children}</div>
    </div>
  );
}

function PanelQuestion() {
  const rows: [string, string, boolean?][] = [
    ["DEAL", "60 ETH of GPU-hours · net-30"],
    ["PRICE", "ETH/USD $4,100 · chainlink-price · round 0x9C4B"],
    ["EXPOSURE", "60 × $4,100 = $246,000"],
    ["LINE", "observed_net_assets_usd ≥ 250,000", true],
  ];
  return (
    <PanelFrame n="01">
      <SectionLabel index="02" title="THE SURVEY" />
      <div className="mt-8">
        <h2 className="font-doto text-4xl font-black tracking-tight md:text-6xl">
          60 ETH, NET-30.
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink/70 md:text-base">
          A buyer agent wants compute released before payment. The counterparty
          derives the Line from the exposure — priced, not guessed.
        </p>

        <dl className="mt-10 border-t border-ink/15">
          {rows.map(([k, v, red]) => (
            <div
              key={k}
              className="flex flex-col gap-1 border-b border-ink/15 py-4 md:flex-row md:items-baseline md:gap-8"
            >
              <dt className="label-mono w-28 shrink-0 text-ink/50">{k}</dt>
              <dd
                className={`font-mono text-sm md:text-base ${
                  red ? "font-medium text-signal" : "text-ink"
                }`}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 font-mono text-xs text-ink/50">
          // the Line is derived from the price — rounded up to the subject's
          registered ladder
        </p>
      </div>
    </PanelFrame>
  );
}

function PanelHold() {
  return (
    <PanelFrame n="02" dark>
      <SectionLabel index="02" title="THE SURVEY" dark />
      <div className="mt-8">
        <p className="label-mono mb-6 flex items-center gap-3 text-paper/60">
          <span className="h-1.5 w-1.5 animate-pulse-dot bg-signal" />
          cre.handlerInTee · AWS NITRO · us-west-2
        </p>
        <h2 className="font-doto text-4xl font-black tracking-tight md:text-6xl">
          INSIDE THE ENCLAVE.
        </h2>

        <div className="mt-10 max-w-2xl border border-paper/25">
          <div className="border-b border-paper/25 px-5 py-2.5">
            <span className="label-mono text-paper/50">ENCLAVE / SURVEY HANDLER</span>
          </div>
          <pre className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-7 text-paper/85 md:text-sm">
            <code>
              <span className="text-paper/40">{"// secrets released by the Vault DON, decrypted in-enclave only"}</span>
              {"\n"}runtime.getSecret({"{ id: "}
              <span className="text-signal">
                <ScrambleText text={'"CEX_RO_0x7fA2…"'} />
              </span>
              {" }"}){"\n\n"}
              <span className="text-paper/40">{"// private holdings — fetched from inside the TEE"}</span>
              {"\n"}HTTPClient.sendRequest(runtime, hold){"\n"}
              HTTPClient.sendRequest(runtime, prices){"\n"}
            </code>
          </pre>
        </div>
        <p className="mt-6 font-mono text-xs text-paper/50">
          // never logged · never emitted · never written
        </p>
      </div>
    </PanelFrame>
  );
}

function PanelValuation() {
  const haircuts: [string, string][] = [
    ["USDC · USDT", "1.00"],
    ["ETH · WETH · BTC", "0.90"],
    ["EVERYTHING ELSE ALLOWLISTED", "0.75"],
  ];
  return (
    <PanelFrame n="03" dark>
      <SectionLabel index="02" title="THE SURVEY" dark />
      <div className="mt-8">
        <h2 className="font-doto text-4xl font-black tracking-tight md:text-6xl">
          VALUED, THEN HIDDEN.
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-paper/60 md:text-base">
          Oracle-mid prices ignore liquidation slippage, so every asset takes a
          published haircut before the Line is evaluated.
        </p>

        <div className="mt-10 max-w-2xl">
          {haircuts.map(([asset, factor]) => (
            <div
              key={asset}
              className="flex items-baseline justify-between border-b border-paper/20 py-4"
            >
              <span className="font-mono text-sm text-paper/80">{asset}</span>
              <span className="font-doto text-xl font-black text-paper">
                {factor}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <RedactedValue />
          <p className="mt-3 font-mono text-xs text-paper/50">
            // you don't get to see this. neither does the node operator.
          </p>
        </div>
      </div>
    </PanelFrame>
  );
}

function PanelCrossing() {
  const forbidden = ["balance", "price", "headroom", "ratio", "netAssets"];
  return (
    <div className="relative flex h-full w-full flex-col md:flex-row">
      {/* left: enclave */}
      <div className="relative flex min-h-0 w-full flex-1 items-center overflow-hidden bg-enclave px-5 py-14 text-paper md:w-1/2 md:px-16 md:py-0">
        <div className="dot-bg-static absolute inset-0" aria-hidden />
        <GhostNumber n="04" dark />
        <div className="relative z-10">
          <SectionLabel index="02" title="THE SURVEY" dark />
          <div className="mt-8 max-w-md">
            <div className="border border-paper/25 bg-enclave/60 px-5 py-4 font-mono text-[13px] leading-7 text-paper/85 md:text-sm">
              <code>
                <span className="text-paper/40">{"// runtime.usingTheDons()"}</span>
                {"\n"}report({"{"}
                {"\n"}  surveyId,{"\n"}  subjectId,{"\n"}  lineId,{"\n"}  verdict,{"\n"}  asOf,{"\n"}  sourceSetHash,{"\n"}
                {"}"})
              </code>
            </div>
            <p className="mt-6 font-mono text-xs text-paper/50">
              // the crossing payload is the entire privacy claim
            </p>
          </div>
        </div>
      </div>

      {/* the door */}
      <div className="relative z-10 h-[2px] w-full shrink-0 bg-signal md:h-full md:w-[2px]" aria-hidden>
        <LoadDisc className="absolute left-1/2 top-1/2 h-6 w-16 -translate-x-1/2 -translate-y-1/2 bg-enclave text-paper" />
      </div>

      {/* right: DON */}
      <div className="relative flex min-h-0 w-full flex-1 items-center overflow-hidden bg-paper px-5 py-14 text-ink md:w-1/2 md:px-16 md:py-0">
        <div className="max-w-md">
          <h2 className="font-doto text-3xl font-black tracking-tight md:text-5xl">
            THE ONE-WAY DOOR.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink/70 md:text-base">
            Whatever crosses <span className="font-mono text-sm">usingTheDons()</span>{" "}
            executes on DON nodes like any public call. So only the verdict
            crosses. Everything else stays below deck.
          </p>
          <ul className="mt-8 space-y-2.5">
            {forbidden.map((f) => (
              <li key={f} className="flex items-center gap-3 font-mono text-sm text-ink/40">
                <span className="inline-block h-px w-5 bg-signal" />
                <span className="line-through decoration-signal">{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 font-mono text-xs text-ink/50">
            // consensus verifies the enclave attestation, then signs the report
          </p>
        </div>
      </div>
    </div>
  );
}

function PanelMark() {
  const fields: [string, string][] = [
    ["VERDICT", "ABOVE"],
    ["AS OF", "2026-09-15 09:41:07 UTC"],
    ["EXPIRY", "+300s"],
    ["SURVEY ID", "0x3f9a…c21"],
    ["WORKFLOW", "wf_plimsoll_v12"],
    ["SOURCE SET", "0x91d4…d40e"],
  ];
  return (
    <PanelFrame n="05">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <SectionLabel index="02" title="THE SURVEY" />
          <h2 className="mt-8 font-doto text-4xl font-black tracking-tight md:text-6xl">
            ONE BIT,
            <br />
            ONCHAIN.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/70 md:text-base">
            A Mark lands on Sepolia — signed by the Workflow DON, verified
            against the enclave attestation. Public and verifiable. Containing
            nothing.
          </p>
          <p className="mt-6 font-mono text-xs text-ink/50">
            // PlimsollRegistry.postMark() · onlyForwarder
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="border border-ink bg-paper p-7 shadow-[8px_8px_0_0_#0a0a0a] md:p-9"
        >
          <div className="flex items-center justify-between">
            <span className="label-mono text-ink/50">MARK · SEPOLIA</span>
            <LoadDisc className="h-4 w-10 text-ink/60" />
          </div>

          <StarBorder className="mt-6 inline-block">
            <span className="label-mono flex items-center gap-2.5 bg-paper px-4 py-2.5 font-doto text-base font-black">
              <span className="h-1.5 w-1.5 bg-signal" />
              ABOVE
            </span>
          </StarBorder>

          <dl className="mt-7 border-t border-ink/15">
            {fields.map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-6 border-b border-ink/15 py-2.5"
              >
                <dt className="label-mono text-ink/50">{k}</dt>
                <dd
                  className={`font-mono text-xs md:text-sm ${
                    k === "VERDICT" ? "text-signal" : "text-ink"
                  }`}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </PanelFrame>
  );
}

/* -------------------------------- pipeline -------------------------------- */

export default function Pipeline() {
  const fallback = useIsMobileViewport();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 30, mass: 0.5 });
  const x = useTransform(smooth, [0, 1], ["0vw", "-400vw"]);
  const [idx, setIdx] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setIdx(Math.min(4, Math.floor(v * 5)));
  });

  const panels = [
    <PanelQuestion key="q" />,
    <PanelHold key="h" />,
    <PanelValuation key="v" />,
    <PanelCrossing key="c" />,
    <PanelMark key="m" />,
  ];

  if (fallback) {
    return (
      <section id="survey" className="scroll-mt-24 border-y border-ink/10">
        <div className="snap-x snap-mandatory overflow-x-auto">
          <div className="flex">
            {panels.map((p) => (
              <div
                key={p.key}
                className="flex w-screen shrink-0 snap-center items-stretch"
              >
                <div className="min-h-[85vh] w-full">{p}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="label-mono border-t border-ink/10 py-3 text-center text-ink/50">
          SWIPE THE SURVEY →
        </p>
      </section>
    );
  }

  return (
    <section id="survey" ref={sectionRef} className="relative h-[500vh]">
      <div className="sticky top-0 h-screen overflow-hidden border-y border-ink/10">
        <motion.div style={{ x }} className="flex h-full w-max">
          {panels.map((p) => (
            <div key={p.key} className="h-full w-screen shrink-0">
              {p}
            </div>
          ))}
        </motion.div>

        {/* the load line fills as the survey progresses */}
        <div className="absolute inset-x-0 bottom-0 px-5 pb-6 md:px-8">
          <div className="flex items-center gap-4">
            <span className="label-mono shrink-0 text-ink/60">
              0{idx + 1}—05
            </span>
            <div className="relative h-px flex-1 bg-ink/15">
              <motion.div
                className="absolute inset-y-0 left-0 h-[2px] origin-left bg-signal"
                style={{ scaleX: smooth }}
              />
            </div>
            <span className="label-mono shrink-0 text-ink/60">
              THE SURVEY
            </span>
          </div>
        </div>

        {idx === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="label-mono absolute bottom-16 left-1/2 -translate-x-1/2 text-ink/40"
          >
            KEEP SCROLLING — THE SURVEY MOVES SIDEWAYS →
          </motion.p>
        )}
      </div>
    </section>
  );
}
