"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  Zap,
  Key,
  Database,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Terminal,
  Activity,
  Lock,
  Search,
  ChevronRight,
  Cpu,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { LoadDisc } from "../LoadLine";
import SectionLabel from "../SectionLabel";

type TabKey =
  | "underwrite"
  | "hold-provisioning"
  | "line-ladder"
  | "marks-explorer"
  | "mcp-recipes";

type RoleMode = "counterparty" | "subject";

interface MarkRecord {
  surveyId: string;
  subjectId: string;
  lineId: number;
  thresholdUsd: number;
  verdict: "ABOVE" | "BELOW" | "INDETERMINATE";
  asOf: string;
  expiry: string;
  sourceSetHash: string;
  txHash: string;
}

const INITIAL_MARKS: MarkRecord[] = [
  {
    surveyId: "0xa79f41b98c3e102f",
    subjectId: "agent-solv-alpha.eth",
    lineId: 2,
    thresholdUsd: 250000,
    verdict: "ABOVE",
    asOf: "12s ago",
    expiry: "in 288s",
    sourceSetHash: "0x39b2...8f1a",
    txHash: "0xd91a34...bc82",
  },
  {
    surveyId: "0x8821ec03f90119b2",
    subjectId: "agent-solv-alpha.eth",
    lineId: 2,
    thresholdUsd: 250000,
    verdict: "ABOVE",
    asOf: "14m ago",
    expiry: "Expired",
    sourceSetHash: "0x39b2...8f1a",
    txHash: "0x77c419...ea01",
  },
  {
    surveyId: "0x6109af33e144a802",
    subjectId: "agent-solv-alpha.eth",
    lineId: 2,
    thresholdUsd: 250000,
    verdict: "ABOVE",
    asOf: "38m ago",
    expiry: "Expired",
    sourceSetHash: "0x39b2...8f1a",
    txHash: "0x3310aa...19bf",
  },
  {
    surveyId: "0x12b03948e91024aa",
    subjectId: "defi-market-maker.eth",
    lineId: 3,
    thresholdUsd: 500000,
    verdict: "BELOW",
    asOf: "2h ago",
    expiry: "Expired",
    sourceSetHash: "0x10ae...44c2",
    txHash: "0x9812bf...6e10",
  },
  {
    surveyId: "0xfe0184b9c1189914",
    subjectId: "compute-broker-7.eth",
    lineId: 1,
    thresholdUsd: 100000,
    verdict: "INDETERMINATE",
    asOf: "4h ago",
    expiry: "Expired",
    sourceSetHash: "0x889a...22e4",
    txHash: "0x44aa71...90f2",
  },
];

