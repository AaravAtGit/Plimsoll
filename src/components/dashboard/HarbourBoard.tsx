"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {AnimatePresence, motion, useReducedMotion} from "motion/react";
import {ArrowUpRight, Check, Loader2, X} from "lucide-react";
import StarBorder from "../bits/StarBorder";
import ScrambleText from "../bits/ScrambleText";
import {LoadDisc} from "../LoadLine";

/// The Harbour Board.
///
/// One stage, one spine: the red load line runs the full width. Above it, the counterparty's
/// question - a deal, the Line it implies, the request. On it, the Mark. Below it, the sealed
/// Hold - what the subject consented to be asked, what has been answered, and whether that adds
/// up to Standing. Every value on this page is fetched from the API, which reads the chain.
/// Nothing is fixtured; the empty states are true sentences.

const SUBJECT = "0x61335871890d6e0c866ec4743b63b48d546c6c9d8acac9344c5787fbdec34838";
const SUBJECT_LABEL = "agent-solv-alpha.eth";
const REGISTRY = "0xDE76042288d04539B9e18dc1C355219567B88447";
const ETHERSCAN = "https://sepolia.etherscan.io";
const POLL_MS = 15_000;
const MARK_POLL_MS = 5_000;
const GIVE_UP_S = 180;

type Quote = {price: string; decimals: number; roundId: string; updatedAt: number; ageSeconds: number; stale: boolean};
type Rung = {lineId: number; metric: string; thresholdUsd: number; publishBelow: boolean};
type Mark = {
  surveyId: `0x${string}`; lineId: number; verdict: "ABOVE" | "BELOW" | "INDETERMINATE";
  asOf: number; expiry: number; expired: boolean; sourceSetHash: string; workflowId: string;
};
type Derivation = {quote: Quote; exposureUsd: number; line: Rung | null};
type Request = {surveyId: `0x${string}`; txHash: string; startedAt: number};
type Quota = {remaining: number; max: number; windowSeconds: number};

