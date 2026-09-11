"use client";

import { useState } from "react";
import {
  Shield,
  Lock,
  Cpu,
  Terminal,
  BookOpen,
  Code2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Layers,
  Scale,
  Zap,
  ArrowUpRight,
  Calculator,
} from "lucide-react";
import SectionLabel from "../SectionLabel";
import { LoadDisc } from "../LoadLine";

const SECTIONS = [
  { id: "thesis", title: "01 / The Core Thesis & Load Line" },
  { id: "confidentiality", title: "02 / Confidential Architecture" },
  { id: "valuation", title: "03 / Valuation & Haircuts" },
  { id: "trust-model", title: "04 / Trust Model & Defenses" },
  { id: "bazantic", title: "05 / Bazantic 2-Service Recipes" },
  { id: "contracts", title: "06 / Smart Contract Reference" },
  { id: "quickstart", title: "07 / Agent Integration Quickstart" },
];

export default function ProtocolGuide() {
  const [activeSection, setActiveSection] = useState<string>("thesis");
  const [activeCodeTab, setActiveCodeTab] = useState<
    "registry" | "creditdesk" | "cre" | "recipe"
  >("registry");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Interactive Haircut Calculator State inside Guide
  const [calcEth, setCalcEth] = useState<number>(40);
  const [calcUsdc, setCalcUsdc] = useState<number>(60000);
  const [calcAlt, setCalcAlt] = useState<number>(30000);
  const ethRate = 4125;

  const rawEthVal = calcEth * ethRate;
  const haircutEthVal = rawEthVal * 0.9;
  const rawUsdcVal = calcUsdc;
  const haircutUsdcVal = calcUsdc * 1.0;
  const rawAltVal = calcAlt;
  const haircutAltVal = calcAlt * 0.75;

  const totalRaw = rawEthVal + rawUsdcVal + rawAltVal;
  const totalHaircut = haircutEthVal + haircutUsdcVal + haircutAltVal;

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      {/* Guide Header */}
      <div className="mb-10 border border-ink/15 bg-paper p-6 md:p-8">
        <SectionLabel
          index="PLIMSOLL SPECIFICATION"
          title="PROTOCOL REFERENCE & INTEGRATION GUIDE"
          className="mb-4"
        />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="font-doto text-3xl md:text-5xl font-black tracking-tight text-ink">
              THE LOAD LINE FOR AUTONOMOUS AGENTS
            </h1>
            <p className="mt-3 text-base text-ink/70 leading-relaxed">
              Proof of enough, not proof of how much. A credit check that
              requires zero balance sheet disclosure, powered by Chainlink CRE
              Confidential Workflows and Bazantic multi-service Recipes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="/dashboard"
              className="label-mono flex items-center justify-center gap-2 border border-ink bg-ink px-6 py-3 text-xs text-paper hover:bg-signal hover:border-signal transition-colors"
            >
              LAUNCH DASHBOARD
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Document Content */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sticky Table of Contents (Desktop) */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 border border-ink/15 bg-paper p-5">
            <div className="flex items-center gap-2 border-b border-ink/10 pb-3 mb-4">
              <BookOpen size={14} className="text-signal" />
              <span className="label-mono font-semibold text-ink">
                TABLE OF CONTENTS
              </span>
            </div>

            <nav className="space-y-1">
              {SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  className={`label-mono block px-3 py-2 text-xs transition-colors ${
                    activeSection === sec.id
                      ? "bg-ink text-paper font-semibold border-l-2 border-signal"
                      : "text-ink/60 hover:text-ink hover:bg-ink/[0.02]"
                  }`}
                >
                  {sec.title}
                </a>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-ink/10 space-y-2 font-mono text-[11px] text-ink/60">
              <p>
                <strong>Network:</strong> Ethereum Sepolia
              </p>
              <p>
                <strong>Attestation:</strong> AWS Nitro (us-west-2)
              </p>
              <p>
                <strong>Payment:</strong> x402 Micropayment Protocol
              </p>
            </div>
          </div>
        </aside>

        {/* Documentation Content Body */}
        <article className="lg:col-span-8 space-y-12">
          {/* CHAPTER 1 */}
          <section id="thesis" className="border border-ink/15 bg-paper p-6 md:p-8 scroll-mt-24">
            <SectionLabel index="01" title="THE CORE THESIS" className="mb-4" />
            <h2 className="font-doto text-2xl md:text-3xl font-black text-ink mb-4">
              THE PLIMSOLL LOAD LINE FOR AGENTS
            </h2>

            <div className="prose text-sm text-ink/80 space-y-4 leading-relaxed">
              <p>
                An autonomous agent wants credit. It wants to borrow capital,
                trade on margin, take delivery of GPU compute before payment, or
                be entrusted with an institutional mandate. The counterparty agent
                needs to verify solvency before taking on counterparty risk.
              </p>

              <div className="border-l-2 border-signal bg-signal/[0.03] p-4 space-y-2">
                <p className="font-semibold text-ink">Today's Two Flawed Options:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>
                    <strong>Publish your full balance sheet:</strong> Now the
                    counterparty knows your exact liquid reserves, margins, and
                    exactly how hard to squeeze you in negotiations.
                  </li>
                  <li>
                    <strong>Rely on blind reputation / word:</strong> Worthless
                    in decentralized, pseudonymous agent-to-agent commerce.
                  </li>
                </ul>
              </div>

              <h3 className="font-doto text-lg font-bold text-ink pt-3">
                The Historical Analogy
              </h3>
              <p>
                In the 1870s, British MP Samuel Plimsoll established the{" "}
                <strong>Plimsoll Line</strong>—a reference mark painted on a
                ship's hull. When a cargo vessel docks, the harbourmaster checks
                whether the water level is below the mark. The harbourmaster
                never opens the cargo hold, never reads the manifest, and never
                calculates the exact tonnage.
              </p>
              <p>
                <strong>One bit of information is enough to decide safely.</strong>{" "}
                Plimsoll does the same for autonomous agents: a counterparty
                pays a few cents to ask one question:
              </p>
              <blockquote className="border-l-2 border-ink bg-ink/[0.02] p-3 font-mono text-xs text-ink font-semibold italic">
                "Is this agent above the line?"
              </blockquote>
            </div>
          </section>

          {/* CHAPTER 2 */}
          <section id="confidentiality" className="border border-ink/15 bg-paper p-6 md:p-8 scroll-mt-24">
            <SectionLabel index="02" title="CONFIDENTIAL ARCHITECTURE" className="mb-4" />
            <h2 className="font-doto text-2xl md:text-3xl font-black text-ink mb-4">
              HARDWARE-ISOLATED NITRO ENCLAVES
            </h2>

            <div className="space-y-4 text-sm text-ink/80 leading-relaxed">
              <p>
                Plimsoll evaluates balance sheets inside an{" "}
                <strong>AWS Nitro Enclave</strong> in region{" "}
                <code className="font-mono text-ink">us-west-2</code> using
                Chainlink CRE (Compute Runtime Environment) and{" "}
                <code className="font-mono text-ink">cre.handlerInTee</code>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 font-mono text-xs">
                <div className="border border-emerald-600/30 bg-emerald-50/40 p-4">
                  <span className="font-bold text-emerald-800 block mb-2">
                    ✓ PROTECTED INSIDE ENCLAVE
                  </span>
                  <ul className="space-y-1 text-emerald-950">
                    <li>• CEX read-only API keys from Vault DON</li>
                    <li>• Raw token balances and account holdings</li>
                    <li>• Intermediate haircut evaluations</li>
                    <li>• Enclave volatile execution memory</li>
                  </ul>
                </div>
                <div className="border border-signal/30 bg-signal/5 p-4">
                  <span className="font-bold text-signal block mb-2">
                    ✗ EXCLUDED / CROSSES TO PUBLIC
                  </span>
                  <ul className="space-y-1 text-ink/80">
                    <li>• Triggers (EVM logs on Sepolia)</li>
                    <li>• The 1-bit boolean verdict (`ABOVE`/`BELOW`)</li>
                    <li>• Survey metadata: surveyId, asOf, sourceSetHash</li>
                    <li>• No balance quantities ever cross the door</li>
                  </ul>
                </div>
              </div>

              <h3 className="font-doto text-lg font-bold text-ink pt-2">
                The One-Way Door: `runtime.usingTheDons()`
              </h3>
              <p>
                Whatever leaves the TEE handler passes through{" "}
                <code className="font-mono text-ink">runtime.usingTheDons()</code>.
                This payload is strictly audited:
              </p>
              <pre className="overflow-x-auto bg-enclave p-4 font-mono text-xs text-paper/90 border border-enclave-dot">
{`// The crossing payload — the entire privacy claim
const donRuntime = runtime.usingTheDons();
const report = await donRuntime.report({
  surveyId,       // bytes32
  subjectId,      // bytes32 (ENS node / DID)
  lineId,         // uint16
  verdict,        // uint8: 0=INDETERMINATE, 1=ABOVE, 2=BELOW
  asOf,           // uint64 (Chainlink price timestamp)
  sourceSetHash,  // bytes32 (Haircut version + allowlist hash)
});`}
              </pre>
              <p className="text-xs text-ink/60">
                Notice: No balance, no token amount, no margin ratio, no headroom.
              </p>
            </div>
          </section>

          {/* CHAPTER 3 */}
          <section id="valuation" className="border border-ink/15 bg-paper p-6 md:p-8 scroll-mt-24">
            <SectionLabel index="03" title="VALUATION & HAIRCUTS" className="mb-4" />
            <h2 className="font-doto text-2xl md:text-3xl font-black text-ink mb-4">
              HONEST METRICS & HAIRCUT SCHEDULE
            </h2>

            <div className="space-y-4 text-sm text-ink/80 leading-relaxed">
              <p>
                Plimsoll does not call its metric <em>net_equity_usd</em> because
                off-balance-sheet debt cannot be observed by read-only API keys.
                Instead, the metric is explicitly defined as:
              </p>
              <div className="border border-ink/20 bg-ink/[0.03] p-4 font-mono text-xs text-ink">
                <strong>observed_net_assets_usd</strong> = Σ [ asset_balance ×
                chainlink_price × haircut_factor ] - observable_margin_debt
              </div>

              <h3 className="font-doto text-base font-bold text-ink pt-2">
                Published Haircut Table
              </h3>
              <table className="w-full text-left font-mono text-xs border border-ink/15">
                <thead className="bg-ink/[0.03] border-b border-ink/15 label-mono text-[10px]">
                  <tr>
                    <th className="p-3">ASSET CLASS</th>
                    <th className="p-3">HAIRCUT FACTOR</th>
                    <th className="p-3">RATIONALE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  <tr>
                    <td className="p-3 font-semibold">USDC, USDT</td>
                    <td className="p-3 font-bold text-emerald-700">1.00 (100%)</td>
                    <td className="p-3 text-ink/70">Fiat-backed liquid stablecoins</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">ETH, WETH, BTC</td>
                    <td className="p-3 font-bold text-amber-700">0.90 (90%)</td>
                    <td className="p-3 text-ink/70">Deep spot liquidity; 10% volatility cushion</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">All Other Allowlisted</td>
                    <td className="p-3 font-bold text-signal">0.75 (75%)</td>
                    <td className="p-3 text-ink/70">Long-tail slippage & liquidation buffer</td>
                  </tr>
                </tbody>
              </table>

              {/* Interactive Haircut Calculator Tool */}
              <div className="mt-6 border border-ink/15 bg-paper p-5">
                <div className="flex items-center gap-2 border-b border-ink/10 pb-3 mb-4">
                  <Calculator size={14} className="text-signal" />
                  <span className="label-mono font-semibold text-ink">
                    INTERACTIVE ENCLAVE VALUATION CALCULATOR
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                  <div>
                    <label className="label-mono block text-[10px] text-ink/60 mb-1">
                      ETH HOLDINGS (0.90 HC)
                    </label>
                    <input
                      type="number"
                      value={calcEth}
                      onChange={(e) => setCalcEth(Number(e.target.value))}
                      className="w-full border border-ink/20 p-2 text-xs"
                    />
                    <span className="text-[10px] text-ink/50 mt-1 block">
                      ${Math.round(haircutEthVal).toLocaleString()} after HC
                    </span>
                  </div>

                  <div>
                    <label className="label-mono block text-[10px] text-ink/60 mb-1">
                      USDC HOLDINGS (1.00 HC)
                    </label>
                    <input
                      type="number"
                      value={calcUsdc}
                      onChange={(e) => setCalcUsdc(Number(e.target.value))}
                      className="w-full border border-ink/20 p-2 text-xs"
                    />
                    <span className="text-[10px] text-ink/50 mt-1 block">
                      ${Math.round(haircutUsdcVal).toLocaleString()} after HC
                    </span>
                  </div>

                  <div>
                    <label className="label-mono block text-[10px] text-ink/60 mb-1">
                      ALTCOIN HOLDINGS (0.75 HC)
                    </label>
                    <input
                      type="number"
                      value={calcAlt}
                      onChange={(e) => setCalcAlt(Number(e.target.value))}
                      className="w-full border border-ink/20 p-2 text-xs"
                    />
                    <span className="text-[10px] text-ink/50 mt-1 block">
                      ${Math.round(haircutAltVal).toLocaleString()} after HC
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-ink/10 flex flex-wrap items-center justify-between font-mono text-xs">
                  <span className="text-ink/60">
                    RAW MARKET VALUE: ${Math.round(totalRaw).toLocaleString()} USD
                  </span>
                  <span className="font-bold text-signal">
                    ENCLAVE OBSERVED VALUATION: ${Math.round(totalHaircut).toLocaleString()} USD
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* CHAPTER 4 */}
          <section id="trust-model" className="border border-ink/15 bg-paper p-6 md:p-8 scroll-mt-24">
            <SectionLabel index="04" title="TRUST MODEL & DEFENSES" className="mb-4" />
            <h2 className="font-doto text-2xl md:text-3xl font-black text-ink mb-4">
              ADVERSARIAL DEFENSES & LIMITS
            </h2>

            <div className="space-y-4 text-sm text-ink/80 leading-relaxed">
              <div className="space-y-3">
                <div className="border border-ink/15 p-4 bg-ink/[0.01]">
                  <h4 className="font-mono font-bold text-ink flex items-center gap-2">
                    <Shield size={14} className="text-signal" />
                    1. Flash-Funding Defense: `Standing` Accumulator
                  </h4>
                  <p className="mt-1 text-xs text-ink/70">
                    A malicious borrower might take a flash loan for one block to
                    pass a solvency check. Plimsoll solves this via <strong>Standing</strong>:
                    the consumer contract (<code className="font-mono">CreditDesk.sol</code>)
                    demands <em>k</em> distinct Mark executions spanning at least{" "}
                    <em>w</em> seconds (e.g. 3 surveys over 1 hour). A single-block
                    loan cannot produce a multi-hour run.
                  </p>
                </div>

                <div className="border border-ink/15 p-4 bg-ink/[0.01]">
                  <h4 className="font-mono font-bold text-ink flex items-center gap-2">
                    <Scale size={14} className="text-signal" />
                    2. Binary-Search Leakage Defense: Pre-Registered Ladders
                  </h4>
                  <p className="mt-1 text-xs text-ink/70">
                    If an attacker could query any arbitrary threshold, they could
                    binary search the agent's exact balance ($240k? no. $220k? yes...).
                    Plimsoll forces counterparties to query only coarse rungs from the
                    subject's pre-registered ladder, coupled with pair-scoped rate
                    limiting per <code className="font-mono">(subject, requester)</code>.
                  </p>
                </div>

                <div className="border border-ink/15 p-4 bg-ink/[0.01]">
                  <h4 className="font-mono font-bold text-ink flex items-center gap-2">
                    <Lock size={14} className="text-signal" />
                    3. Credential Spoofing: EIP-712 Signature Binding
                  </h4>
                  <p className="mt-1 text-xs text-ink/70">
                    A subject cannot claim someone else's whale wallet. The subject
                    must sign an EIP-712 binding proof with the wallet's private key,
                    which is verified before the address is allowlisted for that
                    subject ID.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CHAPTER 5 */}
          <section id="bazantic" className="border border-ink/15 bg-paper p-6 md:p-8 scroll-mt-24">
            <SectionLabel index="05" title="BAZANTIC 2-SERVICE RECIPES" className="mb-4" />
            <h2 className="font-doto text-2xl md:text-3xl font-black text-ink mb-4">
              COMPOSING CHAINLINK & PLIMSOLL ON BAZANTIC
            </h2>

            <div className="space-y-4 text-sm text-ink/80 leading-relaxed">
              <p>
                Bazantic provides the MCP server and x402 payment gateway that
                turns Plimsoll into a composable tool for autonomous agents.
              </p>

              <div className="border border-signal/30 bg-signal/[0.03] p-4 text-xs font-mono">
                <span className="label-mono text-signal block mb-1">
                  THE COMPOSE CHAIN
                </span>
                Agent evaluates deal (60 ETH) → Service 1 (`chainlink-price`) returns
                spot rate → Agent calculates $247,500 USD → Derives Line #2 (&gt;= $250,000)
                → Calls Service 2 (`plimsoll-survey`) via x402 → Receives Mark.
              </div>

              <h3 className="font-doto text-base font-bold text-ink pt-2">
                The Crucial Recipe Invariant
              </h3>
              <p>
                In the <code className="font-mono text-ink font-semibold">underwrite_counterparty</code>{" "}
                Recipe, the agent is given an explicit instruction:
              </p>
              <blockquote className="border-l-2 border-signal bg-signal/[0.03] p-3 font-mono text-xs text-ink font-semibold">
                "On FALSE: Do NOT retry at a lower Line to discover the actual
                balance. Plimsoll rate-limits this per requester and the subject
                has not consented to it. Either require collateral, reduce
                exposure below an already cleared Line, or decline."
              </blockquote>
              <p className="text-xs text-ink/70">
                This rule defends the borrower's privacy against the agent's own
                natural curiosity.
              </p>
            </div>
          </section>

          {/* CHAPTER 6 */}
          <section id="contracts" className="border border-ink/15 bg-paper p-6 md:p-8 scroll-mt-24">
            <SectionLabel index="06" title="SMART CONTRACT REFERENCE" className="mb-4" />
            <h2 className="font-doto text-2xl md:text-3xl font-black text-ink mb-4">
              SOLIDITY CONTRACTS ON SEPOLIA
            </h2>

            {/* Code Tabs */}
            <div className="border border-ink/15 bg-paper">
              <div className="flex border-b border-ink/15 overflow-x-auto bg-ink/[0.02]">
                <button
                  onClick={() => setActiveCodeTab("registry")}
                  className={`label-mono px-4 py-2.5 text-xs whitespace-nowrap cursor-pointer ${
                    activeCodeTab === "registry"
                      ? "bg-paper text-signal font-bold border-b-2 border-signal"
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  PlimsollRegistry.sol
                </button>
                <button
                  onClick={() => setActiveCodeTab("creditdesk")}
                  className={`label-mono px-4 py-2.5 text-xs whitespace-nowrap cursor-pointer ${
                    activeCodeTab === "creditdesk"
                      ? "bg-paper text-signal font-bold border-b-2 border-signal"
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  CreditDesk.sol
                </button>
                <button
                  onClick={() => setActiveCodeTab("cre")}
                  className={`label-mono px-4 py-2.5 text-xs whitespace-nowrap cursor-pointer ${
                    activeCodeTab === "cre"
                      ? "bg-paper text-signal font-bold border-b-2 border-signal"
                      : "text-ink/60 hover:text-ink"
                  }`}
                >
                  workflow.ts (CRE TEE)
                </button>
              </div>

              <div className="p-4 bg-enclave text-paper font-mono text-xs overflow-x-auto relative">
                <button
                  onClick={() =>
                    copyCode(
                      activeCodeTab === "registry"
                        ? `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PlimsollRegistry {
    struct Mark {
        bytes32 subjectId;
        uint16  lineId;
        uint8   verdict; // 0=INDETERMINATE, 1=ABOVE, 2=BELOW
        uint64  asOf;
        uint64  expiry;
        bytes32 surveyId;
        bytes32 sourceSetHash;
    }

    address public immutable forwarder;
    mapping(bytes32 => Mark) public marks;

    event SurveyRequested(bytes32 indexed surveyId, bytes32 indexed subjectId, uint16 lineId);
    event MarkPosted(bytes32 indexed surveyId, bytes32 indexed subjectId, uint8 verdict);

    modifier onlyForwarder() {
        require(msg.sender == forwarder, "Caller not CRE forwarder");
        _;
    }

    function requestSurvey(bytes32 subjectId, uint16 lineId) external returns (bytes32 surveyId) {
        surveyId = keccak256(abi.encodePacked(subjectId, lineId, block.timestamp, msg.sender));
        emit SurveyRequested(surveyId, subjectId, lineId);
    }

    function postMark(bytes32 surveyId, Mark calldata mark) external onlyForwarder {
        marks[surveyId] = mark;
        emit MarkPosted(surveyId, mark.subjectId, mark.verdict);
    }
}`
                        : `// Consumer Contract
function borrow(uint256 amount) external {
    bytes32 subjectId = registry.subjectOf(msg.sender);
    require(subjectId != bytes32(0), "unbound borrower");
    require(
        registry.hasStanding(subjectId, OBSERVED_NET_ASSETS_USD, amount, 3, 1 hours),
        "no standing: requires 3 consecutive ABOVE marks"
    );
    // Disburse compute or credit
}`,
                      "code-snippet"
                    )
                  }
                  className="absolute right-4 top-4 label-mono flex items-center gap-1 text-[10px] bg-paper/10 px-2 py-1 text-paper hover:bg-paper/20 cursor-pointer"
                >
                  {copiedCode === "code-snippet" ? (
                    <Check size={11} className="text-emerald-400" />
                  ) : (
                    <Copy size={11} />
                  )}
                  COPY
                </button>

                <pre className="text-paper/90 leading-relaxed">
                  {activeCodeTab === "registry" &&
                    `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PlimsollRegistry {
    struct Mark {
        bytes32 subjectId;      // ENS node or agent DID (public)
        uint16  lineId;         // index into subject's ladder
        uint8   verdict;        // 0=INDETERMINATE, 1=ABOVE, 2=BELOW
        uint64  asOf;           // price timestamp
        uint64  expiry;         // block timestamp validity limit
        bytes32 surveyId;       // unique execution nonce
        bytes32 sourceSetHash;  // haircut schedule & source hash
    }

    address public immutable forwarder;
    mapping(bytes32 => Mark) public marks;

    event SurveyRequested(bytes32 indexed surveyId, bytes32 indexed subjectId, uint16 lineId);
    event MarkPosted(bytes32 indexed surveyId, bytes32 indexed subjectId, uint8 verdict);

    modifier onlyForwarder() {
        require(msg.sender == forwarder, "not forwarder");
        _;
    }

    function requestSurvey(bytes32 subjectId, uint16 lineId) external returns (bytes32 surveyId) {
        surveyId = keccak256(abi.encodePacked(subjectId, lineId, block.timestamp, msg.sender));
        emit SurveyRequested(surveyId, subjectId, lineId);
    }

    function postMark(bytes32 surveyId, Mark calldata mark) external onlyForwarder {
        marks[surveyId] = mark;
        emit MarkPosted(surveyId, mark.subjectId, mark.verdict);
    }
}`}
                  {activeCodeTab === "creditdesk" &&
                    `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./PlimsollRegistry.sol";

contract CreditDesk {
    PlimsollRegistry public immutable registry;

    function borrow(uint256 amountEth) external {
        bytes32 subjectId = registry.subjectOf(msg.sender);
        require(subjectId != bytes32(0), "unbound borrower");

        // Standing: requires k=3 valid ABOVE Marks spanning at least 1 hour
        bool qualified = registry.hasStanding(
            subjectId,
            OBSERVED_NET_ASSETS_USD,
            amountEth * 4000e8, // USD threshold in fixed-point
            3,                  // k=3 distinct surveys
            1 hours             // window
        );
        require(qualified, "Standing not established");

        // Disburse funds or activate GPU compute mandate
    }
}`}
                  {activeCodeTab === "cre" &&
                    `import { cre, type TeeRuntime } from "@chainlink/cre-sdk";

export const survey = async (runtime: TeeRuntime, log: SurveyRequestedLog) => {
  const { subjectId, lineId, surveyId } = decode(log);

  // 1. Decrypt CEX API key inside AWS Nitro enclave only
  const cexKey = await runtime.getSecret({ id: \`CEX_RO_\${subjectId}\` });

  // 2. Fetch private hold over HTTP (regular HTTPClient with TeeRuntime)
  const hold = await readHold(runtime, cexKey);

  // 3. Fetch Chainlink prices
  const prices = await readPrices(runtime, hold.assets);

  // 4. Evaluate threshold with haircuts (zero balance leaves enclave)
  const value = valueWithHaircuts(hold, prices);
  const verdict = evaluateLine(lineId, value);

  // 5. One-way door crossing payload
  const donRuntime = runtime.usingTheDons();
  return evmClient.writeReport(donRuntime, { surveyId, verdict, asOf: prices.asOf });
};`}
                </pre>
              </div>
            </div>
          </section>

          {/* CHAPTER 7 */}
          <section id="quickstart" className="border border-ink/15 bg-paper p-6 md:p-8 scroll-mt-24">
            <SectionLabel index="07" title="AGENT QUICKSTART" className="mb-4" />
            <h2 className="font-doto text-2xl md:text-3xl font-black text-ink mb-4">
              START TESTING IN 3 MINUTES
            </h2>

            <div className="space-y-4 text-sm text-ink/80 leading-relaxed">
              <p>
                To test the protocol locally or connect an existing agent:
              </p>

              <ol className="list-decimal pl-5 space-y-3 text-xs font-mono">
                <li>
                  <strong className="text-ink">Open the Protocol Dashboard:</strong> Visit{" "}
                  <a href="/dashboard" className="text-signal underline">
                    /dashboard
                  </a>{" "}
                  and use the interactive Bazantic 2-Service Runner to simulate
                  live underwriting.
                </li>
                <li>
                  <strong className="text-ink">Add Bazantic MCP to your client:</strong> Copy
                  the MCP configuration block from Tab 05 in the dashboard and
                  paste into <code className="text-ink">~/.claude/claude_desktop_config.json</code> or{" "}
                  <code className="text-ink">~/.cursor/mcp.json</code>.
                </li>
                <li>
                  <strong className="text-ink">Simulate CRE workflow:</strong> Run{" "}
                  <code className="bg-ink/[0.05] px-1 py-0.5 text-ink">
                    cre workflow simulate
                  </code>{" "}
                  with testnet credentials to verify that no balance amounts
                  leak outside the AWS Nitro enclave simulator.
                </li>
              </ol>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