export default function ProtocolDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("underwrite");
  const [roleMode, setRoleMode] = useState<RoleMode>("counterparty");

  // Underwrite Workflow State (Bazantic 2-Service Runner)
  const [ethExposure, setEthExposure] = useState<number>(60);
  const [ethPrice, setEthPrice] = useState<number>(4125.5);
  const [isPriceFetching, setIsPriceFetching] = useState<boolean>(false);
  const [runnerStep, setRunnerStep] = useState<number>(0);
  const [isRunningSurvey, setIsRunningSurvey] = useState<boolean>(false);
  const [surveyVerdict, setSurveyVerdict] = useState<
    "ABOVE" | "BELOW" | "INDETERMINATE" | null
  >(null);
  const [forcedVerdictOverride, setForcedVerdictOverride] = useState<
    "auto" | "ABOVE" | "BELOW" | "INDETERMINATE"
  >("auto");

  // Subject Hold & Secrets State
  const [cexKeyBound, setCexKeyBound] = useState<boolean>(true);
  const [walletAddress, setWalletAddress] = useState<string>(
    "0x71C254897E8B16053e1982bC3322F2d0891f945B"
  );
  const [isSigningEip712, setIsSigningEip712] = useState<boolean>(false);
  const [eip712Signed, setEip712Signed] = useState<boolean>(true);

  // Line Ladder State
  const [ladder, setLadder] = useState<number[]>([
    50000, 100000, 250000, 500000, 1000000,
  ]);
  const [maskBelowAsIndeterminate, setMaskBelowAsIndeterminate] =
    useState<boolean>(true);
  const [rateLimitPerPair, setRateLimitPerPair] = useState<number>(5);

  // Marks Explorer State
  const [marks, setMarks] = useState<MarkRecord[]>(INITIAL_MARKS);
  const [markFilter, setMarkFilter] = useState<string>("ALL");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Derived Values for Underwriting
  const usdExposure = ethExposure * ethPrice;
  // Next highest ladder step >= exposure
  const selectedLineThreshold =
    ladder.find((l) => l >= usdExposure) || ladder[ladder.length - 1];
  const selectedLineIndex = ladder.indexOf(selectedLineThreshold);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleFetchPrice = () => {
    setIsPriceFetching(true);
    setTimeout(() => {
      // Small jitter around 4125
      const jitter = (Math.random() - 0.5) * 20;
      setEthPrice(Math.round((4125.5 + jitter) * 100) / 100);
      setIsPriceFetching(false);
    }, 600);
  };

  const executeUnderwritingFlow = () => {
    setIsRunningSurvey(true);
    setRunnerStep(1);
    setSurveyVerdict(null);

    // Step 1: Query Chainlink Price Feed (Bazantic Service 1)
    setTimeout(() => {
      setRunnerStep(2);
      // Step 2: Derive Line & Prepare x402
      setTimeout(() => {
        setRunnerStep(3);
        // Step 3: Trigger CRE TEE Enclave Execution
        setTimeout(() => {
          setRunnerStep(4);
          // Step 4: Write Mark to PlimsollRegistry on Sepolia
          setTimeout(() => {
            setRunnerStep(5);
            let finalVerdict: "ABOVE" | "BELOW" | "INDETERMINATE";
            if (forcedVerdictOverride !== "auto") {
              finalVerdict = forcedVerdictOverride;
            } else {
              // Simulated borrower hold value with haircuts ~ $310k
              finalVerdict =
                selectedLineThreshold <= 310000 ? "ABOVE" : "BELOW";
            }
            setSurveyVerdict(finalVerdict);
            setIsRunningSurvey(false);

            // Add new Mark to explorer
            const newMark: MarkRecord = {
              surveyId: "0x" + Math.random().toString(16).substring(2, 18),
              subjectId: "agent-solv-alpha.eth",
              lineId: selectedLineIndex,
              thresholdUsd: selectedLineThreshold,
              verdict: finalVerdict,
              asOf: "Just now",
              expiry: "in 300s",
              sourceSetHash: "0x39b2...8f1a",
              txHash: "0x" + Math.random().toString(16).substring(2, 18),
            };
            setMarks((prev) => [newMark, ...prev]);
          }, 1000);
        }, 1200);
      }, 900);
    }, 900);
  };

  const handleSignEip712 = () => {
    setIsSigningEip712(true);
    setTimeout(() => {
      setEip712Signed(true);
      setIsSigningEip712(false);
    }, 1100);
  };

  const filteredMarks = marks.filter((m) => {
    if (markFilter === "ALL") return true;
    return m.verdict === markFilter;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* Top Banner: Protocol Identity & Network Status */}
      <div className="mb-8 border border-ink/15 bg-paper p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center border border-ink bg-ink text-paper">
              <LoadDisc className="h-4 w-9 text-paper" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-doto text-2xl font-black tracking-tight text-ink">
                  PLIMSOLL PROTOCOL CONSOLE
                </h1>
                <span className="label-mono border border-signal/40 bg-signal/10 px-2 py-0.5 text-signal">
                  TESTNET ACTIVE
                </span>
              </div>
              <p className="label-mono text-ink/60">
                CHAINLINK CRE ENCLAVE · ETHEREUM SEPOLIA · BAZANTIC X402 GATEWAY
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border border-ink/15 bg-ink/[0.02] px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse-dot bg-emerald-600" />
              <span className="label-mono text-ink/80">SEPOLIA (11155111)</span>
            </div>

            <div className="flex items-center gap-2 border border-ink/15 bg-ink/[0.02] px-3 py-1.5">
              <ShieldCheck size={13} className="text-signal" />
              <span className="label-mono text-ink/80">
                TEE: AWS NITRO (us-west-2)
              </span>
            </div>

            <div className="flex items-center gap-2 border border-ink/15 bg-ink/[0.02] px-3 py-1.5">
              <Cpu size={13} className="text-ink/60" />
              <span className="label-mono text-ink/70">
                SUBJECT: agent-solv-alpha.eth
              </span>
            </div>
          </div>
        </div>

        {/* Mode Selector & Quick Links */}
        <div className="mt-6 flex flex-col gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="label-mono text-ink/50">ACTIVE PERSPECTIVE:</span>
            <div className="inline-flex border border-ink/20 p-0.5">
              <button
                onClick={() => setRoleMode("counterparty")}
                className={`label-mono px-3 py-1 transition-colors ${
                  roleMode === "counterparty"
                    ? "bg-ink text-paper font-semibold"
                    : "text-ink/60 hover:text-ink"
                }`}
              >
                COUNTERPARTY (UNDERWRITE)
              </button>
              <button
                onClick={() => setRoleMode("subject")}
                className={`label-mono px-3 py-1 transition-colors ${
                  roleMode === "subject"
                    ? "bg-ink text-paper font-semibold"
                    : "text-ink/60 hover:text-ink"
                }`}
              >
                SUBJECT AGENT (PROVISION HOLD)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noreferrer"
              className="label-mono flex items-center gap-1 text-ink/60 hover:text-signal"
            >
              REGISTRY: 0x89F4...3cA9
              <ExternalLink size={11} />
            </a>
            <span className="text-ink/20">|</span>
            <span className="label-mono text-ink/60">
              FORWARDER: 0x738B...112e
            </span>
          </div>
        </div>
      </div>

      {/* Primary Workstation Navigation Tabs */}
      <div className="mb-6 flex overflow-x-auto border-b border-ink/15 pb-px">
        <button
          onClick={() => setActiveTab("underwrite")}
          className={`label-mono flex items-center gap-2 border-b-2 px-5 py-3 text-xs whitespace-nowrap transition-colors ${
            activeTab === "underwrite"
              ? "border-signal text-signal font-semibold bg-signal/[0.04]"
              : "border-transparent text-ink/60 hover:text-ink hover:border-ink/20"
          }`}
        >
          <Zap size={13} />
          01 / BAZANTIC 2-SERVICE RUNNER
        </button>

        <button
          onClick={() => setActiveTab("hold-provisioning")}
          className={`label-mono flex items-center gap-2 border-b-2 px-5 py-3 text-xs whitespace-nowrap transition-colors ${
            activeTab === "hold-provisioning"
              ? "border-signal text-signal font-semibold bg-signal/[0.04]"
              : "border-transparent text-ink/60 hover:text-ink hover:border-ink/20"
          }`}
        >
          <Key size={13} />
          02 / HOLD & SECRET PROVISIONING
        </button>

        <button
          onClick={() => setActiveTab("line-ladder")}
          className={`label-mono flex items-center gap-2 border-b-2 px-5 py-3 text-xs whitespace-nowrap transition-colors ${
            activeTab === "line-ladder"
              ? "border-signal text-signal font-semibold bg-signal/[0.04]"
              : "border-transparent text-ink/60 hover:text-ink hover:border-ink/20"
          }`}
        >
          <Sliders size={13} />
          03 / LINE LADDER POLICY
        </button>

        <button
          onClick={() => setActiveTab("marks-explorer")}
          className={`label-mono flex items-center gap-2 border-b-2 px-5 py-3 text-xs whitespace-nowrap transition-colors ${
            activeTab === "marks-explorer"
              ? "border-signal text-signal font-semibold bg-signal/[0.04]"
              : "border-transparent text-ink/60 hover:text-ink hover:border-ink/20"
          }`}
        >
          <Database size={13} />
          04 / ONCHAIN MARKS & STANDING
        </button>

        <button
          onClick={() => setActiveTab("mcp-recipes")}
          className={`label-mono flex items-center gap-2 border-b-2 px-5 py-3 text-xs whitespace-nowrap transition-colors ${
            activeTab === "mcp-recipes"
              ? "border-signal text-signal font-semibold bg-signal/[0.04]"
              : "border-transparent text-ink/60 hover:text-ink hover:border-ink/20"
          }`}
        >
          <Terminal size={13} />
          05 / BAZANTIC MCP RECIPES
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BAZANTIC 2-SERVICE RUNNER (Interactive Composed Underwriting) */}
      {/* ========================================================================= */}
      {activeTab === "underwrite" && (
        <div className="space-y-6">
          <div className="border border-ink/15 bg-paper p-6">
            <SectionLabel
              index="BAZANTIC COMPOSED FLOW"
              title="UNDERWRITE COUNTERPARTY RECIPE"
              className="mb-4"
            />
            <p className="text-sm leading-relaxed text-ink/70 max-w-3xl">
              This interactive test runner simulates the exact workflow that an
              autonomous counterparty agent runs via Bazantic. The task requires
              two distinct services in sequence: first, querying{" "}
              <strong className="text-ink">Chainlink Price Feeds</strong> to
              convert asset exposure to USD, and second, triggering the{" "}
              <strong className="text-ink">Plimsoll Survey Gateway</strong> with
              the derived Line.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Deal Proposal Inputs */}
            <div className="border border-ink/15 bg-paper p-6 lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-5">
                  <span className="label-mono text-ink font-semibold">
                    DEAL PARAMETERS
                  </span>
                  <span className="label-mono text-signal">NET-30 CREDIT</span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="label-mono block text-xs text-ink/70 mb-1.5">
                      BORROWER SUBJECT IDENTITY
                    </label>
                    <input
                      type="text"
                      disabled
                      value="agent-solv-alpha.eth"
                      className="w-full border border-ink/20 bg-ink/[0.03] px-3.5 py-2 font-mono text-xs text-ink"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="label-mono text-xs text-ink/70">
                        REQUESTED EXPOSURE (ETH)
                      </label>
                      <span className="label-mono font-bold text-signal">
                        {ethExposure} ETH
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={200}
                      step={5}
                      value={ethExposure}
                      onChange={(e) => setEthExposure(Number(e.target.value))}
                      className="w-full accent-signal cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-ink/40 mt-1">
                      <span>10 ETH (~$41k)</span>
                      <span>60 ETH (~$247k)</span>
                      <span>200 ETH (~$825k)</span>
                    </div>
                  </div>

                  {/* Service 1: Chainlink Price Card */}
                  <div className="border border-ink/15 bg-ink/[0.02] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="label-mono text-[11px] text-ink/70 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 bg-signal" />
                        SERVICE 1: CHAINLINK ORACLE
                      </span>
                      <button
                        onClick={handleFetchPrice}
                        disabled={isPriceFetching}
                        className="label-mono text-[10px] text-ink/60 hover:text-signal flex items-center gap-1"
                      >
                        <RefreshCw
                          size={10}
                          className={isPriceFetching ? "animate-spin" : ""}
                        />
                        REFRESH
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="font-doto text-2xl font-black text-ink">
                        ${ethPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </span>
                      <span className="label-mono text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                        ROUND #110293 · FRESH (14s)
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-ink/50 mt-1">
                      AggregatorV3Interface · ETH/USD Sepolia
                    </p>
                  </div>

                  {/* Derived Calculation */}
                  <div className="border-l-2 border-signal bg-signal/[0.03] p-3.5 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="label-mono text-ink/70">
                        CALCULATED USD EXPOSURE:
                      </span>
                      <span className="font-mono font-bold text-ink">
                        ${Math.round(usdExposure).toLocaleString()} USD
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="label-mono text-ink/70">
                        DERIVED LINE THRESHOLD:
                      </span>
                      <span className="font-mono font-bold text-signal">
                        &gt;= ${selectedLineThreshold.toLocaleString()} USD
                      </span>
                    </div>
                    <p className="text-[11px] text-ink/60 pt-1">
                      Data moves directly: <em>Service 1 output</em> calculates
                      the parameter for <em>Service 2 input</em>.
                    </p>
                  </div>

                  {/* Test Override Option */}
                  <div className="border border-ink/10 bg-ink/[0.01] p-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-ink/60">
                      <span>Simulated Subject Hold:</span>
                      <span>~$310,000 USD (net haircut)</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-ink/60 mt-1">
                      <span>Demo Override:</span>
                      <select
                        value={forcedVerdictOverride}
                        onChange={(e) =>
                          setForcedVerdictOverride(e.target.value as any)
                        }
                        className="border border-ink/20 bg-paper px-1.5 py-0.5 text-ink text-[11px]"
                      >
                        <option value="auto">Auto (Calculate based on Line)</option>
                        <option value="ABOVE">Force ABOVE</option>
                        <option value="BELOW">Force BELOW</option>
                        <option value="INDETERMINATE">Force INDETERMINATE</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-ink/10">
                <button
                  onClick={executeUnderwritingFlow}
                  disabled={isRunningSurvey}
                  className="label-mono w-full flex items-center justify-center gap-2 border border-ink bg-ink px-6 py-3.5 text-paper transition-colors hover:bg-signal hover:border-signal disabled:opacity-50 cursor-pointer"
                >
                  {isRunningSurvey ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      RUNNING CONFIDENTIAL SURVEY...
                    </>
                  ) : (
                    <>
                      EXECUTE RECIPE PIPELINE
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Pipeline Walkthrough */}
            <div className="border border-ink/15 bg-paper p-6 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-5">
                <span className="label-mono text-ink font-semibold">
                  COMPOSED EXECUTION TRACE
                </span>
                <span className="label-mono text-ink/50">
                  {runnerStep === 0
                    ? "IDLE"
                    : runnerStep < 5
                    ? `STAGE 0${runnerStep} / 05`
                    : "COMPLETED"}
                </span>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div
                  className={`border p-4 transition-all ${
                    runnerStep === 1
                      ? "border-signal bg-signal/[0.04] shadow-sm"
                      : runnerStep > 1
                      ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                      : "border-ink/10 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="label-mono text-xs font-semibold flex items-center gap-2">
                      {runnerStep > 1 ? (
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      ) : runnerStep === 1 ? (
                        <Activity size={14} className="text-signal animate-spin" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-ink/30" />
                      )}
                      STEP 1: CALL SERVICE 1 (`chainlink-price`)
                    </span>
                    <span className="label-mono text-[10px] text-ink/50">
                      HTTP · BAZANTIC GATEWAY
                    </span>
                  </div>
                  <p className="text-xs text-ink/70">
                    Agent requests Chainlink ETH/USD spot rate. Returned:{" "}
                    <code className="font-mono text-ink">
                      ${ethPrice.toFixed(2)} USD
                    </code>
                    . Evaluates staleness guard (<code className="font-mono">updatedAt &lt; 3600s</code>).
                  </p>
                </div>

                {/* Step 2 */}
                <div
                  className={`border p-4 transition-all ${
                    runnerStep === 2
                      ? "border-signal bg-signal/[0.04] shadow-sm"
                      : runnerStep > 2
                      ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                      : "border-ink/10 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="label-mono text-xs font-semibold flex items-center gap-2">
                      {runnerStep > 2 ? (
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      ) : runnerStep === 2 ? (
                        <Activity size={14} className="text-signal animate-spin" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-ink/30" />
                      )}
                      STEP 2: MAP EXPOSURE TO REGISTERED LADDER
                    </span>
                    <span className="label-mono text-[10px] text-ink/50">
                      REASONING · LOCAL
                    </span>
                  </div>
                  <p className="text-xs text-ink/70">
                    Calculates ${Math.round(usdExposure).toLocaleString()} USD.
                    Selects Line #{selectedLineIndex} (
                    <code className="font-mono text-ink font-semibold">
                      observed_net_assets_usd &gt;= $
                      {selectedLineThreshold.toLocaleString()}
                    </code>
                    ). Quantized disclosure defends against binary-search leaks.
                  </p>
                </div>

                {/* Step 3 */}
                <div
                  className={`border p-4 transition-all ${
                    runnerStep === 3
                      ? "border-signal bg-signal/[0.04] shadow-sm"
                      : runnerStep > 3
                      ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                      : "border-ink/10 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="label-mono text-xs font-semibold flex items-center gap-2">
                      {runnerStep > 3 ? (
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      ) : runnerStep === 3 ? (
                        <Activity size={14} className="text-signal animate-spin" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-ink/30" />
                      )}
                      STEP 3: CALL SERVICE 2 (`plimsoll-survey`) VIA x402
                    </span>
                    <span className="label-mono text-[10px] text-ink/50">
                      x402 MPP · GASLESS SETTLEMENT
                    </span>
                  </div>
                  <p className="text-xs text-ink/70">
                    Settles 0.05 USDC survey fee. Gateway executes{" "}
                    <code className="font-mono text-ink">
                      requestSurvey(subjectId, lineId)
                    </code>{" "}
                    emitting EVM log on Ethereum Sepolia.
                  </p>
                </div>

                {/* Step 4 */}
                <div
                  className={`border p-4 transition-all ${
                    runnerStep === 4
                      ? "border-signal bg-signal/[0.04] shadow-sm"
                      : runnerStep > 4
                      ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                      : "border-ink/10 opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="label-mono text-xs font-semibold flex items-center gap-2">
                      {runnerStep > 4 ? (
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      ) : runnerStep === 4 ? (
                        <Activity size={14} className="text-signal animate-spin" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-ink/30" />
                      )}
                      STEP 4: CONFIDENTIAL EXECUTION IN AWS NITRO ENCLAVE
                    </span>
                    <span className="label-mono text-[10px] text-signal font-semibold">
                      CRE handlerInTee
                    </span>
                  </div>
                  <p className="text-xs text-ink/70">
                    Vault DON releases CEX credentials inside enclave only. Reads
                    holdings, values using Chainlink feeds with published haircuts,
                    evaluates threshold.{" "}
                    <span className="font-semibold text-ink">
                      Zero balances logged. Only boolean verdict crosses door.
                    </span>
                  </p>
                </div>

                {/* Step 5: Result Card */}
                {surveyVerdict && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border-2 p-5 ${
                      surveyVerdict === "ABOVE"
                        ? "border-emerald-600 bg-emerald-50/50"
                        : surveyVerdict === "BELOW"
                        ? "border-signal bg-signal/10"
                        : "border-amber-600 bg-amber-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="label-mono text-xs font-bold text-ink">
                        STAGE 05: ONCHAIN MARK ATTESTATION
                      </span>
                      <span
                        className={`label-mono font-black px-2.5 py-1 text-xs border ${
                          surveyVerdict === "ABOVE"
                            ? "border-emerald-600 bg-emerald-600 text-paper"
                            : surveyVerdict === "BELOW"
                            ? "border-signal bg-signal text-paper"
                            : "border-amber-600 bg-amber-600 text-paper"
                        }`}
                      >
                        VERDICT: {surveyVerdict}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono my-3 border-y border-ink/10 py-2.5">
                      <div>
                        <span className="text-ink/60 block">Survey ID:</span>
                        <span className="text-ink font-semibold">
                          0xa79f41b9...102f
                        </span>
                      </div>
                      <div>
                        <span className="text-ink/60 block">Tested Line:</span>
                        <span className="text-ink font-semibold">
                          &gt;= ${selectedLineThreshold.toLocaleString()} USD
                        </span>
                      </div>
                      <div>
                        <span className="text-ink/60 block">Validity:</span>
                        <span className="text-ink font-semibold">
                          300 seconds
                        </span>
                      </div>
                      <div>
                        <span className="text-ink/60 block">Quantities:</span>
                        <span className="text-signal font-semibold">
                          0 DISCLOSED
                        </span>
                      </div>
                    </div>

                    {/* Credit Desk Decision */}
                    <div className="mt-3 pt-2">
                      <span className="label-mono text-[11px] block text-ink/70 mb-1">
                        CREDITDESK.SOL STANDING ENFORCEMENT:
                      </span>
                      {surveyVerdict === "ABOVE" ? (
                        <div className="flex items-center justify-between bg-emerald-600/10 border border-emerald-600/30 p-2.5 text-xs text-emerald-900">
                          <span className="font-semibold">
                            ✓ STANDING VERIFIED: Disburse {ethExposure} ETH GPU Mandate
                          </span>
                          <span className="label-mono text-[10px] text-emerald-700">
                            k=3 DISTINCT MARKS
                          </span>
                        </div>
                      ) : surveyVerdict === "BELOW" ? (
                        <div className="bg-signal/10 border border-signal/30 p-2.5 text-xs text-signal">
                          <span className="font-semibold block">
                            ✗ REFUSE CREDIT MANDATE: Agent below required line.
                          </span>
                          <span className="text-[11px] text-ink/80 block mt-0.5">
                            <strong>Recipe Privacy Invariant:</strong> Counterparty
                            agent is instructed <em>never</em> to retry at a lower
                            Line to probe balance. Decline or require collateral.
                          </span>
                        </div>
                      ) : (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-900">
                          <span className="font-semibold block">
                            ⚠ INDETERMINATE: Source temporarily unreachable or price stale.
                          </span>
                          <span className="text-[11px] text-ink/80 block mt-0.5">
                            Treat as NO. Do not honour credit on indeterminate standing.
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HOLD & SECRET PROVISIONING (Subject Agent Setup) */}
      {/* ========================================================================= */}
      {activeTab === "hold-provisioning" && (
        <div className="space-y-6">
          <div className="border border-ink/15 bg-paper p-6">
            <SectionLabel
              index="CONFIDENTIAL ASSET HOLD"
              title="VAULT DON SECRET PROVISIONING"
              className="mb-4"
            />
            <p className="text-sm leading-relaxed text-ink/70 max-w-3xl">
              The subject agent configures private holdings that will be evaluated
              inside the AWS Nitro enclave. Exchange read-only keys are sealed by
              the Chainlink Vault DON and decrypted exclusively inside the
              hardware enclave.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* CEX API Credentials Card */}
            <div className="border border-ink/15 bg-paper p-6">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
                <span className="label-mono font-semibold text-ink flex items-center gap-2">
                  <Key size={14} className="text-signal" />
                  SOURCE 01: CEX READ-ONLY API KEY
                </span>
                <span className="label-mono text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">
                  {cexKeyBound ? "BOUND TO VAULT DON" : "UNPROVISIONED"}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label-mono text-xs block text-ink/70 mb-1">
                    EXCHANGE PLATFORM
                  </label>
                  <select
                    disabled={cexKeyBound}
                    className="w-full border border-ink/20 bg-paper px-3 py-2 font-mono text-xs text-ink"
                  >
                    <option>Binance (Read-Only Spot & Margin)</option>
                    <option>Coinbase Prime (Read-Only)</option>
                    <option>OKX (Read-Only)</option>
                  </select>
                </div>

                <div>
                  <label className="label-mono text-xs block text-ink/70 mb-1">
                    API KEY (ENCLAVE DECRYPTED ONLY)
                  </label>
                  <input
                    type="password"
                    disabled={cexKeyBound}
                    value={cexKeyBound ? "••••••••••••••••••••••••••••••••" : ""}
                    placeholder="Enter read-only API key"
                    className="w-full border border-ink/20 bg-paper px-3 py-2 font-mono text-xs text-ink"
                  />
                </div>

                <div className="border-l-2 border-ink/30 bg-ink/[0.02] p-3 text-xs text-ink/70 space-y-1">
                  <p className="font-semibold text-ink">
                    Hard Enclave Guarantee:
                  </p>
                  <p>
                    Node operators cannot inspect this key. It is only released
                    into the attested AWS Nitro enclave via{" "}
                    <code className="font-mono text-ink">
                      runtime.getSecret()
                    </code>
                    .
                  </p>
                </div>

                <button
                  onClick={() => setCexKeyBound(!cexKeyBound)}
                  className="label-mono w-full border border-ink px-4 py-2.5 text-xs text-ink transition-colors hover:bg-ink hover:text-paper cursor-pointer"
                >
                  {cexKeyBound ? "ROTATE / REVOKE KEY" : "SEAL KEY IN VAULT DON"}
                </button>
              </div>
            </div>

            {/* EVM Wallet Address Binding */}
            <div className="border border-ink/15 bg-paper p-6">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
                <span className="label-mono font-semibold text-ink flex items-center gap-2">
                  <ShieldCheck size={14} className="text-signal" />
                  SOURCE 02: ONCHAIN WALLET (EIP-712 BINDING)
                </span>
                <span className="label-mono text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">
                  {eip712Signed ? "EIP-712 VERIFIED" : "UNBOUND"}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label-mono text-xs block text-ink/70 mb-1">
                    SUBJECT IDENTITY (DID / ENS)
                  </label>
                  <input
                    type="text"
                    disabled
                    value="agent-solv-alpha.eth"
                    className="w-full border border-ink/20 bg-ink/[0.02] px-3 py-2 font-mono text-xs text-ink"
                  />
                </div>

                <div>
                  <label className="label-mono text-xs block text-ink/70 mb-1">
                    BOUND WALLET ADDRESS
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="w-full border border-ink/20 bg-paper px-3 py-2 font-mono text-xs text-ink"
                  />
                </div>

                <div className="border border-ink/10 bg-ink/[0.02] p-3 text-xs space-y-1 font-mono">
                  <span className="label-mono text-[10px] text-ink/50 block">
                    EIP-712 DOMAIN SEPARATOR
                  </span>
                  <p className="text-ink/80 text-[11px]">
                    name: "Plimsoll Binding Registry", version: "1", chainId:
                    11155111
                  </p>
                  <p className="text-ink/60 text-[10px]">
                    Signature prevents subjects from pledging accounts they do
                    not own.
                  </p>
                </div>

                <button
                  onClick={handleSignEip712}
                  disabled={isSigningEip712}
                  className="label-mono w-full border border-ink bg-ink px-4 py-2.5 text-xs text-paper transition-colors hover:bg-signal hover:border-signal disabled:opacity-50 cursor-pointer"
                >
                  {isSigningEip712 ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={12} className="animate-spin" />
                      SIGNING EIP-712 PROOF...
                    </span>
                  ) : (
                    "RE-SIGN EIP-712 WALLET BINDING"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LINE LADDER & POLICY (Quantized Disclosure Settings) */}
      {/* ========================================================================= */}
      {activeTab === "line-ladder" && (
        <div className="space-y-6">
          <div className="border border-ink/15 bg-paper p-6">
            <SectionLabel
              index="PRIVACY ARCHITECTURE"
              title="REGISTERED LINE LADDER & PUBLICATION POLICY"
              className="mb-4"
            />
            <p className="text-sm leading-relaxed text-ink/70 max-w-3xl">
              Plimsoll uses pre-registered Line ladders to protect against
              binary-search balance reconstruction. A subject registers a coarse
              set of rungs. Counterparties can only query these specific rungs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Ladder Config */}
            <div className="border border-ink/15 bg-paper p-6 lg:col-span-7">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
                <span className="label-mono font-semibold text-ink">
                  PRE-REGISTERED LINE RUNGS
                </span>
                <span className="label-mono text-signal">
                  {ladder.length} ACTIVE RUNGS
                </span>
              </div>

              <div className="space-y-3">
                {ladder.map((rung, idx) => (
                  <div
                    key={rung}
                    className="flex items-center justify-between border border-ink/15 bg-ink/[0.02] p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="label-mono text-xs text-signal font-bold">
                        #{idx}
                      </span>
                      <span className="font-mono text-sm font-semibold text-ink">
                        observed_net_assets_usd &gt;= ${rung.toLocaleString()}
                      </span>
                    </div>
                    <span className="label-mono text-[10px] bg-paper border border-ink/20 px-2 py-0.5 text-ink/70">
                      REGISTERED ONCHAIN
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-ink/60 leading-relaxed">
                <strong>Why this is private:</strong> A counterparty asking for
                $180k exposure clears rung #2 ($250k). They know the borrower
                holds at least $250k, but they cannot discover whether the true
                holding is $260k or $490k.
              </p>
            </div>

            {/* Privacy Invariants & Rate Limiter */}
            <div className="border border-ink/15 bg-paper p-6 lg:col-span-5 space-y-5">
              <div className="border-b border-ink/10 pb-3">
                <span className="label-mono font-semibold text-ink">
                  DEFENSIVE POLICIES
                </span>
              </div>

              <div className="border border-ink/15 bg-ink/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label-mono text-xs text-ink font-semibold">
                    MASK FALSE AS INDETERMINATE
                  </label>
                  <input
                    type="checkbox"
                    checked={maskBelowAsIndeterminate}
                    onChange={(e) =>
                      setMaskBelowAsIndeterminate(e.target.checked)
                    }
                    className="accent-signal h-4 w-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs text-ink/70 leading-relaxed">
                  A <code className="font-mono text-signal">BELOW</code> result
                  leaks an upper-bound. When enabled, negative surveys emit{" "}
                  <code className="font-mono">INDETERMINATE</code> instead of
                  publishing a public fail.
                </p>
              </div>

              <div className="border border-ink/15 bg-ink/[0.02] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="label-mono text-xs text-ink font-semibold">
                    PAIR RATE LIMIT (HOURLY)
                  </label>
                  <span className="font-mono font-bold text-signal">
                    {rateLimitPerPair} requests / hr
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={rateLimitPerPair}
                  onChange={(e) => setRateLimitPerPair(Number(e.target.value))}
                  className="w-full accent-signal cursor-pointer"
                />
                <p className="text-xs text-ink/70 leading-relaxed">
                  Enforced per <code className="font-mono">(subject, requester)</code>{" "}
                  pair in the gateway. Prevents a single counterparty from
                  rapidly probing multiple lines.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ONCHAIN MARKS & STANDING EXPLORER */}
      {/* ========================================================================= */}
      {activeTab === "marks-explorer" && (
        <div className="space-y-6">
          <div className="border border-ink/15 bg-paper p-6">
            <SectionLabel
              index="ONCHAIN ATTESTATION FEED"
              title="SEPOLIA MARKS & STANDING ACCUMULATOR"
              className="mb-4"
            />
            <p className="text-sm leading-relaxed text-ink/70 max-w-3xl">
              Inspect verified onchain Marks written by the CRE Forwarder. Notice
              what is strictly <em>absent</em> from every single record: no
              balance sheets, no asset quantities, and no token amounts.
            </p>
          </div>

          {/* Standing Metric Card */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="border border-ink/15 bg-paper p-4">
              <span className="label-mono text-[10px] text-ink/50 block">
                CURRENT STANDING (agent-solv-alpha.eth)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-doto text-3xl font-black text-emerald-600">
                  ACTIVE
                </span>
                <span className="label-mono text-xs text-ink/60">k=3 RUNS</span>
              </div>
              <p className="text-[11px] text-ink/60 mt-1">
                3 consecutive valid ABOVE Marks across 1-hour window.
              </p>
            </div>

            <div className="border border-ink/15 bg-paper p-4">
              <span className="label-mono text-[10px] text-ink/50 block">
                TOTAL SURVEY EXECUTIONS
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-doto text-3xl font-black text-ink">
                  {marks.length}
                </span>
                <span className="label-mono text-xs text-signal">VERIFIED</span>
              </div>
              <p className="text-[11px] text-ink/60 mt-1">
                Settled onchain via PlimsollRegistry.sol
              </p>
            </div>

            <div className="border border-ink/15 bg-paper p-4">
              <span className="label-mono text-[10px] text-ink/50 block">
                DISCLOSED BALANCE QUANTITIES
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-doto text-3xl font-black text-signal">
                  0 BITS
                </span>
                <span className="label-mono text-xs text-ink/60">
                  ZERO LEAKAGE
                </span>
              </div>
              <p className="text-[11px] text-ink/60 mt-1">
                Protected by AWS Nitro Enclave boundary
              </p>
            </div>
          </div>

          {/* Marks Table */}
          <div className="border border-ink/15 bg-paper p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="label-mono text-xs text-ink font-semibold">
                  FILTER BY VERDICT:
                </span>
                <div className="inline-flex border border-ink/20 p-0.5">
                  {["ALL", "ABOVE", "BELOW", "INDETERMINATE"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setMarkFilter(v)}
                      className={`label-mono px-2.5 py-1 text-[10px] cursor-pointer ${
                        markFilter === v
                          ? "bg-ink text-paper font-semibold"
                          : "text-ink/60 hover:text-ink"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <span className="label-mono text-xs text-ink/50">
                SHOWING {filteredMarks.length} RECORDS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-ink/15 label-mono text-ink/50 text-[10px]">
                    <th className="py-2.5 pr-4">SURVEY ID</th>
                    <th className="py-2.5 px-4">SUBJECT ID</th>
                    <th className="py-2.5 px-4">THRESHOLD</th>
                    <th className="py-2.5 px-4">VERDICT</th>
                    <th className="py-2.5 px-4">AS OF</th>
                    <th className="py-2.5 px-4">EXPIRY</th>
                    <th className="py-2.5 pl-4 text-right">SEPOLIA TX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {filteredMarks.map((m) => (
                    <tr key={m.surveyId} className="hover:bg-ink/[0.02]">
                      <td className="py-3 pr-4 font-semibold text-ink">
                        {m.surveyId}
                      </td>
                      <td className="py-3 px-4 text-ink/70">{m.subjectId}</td>
                      <td className="py-3 px-4 font-bold text-ink">
                        &gt;= ${m.thresholdUsd.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`label-mono px-2 py-0.5 text-[9px] font-bold border ${
                            m.verdict === "ABOVE"
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : m.verdict === "BELOW"
                              ? "border-signal bg-signal/10 text-signal"
                              : "border-amber-600 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {m.verdict}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-ink/60">{m.asOf}</td>
                      <td className="py-3 px-4 text-ink/60">{m.expiry}</td>
                      <td className="py-3 pl-4 text-right">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${m.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="label-mono inline-flex items-center gap-1 text-signal hover:underline"
                        >
                          {m.txHash.substring(0, 10)}...
                          <ArrowUpRight size={10} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: BAZANTIC MCP SERVER & RECIPES */}
      {/* ========================================================================= */}
      {activeTab === "mcp-recipes" && (
        <div className="space-y-6">
          <div className="border border-ink/15 bg-paper p-6">
            <SectionLabel
              index="AGENT INTEGRATION"
              title="BAZANTIC MCP SERVER & PROMPT RECIPES"
              className="mb-4"
            />
            <p className="text-sm leading-relaxed text-ink/70 max-w-3xl">
              Equip your Claude, Cursor, Windsurf, or custom LangChain agent with
              Plimsoll tools in one step. The Bazantic MCP server connects the
              agent directly to both the{" "}
              <code className="font-mono text-ink">chainlink-price</code> gateway
              and the{" "}
              <code className="font-mono text-ink">plimsoll-survey</code> gateway.
            </p>
          </div>

          {/* MCP Config Snippet */}
          <div className="border border-ink/15 bg-paper p-6">
            <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
              <span className="label-mono font-semibold text-ink">
                CLAUDE DESKTOP / CURSOR CONFIGURATION (`mcp.json`)
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(
                      {
                        mcpServers: {
                          plimsoll: {
                            command: "npx",
                            args: ["-y", "@bazantic/mcp-server@latest"],
                            env: {
                              BAZANTIC_API_KEY: "bz_live_sep_plimsoll_demo",
                              PLIMSOLL_CHAIN_ID: "11155111",
                            },
                          },
                        },
                      },
                      null,
                      2
                    ),
                    "mcp-json"
                  )
                }
                className="label-mono flex items-center gap-1 text-xs text-ink/70 hover:text-signal cursor-pointer"
              >
                {copiedText === "mcp-json" ? (
                  <Check size={12} className="text-emerald-600" />
                ) : (
                  <Copy size={12} />
                )}
                COPY CONFIG
              </button>
            </div>

            <pre className="overflow-x-auto bg-enclave p-4 font-mono text-xs text-paper/90 leading-relaxed border border-enclave-dot">
              {JSON.stringify(
                {
                  mcpServers: {
                    plimsoll: {
                      command: "npx",
                      args: ["-y", "@bazantic/mcp-server@latest"],
                      env: {
                        BAZANTIC_API_KEY: "bz_live_sep_plimsoll_demo",
                        PLIMSOLL_CHAIN_ID: "11155111",
                      },
                    },
                  },
                },
                null,
                2
              )}
            </pre>
          </div>

          {/* The Two Bazantic Recipes */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recipe 1: underwrite_counterparty */}
            <div className="border border-ink/15 bg-paper p-6">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
                <div>
                  <span className="label-mono text-signal block font-bold">
                    COMPOSED 2-SERVICE RECIPE
                  </span>
                  <span className="font-mono text-sm font-semibold text-ink">
                    underwrite_counterparty
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `// Bazantic Recipe: underwrite_counterparty
1. Read the proposed deal. Exposure is denominated in asset (e.g. 60 ETH).
2. Call service 1 (chainlink-price) for current spot price.
3. Compute USD exposure: exposure * price.
4. Round up to the nearest registered Line threshold (e.g. >= $250,000).
5. Call service 2 (plimsoll-survey) with that Line and pay via x402.
6. Poll GET /mark/{surveyId}.
7. If ABOVE, verify Standing on CreditDesk.sol and disburse.
8. If BELOW, decline or demand collateral. NEVER probe downward.`,
                      "recipe-underwrite"
                    )
                  }
                  className="label-mono flex items-center gap-1 text-xs text-ink/70 hover:text-signal cursor-pointer"
                >
                  {copiedText === "recipe-underwrite" ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Copy size={12} />
                  )}
                  COPY
                </button>
              </div>

              <div className="space-y-2 text-xs text-ink/80 leading-relaxed font-mono bg-ink/[0.02] p-4 border border-ink/10">
                <p>
                  <strong>When:</strong> Before extending credit, margin, or
                  uncollateralized compute.
                </p>
                <p>
                  <strong>Service 1:</strong> Call{" "}
                  <code className="text-signal">chainlink-price</code> to price
                  deal exposure.
                </p>
                <p>
                  <strong>Service 2:</strong> Trigger{" "}
                  <code className="text-signal">plimsoll-survey</code> with the
                  computed Line.
                </p>
                <p className="text-signal font-semibold pt-1 border-t border-ink/10">
                  Critical Privacy Rule: If verdict is FALSE, do not retry with
                  lower thresholds. Decline or request collateral.
                </p>
              </div>
            </div>

            {/* Recipe 2: request_mark */}
            <div className="border border-ink/15 bg-paper p-6">
              <div className="flex items-center justify-between border-b border-ink/10 pb-3 mb-4">
                <div>
                  <span className="label-mono text-ink/60 block font-bold">
                    PRIMITIVE RECIPE
                  </span>
                  <span className="font-mono text-sm font-semibold text-ink">
                    request_mark
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `// Bazantic Recipe: request_mark
Needs: subject identity, a Line threshold, freshness window.
Verdict ABOVE: Subject reported holdings satisfying Line at asOf after haircuts.
Verdict INDETERMINATE: Treat as NO.
On FALSE: Do NOT retry at a lower Line to discover actual balance.`,
                      "recipe-mark"
                    )
                  }
                  className="label-mono flex items-center gap-1 text-xs text-ink/70 hover:text-signal cursor-pointer"
                >
                  {copiedText === "recipe-mark" ? (
                    <Check size={12} className="text-emerald-600" />
                  ) : (
                    <Copy size={12} />
                  )}
                  COPY
                </button>
              </div>

              <div className="space-y-2 text-xs text-ink/80 leading-relaxed font-mono bg-ink/[0.02] p-4 border border-ink/10">
                <p>
                  <strong>When:</strong> Single-shot solvency verification against
                  an already known USD threshold.
                </p>
                <p>
                  <strong>Reading results:</strong> A Mark is a boolean, not a
                  balance.
                </p>
                <p>
                  <strong>Expiry check:</strong> Always verify{" "}
                  <code className="text-ink">expiry &gt; block.timestamp</code>{" "}
                  before acting.
                </p>
                <p className="text-ink/60 pt-1 border-t border-ink/10">
                  Emitted event:{" "}
                  <code className="text-ink">
                    SurveyRequested(surveyId, subjectId, lineId)
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