const short = (h: string) => `${h.slice(0, 6)}…${h.slice(-4)}`;
const usd = (n: number) => n.toLocaleString("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 2});
const usd0 = (n: number) => n.toLocaleString("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 0});
const clock = (s: number) => new Date(s * 1000).toISOString().slice(11, 19) + "Z";
const ago = (s: number) => (s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`);

async function get<T>(url: string): Promise<T> {
  const r = await fetch(url, {cache: "no-store"});
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

/** A ticking "now" in seconds, once a second, so countdowns and ages stay honest. */
function useNow() {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Poll a JSON endpoint. Keeps the last good value across failures and reports the failure. */
function usePolled<T>(url: string | null, ms: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const tick = useCallback(async () => {
    if (!url) return;
    try {
      setData(await get<T>(url));
      setError(null);
      setFetchedAt(Date.now());
    } catch (e) {
      setError((e as Error).message);
    }
  }, [url]);
  useEffect(() => {
    void tick();
    const id = setInterval(() => void tick(), ms);
    return () => clearInterval(id);
  }, [tick, ms]);
  return {data, error, fetchedAt, refresh: tick};
}

export default function HarbourBoard() {
  const now = useNow();
  const reduced = useReducedMotion();

  const price = usePolled<Quote>("/api/price/ETH-USD", POLL_MS);
  const ladder = usePolled<{ladder: Rung[]}>(`/api/ladder/${SUBJECT}`, POLL_MS);
  const marks = usePolled<{marks: Mark[]}>(`/api/marks/${SUBJECT}`, POLL_MS);
  const quota = usePolled<Quota>(`/api/quota/${SUBJECT}`, POLL_MS);

  // ---- the question ---------------------------------------------------------------------
  const [amount, setAmount] = useState("0.03");
  const [deriving, setDeriving] = useState(false);
  const [derivation, setDerivation] = useState<Derivation | null>(null);
  const [deriveError, setDeriveError] = useState<string | null>(null);

  const derive = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return setDeriveError("Enter an exposure greater than zero.");
    setDeriving(true); setDeriveError(null); setDerivation(null); setRequest(null); setRequestError(null);
    try {
      setDerivation(await get<Derivation>(`/api/line-for/ETH-USD?amount=${n}&subjectId=${SUBJECT}`));
    } catch (e) {
      setDeriveError(`Could not price the exposure: ${(e as Error).message}`);
    } finally {
      setDeriving(false);
    }
  };

  // ---- the request ----------------------------------------------------------------------
  const [requesting, setRequesting] = useState(false);
  const [request, setRequest] = useState<Request | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [landed, setLanded] = useState<Mark | null>(null);

  const requestSurvey = async () => {
    if (!derivation?.line) return;
    setRequesting(true); setRequestError(null); setLanded(null);
    try {
      const r = await fetch("/api/survey", {
        method: "POST", headers: {"content-type": "application/json"},
        body: JSON.stringify({subjectId: SUBJECT, lineId: derivation.line.lineId}),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? `HTTP ${r.status}`);
      setRequest({surveyId: body.surveyId, txHash: body.txHash, startedAt: Math.floor(Date.now() / 1000)});
    } catch (e) {
      setRequestError((e as Error).message);
    } finally {
      setRequesting(false);
      void quota.refresh();
    }
  };

  // Poll the pending Survey until the Mark lands, then refresh history.
  const pollRef = useRef<number | null>(null);
  useEffect(() => {
    if (!request || landed) return;
    const poll = async () => {
      try {
        const r = await fetch(`/api/mark/${request.surveyId}`, {cache: "no-store"});
        if (r.status === 200) {
          const {mark} = (await r.json()) as {mark: Mark};
          setLanded(mark);
          void marks.refresh();
        }
      } catch { /* transient; the next poll retries */ }
    };
    void poll();
    pollRef.current = window.setInterval(() => void poll(), MARK_POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [request, landed, marks]);

  const waited = request && !landed ? now - request.startedAt : 0;
  const gaveUp = waited > GIVE_UP_S;

  // ---- what is live ---------------------------------------------------------------------
  const history = marks.data?.marks ?? [];
  const live = useMemo(() => history.filter((m) => m.expiry > now), [history, now]);
  const liveAbove = useMemo(() => new Set(live.filter((m) => m.verdict === "ABOVE").map((m) => m.lineId)), [live]);
  const shown: Mark | null = landed ?? live[0] ?? null;
  const lastLapsed = !shown && history[0] ? now - history[0].expiry : null;

  const standingAt = derivation?.line?.thresholdUsd ?? ladder.data?.ladder[0]?.thresholdUsd ?? 50;
  const standing = usePolled<{standing: boolean}>(`/api/standing/${SUBJECT}?thresholdUsd=${standingAt}&k=3&window=86400`, POLL_MS);

  const rungs = ladder.data?.ladder ?? [];
  const selected = derivation?.line?.lineId ?? null;

  return (
    <div className="stage relative bg-enclave text-paper">
      <div className="dot-bg-static absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 md:px-8 md:pb-20 md:pt-14">
        {/* ---- header: the board and its instruments ------------------------------------- */}
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-doto text-[clamp(2.2rem,6vw,4.5rem)] font-black leading-none tracking-tight">
              HARBOUR BOARD
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/65">
              A live console over the Plimsoll registry on Sepolia. Ask whether{" "}
              <span className="font-mono text-paper">{SUBJECT_LABEL}</span> is above a line; watch the
              enclave answer with one bit.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-[13px] tabular-nums md:grid-cols-3">
            <Instrument label="ETH/USD · Chainlink">
              {price.data ? (
                <>
                  {usd(Number(price.data.price) / 10 ** price.data.decimals)}
                  <span className={`ml-2 ${price.data.stale ? "text-signal" : "text-paper/45"}`}>
                    {price.data.stale ? "stale" : `${ago(price.data.ageSeconds)} old`}
                  </span>
                </>
              ) : price.error ? <span className="text-signal">unreachable</span> : <Dots />}
            </Instrument>
            <Instrument label="Registry · Sepolia">
              <a className="link" href={`${ETHERSCAN}/address/${REGISTRY}`} target="_blank" rel="noreferrer">
                {short(REGISTRY)} <ArrowUpRight size={12} strokeWidth={1.5} className="inline" />
              </a>
            </Instrument>
            <Instrument label="Subject">
              <span title={SUBJECT}>{short(SUBJECT)}</span>
            </Instrument>
          </dl>
        </header>

        {/* ---- above the line: the question ---------------------------------------------- */}
        <section className="mt-14 grid gap-12 md:mt-20 md:grid-cols-5 md:gap-16" aria-labelledby="q">
          <div className="min-w-0 md:col-span-3">
            <h2 id="q" className="font-doto text-2xl font-black tracking-tight md:text-3xl">The question</h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-paper/65">
              A buyer wants delivery before payment. Price the exposure at Chainlink, find the lowest
              rung the subject consented to that covers it, and ask.
            </p>

            <form
              aria-busy={deriving}
              className="mt-8 flex flex-wrap items-end gap-3"
              onSubmit={(e) => { e.preventDefault(); void derive(); }}
            >
              <label className="flex flex-col gap-2">
                <span className="label-mono text-paper/55">Exposure</span>
                <span className="flex items-baseline border-b border-paper/30 focus-within:border-paper">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    className="w-32 bg-transparent py-2 font-mono text-2xl tabular-nums text-paper outline-none placeholder:text-paper/30"
                    placeholder="0.03"
                    aria-label="Exposure in ETH"
                  />
                  <span className="label-mono pb-2 text-paper/55">ETH</span>
                </span>
              </label>
              <span className="flex flex-col gap-2">
                <span className="label-mono text-paper/55">Terms</span>
                <span className="border-b border-paper/15 py-2 font-mono text-2xl text-paper/70">net-30</span>
              </span>
              <button
                type="submit"
                disabled={deriving}
                className="label-mono ml-auto border border-paper px-5 py-3 text-paper transition-colors hover:bg-paper hover:text-ink disabled:cursor-wait disabled:opacity-60 md:ml-2"
              >
                {deriving ? "Pricing…" : "Derive the Line"}
              </button>
            </form>
            {deriveError && <p role="alert" className="mt-3 text-sm text-signal">{deriveError}</p>}

            <AnimatePresence mode="wait">
              {derivation && (
                <motion.div
                  key={derivation.exposureUsd}
                  initial={reduced ? false : {opacity: 0, y: 6}}
                  animate={{opacity: 1, y: 0}}
                  transition={{duration: 0.35, ease: [0.16, 1, 0.3, 1]}}
                  className="mt-8 border-t border-paper/15 pt-6"
                >
                  <dl className="grid grid-cols-2 gap-x-8 gap-y-4 font-mono text-sm tabular-nums sm:grid-cols-3">
                    <div>
                      <dt className="label-mono text-paper/55">At oracle mid</dt>
                      <dd className="mt-1 text-lg">{usd(Number(derivation.quote.price) / 10 ** derivation.quote.decimals)}</dd>
                    </div>
                    <div>
                      <dt className="label-mono text-paper/55">Exposure</dt>
                      <dd className="mt-1 text-lg">{usd(derivation.exposureUsd)}</dd>
                    </div>
                    <div>
                      <dt className="label-mono text-paper/55">Line</dt>
                      <dd className="mt-1 text-lg">
                        {derivation.line ? (
                          <>≥ {usd0(derivation.line.thresholdUsd)} <span className="text-paper/45">rung {derivation.line.lineId}</span></>
                        ) : (
                          <span className="text-signal">none covers it</span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  {derivation.quote.stale && (
                    <p className="mt-4 text-sm text-signal">
                      The oracle round is older than the staleness guard. Do not underwrite off this price.
                    </p>
                  )}

                  {derivation.line ? (
                    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                      <StarBorder className="group">
                        <button
                          onClick={() => void requestSurvey()}
                          disabled={requesting || (!!request && !landed && !gaveUp) || derivation.quote.stale || quota.data?.remaining === 0}
                          className="label-mono flex items-center gap-2 bg-enclave px-5 py-3 text-paper transition-colors group-hover:text-signal disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {requesting ? <Loader2 size={13} className="animate-spin" /> : null}
                          {requesting ? "Sending the request" : "Request a Survey"}
                        </button>
                      </StarBorder>
                      <span className="font-mono text-[13px] tabular-nums text-paper/60">
                        {quota.data ? (
                          <>
                            <span className={quota.data.remaining === 0 ? "text-signal" : "text-paper"}>{quota.data.remaining}</span>
                            {" of "}{quota.data.max} asks left this hour
                          </>
                        ) : <Dots />}
                      </span>
                      <span className="basis-full text-xs leading-relaxed text-paper/50">
                        {quota.data?.remaining === 0
                          ? "This gateway has asked this subject as often as the registry allows in one hour. The limit is per counterparty and it is the privacy mechanism: it is what stops anyone walking the ladder. It resets within the hour."
                          : "One Sepolia transaction from the gateway. The enclave does the rest."}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-6 max-w-prose text-sm leading-relaxed text-paper/75">
                      The deal is larger than anything this subject consented to be asked about.{" "}
                      <span className="text-paper">Decline, or reduce exposure.</span> Asking at a lower
                      rung is the one thing this protocol exists to prevent.
                    </p>
                  )}
                  {requestError && <p role="alert" className="mt-4 max-w-prose text-sm leading-relaxed text-signal">{requestError}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* the request, while it runs */}
            <AnimatePresence>
              {request && !landed && (
                <motion.div
                  initial={reduced ? false : {opacity: 0}}
                  animate={{opacity: 1}}
                  exit={{opacity: 0}}
                  className="mt-8 border-t border-paper/15 pt-6 font-mono text-sm"
                >
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 bg-signal ${gaveUp ? "" : "animate-pulse-dot"}`} />
                      {gaveUp ? "No Mark after three minutes." : "Enclave running"}
                    </span>
                    <span className="tabular-nums text-paper/55">{waited}s</span>
                    <a className="link" href={`${ETHERSCAN}/tx/${request.txHash}`} target="_blank" rel="noreferrer">
                      request tx {short(request.txHash)} <ArrowUpRight size={12} strokeWidth={1.5} className="inline" />
                    </a>
                    <span className="text-paper/45">survey {short(request.surveyId)}</span>
                  </div>
                  {gaveUp && (
                    <p className="mt-3 max-w-prose text-paper/70">
                      Treat it as INDETERMINATE - which is a no. The Survey is still open onchain; if the
                      workflow answers later, the Mark will appear in the history below.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* the ladder: what the subject consented to be asked */}
          <div className="min-w-0 md:col-span-2">
            <h2 className="font-doto text-2xl font-black tracking-tight md:text-3xl">The ladder</h2>
            <p className="mt-2 text-sm leading-relaxed text-paper/65">
              The rungs {SUBJECT_LABEL} pre-registered. This <em className="not-italic text-paper">is</em> its
              disclosure - about two bits, consented rung by rung.
            </p>
            <ol className="mt-8 font-mono text-sm tabular-nums">
              {rungs.length === 0 && !ladder.error && <li className="text-paper/45"><Dots /></li>}
              {ladder.error && <li className="text-signal">Registry unreachable.</li>}
              {[...rungs].sort((a, b) => b.thresholdUsd - a.thresholdUsd).map((r) => {
                const isSel = r.lineId === selected;
                const lit = liveAbove.has(r.lineId);
                return (
                  <li key={r.lineId} className={`flex items-center gap-4 border-b border-paper/10 py-3 ${isSel ? "text-paper" : "text-paper/70"}`}>
                    <span className={`h-px w-10 shrink-0 ${isSel ? "bg-signal" : lit ? "bg-paper" : "bg-paper/30"}`} aria-hidden />
                    <span className="w-20 shrink-0 text-base">≥ {usd0(r.thresholdUsd)}</span>
                    <span className="label-mono shrink-0 text-paper/45">rung {r.lineId}</span>
                    <span className="ml-auto flex items-center gap-3 label-mono">
                      {lit && <span className="text-paper">above · live</span>}
                      {isSel && <span className="text-signal">asking</span>}
                      <span className={r.publishBelow ? "text-paper/45" : "text-paper/30"} title={r.publishBelow ? "The subject consented to a BELOW being published on this rung" : "A BELOW on this rung is masked to INDETERMINATE"}>
                        <span className="hidden sm:inline">below </span>{r.publishBelow ? "published" : "masked"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </div>

      {/* ---- the line, and the Mark on it --------------------------------------------------- */}
      <div className="relative mt-4 md:mt-8">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-signal" aria-hidden />
        <motion.div
          key={shown?.surveyId ?? "none"}
          initial={reduced || !landed ? false : {y: 10, opacity: 0}}
          animate={{y: 0, opacity: 1}}
          transition={{duration: 0.7, ease: [0.16, 1, 0.3, 1]}}
          className="relative mx-auto max-w-3xl px-5 md:px-8"
        >
          <article className="border border-paper/25 bg-enclave" aria-live="polite" aria-label="The Mark">
            <div className="flex items-center justify-between border-b border-paper/15 px-5 py-3 md:px-8">
              <span className="flex items-center gap-3">
                <LoadDisc className="h-4 w-10 text-paper" />
                <span className="label-mono text-paper/70">{landed ? "Mark landed" : shown ? "Live Mark" : "The line"}</span>
              </span>
              {shown && (
                <span className="flex items-center gap-4 label-mono tabular-nums text-paper/70">
                  <a className="link" href={`${ETHERSCAN}/address/${REGISTRY}#events`} target="_blank" rel="noreferrer">
                    on Sepolia <ArrowUpRight size={11} strokeWidth={1.5} className="inline" />
                  </a>
                  <span>expires in {Math.max(0, shown.expiry - now)}s</span>
                </span>
              )}
            </div>

            <div className="px-5 py-8 md:px-8 md:py-10">
              {shown ? (
                <>
                  <p className={`font-doto text-[clamp(3rem,9vw,6rem)] font-black leading-none tracking-tight ${shown.verdict === "ABOVE" ? "text-paper" : "text-signal"}`}>
                    {landed && !reduced ? <ScrambleText text={shown.verdict} /> : shown.verdict}
                  </p>
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-paper/70">
                    {shown.verdict === "ABOVE" && <>Observed holdings satisfied <span className="font-mono text-paper">≥ {usd0(rungs.find((r) => r.lineId === shown.lineId)?.thresholdUsd ?? 0)}</span> at <span className="font-mono text-paper">{clock(shown.asOf)}</span>, after published haircuts. Proceed while it is live.</>}
                    {shown.verdict === "BELOW" && <>They did not. Decline, or require collateral. <span className="text-paper">Do not ask at a lower rung.</span></>}
                    {shown.verdict === "INDETERMINATE" && <>No defensible answer: a source was down, a price was stale, or the subject withheld consent for a BELOW here. <span className="text-paper">Treat it as no.</span></>}
                  </p>
                  <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-[13px] tabular-nums md:grid-cols-3">
                    <Field label="surveyId" mono>{short(shown.surveyId)}</Field>
                    <Field label="asOf">{clock(shown.asOf)}</Field>
                    <Field label="expiry">{clock(shown.expiry)}</Field>
                    <Field label="sourceSetHash" mono>{short(shown.sourceSetHash)}</Field>
                    <Field label="workflowId" mono>{short(shown.workflowId)}</Field>
                    <Field label="rung">{shown.lineId}</Field>
                  </dl>
                </>
              ) : (
                <>
                  <p className="font-doto text-[clamp(2rem,6vw,3.5rem)] font-black leading-none tracking-tight text-paper/35">
                    NO LIVE MARK
                  </p>
                  <p className="mt-4 max-w-prose text-sm leading-relaxed text-paper/65">
                    {marks.error
                      ? "The registry could not be read."
                      : lastLapsed !== null
                        ? <>The last one lapsed {ago(lastLapsed)} ago. A Mark is a snapshot with a five-minute life; ask again and one lands here.</>
                        : history.length === 0 && marks.data
                          ? "No Survey has ever been run for this subject. Derive a Line above and ask."
                          : <Dots />}
                  </p>
                </>
              )}
            </div>
          </article>
        </motion.div>
      </div>

      {/* ---- below the line: the sealed hold ------------------------------------------------ */}
      <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-16 md:px-8 md:pt-24">
        <section className="grid gap-12 md:grid-cols-5 md:gap-16" aria-labelledby="hold">
          <div className="min-w-0 md:col-span-3">
            <h2 id="hold" className="font-doto text-2xl font-black tracking-tight md:text-3xl">Every Mark, ever</h2>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-paper/65">
              Read from the registry, newest first. Notice what no row contains.
            </p>
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse font-mono text-[13px] tabular-nums">
                <thead>
                  <tr className="label-code border-b border-paper/20 text-left text-paper/55">
                    <th className="py-2 pr-4 font-normal">verdict</th>
                    <th className="py-2 pr-4 font-normal">line</th>
                    <th className="py-2 pr-4 font-normal">asOf</th>
                    <th className="py-2 pr-4 font-normal">state</th>
                    <th className="py-2 font-normal">surveyId</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((m) => (
                    <tr key={m.surveyId} className={`border-b border-paper/10 ${m.expiry > now ? "text-paper" : "text-paper/55"}`}>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-2 ${m.verdict === "ABOVE" ? "" : "text-signal"}`}>
                          {m.verdict === "ABOVE" ? <Check size={13} strokeWidth={2} /> : <X size={13} strokeWidth={2} />}
                          {m.verdict}
                        </span>
                      </td>
                      <td className="py-3 pr-4">≥ {usd0(rungs.find((r) => r.lineId === m.lineId)?.thresholdUsd ?? 0)}</td>
                      <td className="py-3 pr-4">{clock(m.asOf)}</td>
                      <td className="py-3 pr-4">{m.expiry > now ? `live · ${m.expiry - now}s` : `lapsed ${ago(now - m.expiry)} ago`}</td>
                      <td className="py-3">
                        <a className="link" href={`${ETHERSCAN}/address/${REGISTRY}#events`} target="_blank" rel="noreferrer" title={m.surveyId}>
                          {short(m.surveyId)}
                        </a>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-paper/45">{marks.error ? "Registry unreachable." : marks.data ? "None yet." : <Dots />}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="min-w-0 md:col-span-2">
            <h2 className="font-doto text-2xl font-black tracking-tight md:text-3xl">Standing</h2>
            <p className="mt-2 text-sm leading-relaxed text-paper/65">
              What a lender actually underwrites against: three distinct Surveys, all above{" "}
              <span className="font-mono text-paper">{usd0(standingAt)}</span>, spanning a day. One favourable
              Mark can be flash-funded; a run cannot.
            </p>
            <p className={`mt-6 font-doto text-4xl font-black tracking-tight ${standing.data?.standing ? "text-paper" : "text-paper/40"}`}>
              {standing.data ? (standing.data.standing ? "STANDING" : "NO STANDING") : <Dots />}
            </p>
            <p className="mt-2 font-mono text-[13px] text-paper/55">
              k = 3 · window = 24h · {live.filter((m) => m.verdict === "ABOVE").length} live ABOVE now
            </p>

            <h2 className="mt-14 font-doto text-2xl font-black tracking-tight md:text-3xl">What crossed the line</h2>
            <p className="mt-2 text-sm leading-relaxed text-paper/65">
              The entire payload that leaves the enclave. Six fields; audited as one struct.
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[13px]">
              {["surveyId", "verdict", "asOf", "expiry", "sourceSetHash", "workflowId"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-paper"><span className="h-1.5 w-1.5 bg-signal" aria-hidden />{f}</li>
              ))}
            </ul>
            <p className="label-mono mt-6 text-paper/45">Never</p>
            <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[13px] text-paper/40">
              {["balance", "per-asset amount", "price used", "ratio", "headroom", "why it failed"].map((f) => (
                <li key={f} className="line-through decoration-paper/40">{f}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function Instrument({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <div className="min-w-0">
      <dt className="label-mono whitespace-nowrap text-paper/45">{label}</dt>
      <dd className="mt-1 text-paper">{children}</dd>
    </div>
  );
}

function Field({label, children}: {label: string; mono?: boolean; children: React.ReactNode}) {
  return (
    <div>
      <dt className="label-code text-paper/45">{label}</dt>
      <dd className="mt-1 text-paper">{children}</dd>
    </div>
  );
}

function Dots() {
  return <span className="text-paper/40" aria-label="loading">···</span>;
}
