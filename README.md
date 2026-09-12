
# Plimsoll

**The load line for autonomous agents.**

Proof of enough, not proof of how much.

ETHOnline 2026 · Start Fresh · Targeting **Chainlink — Best Confidential Workflow** and **Bazantic — Best Recipe that uses ETHGlobal Hackathon Sponsor APIs**

---

## 0. The repository

One Next.js app plus a Foundry project. One repo, one deploy, one submission.

```
plimsoll/
├── app/                C9  Next.js 15 App Router - landing page and guide
│   └── api/            C4  Route handlers over viem - the surface Bazantic fronts
│                           C8 `chainlink-price` lives here too, as /price and /line-for
├── src/
│   ├── components/         The bits library, dashboard and guide
│   ├── sections/           Landing-page sections
│   └── server/             Chain reads, the price and survey services, typed ABIs
├── contracts/          C1  Foundry - PlimsollRegistry, C6 CreditDesk
├── cre/                C2  The Survey workflow (see cre/README.md)
├── bazantic/           C5  Recipe definitions, registration guide (see bazantic/README.md)
├── public/                 The two OpenAPI specs Bazantic fetches, served at the origin root
├── docs/                   The landing-page design brief
└── scripts/                gen-abi.sh - contracts -> src/server/abi
```

The API is not a separate service. It is route handlers in the same Next app, so there is one
`pnpm dev`, one Vercel deploy, and one origin for Bazantic to point its paywall at.

**C2** is written but not yet run: the `cre` CLI and Bun are not installed here, so the policy
layer is covered by unit tests and the workflow itself has never been compiled or simulated. The
first `cre workflow simulate` is the real test. See [`cre/README.md`](cre/README.md).

Still unbuilt: **C3** the Hold adapters, **C7** the demo agents, **C9** the dashboard, **C10**
the A/B clip. There is no dashboard route: the one that existed drove itself entirely from
hardcoded state, showing Marks that had never been surveyed, and was removed rather than left
to imply otherwise.

Before writing more code, work through [`CHECKLIST.md`](CHECKLIST.md): every account, wallet,
tool and decision that only a human can supply, and which code step each one unblocks.

### Quickstart

```bash
pnpm install

# contracts
pnpm contracts:test          # 42 tests
pnpm contracts:build

# the Survey's policy layer - haircuts, the threshold, consent masking
pnpm cre:test                # 14 tests, no CRE toolchain needed

# web + API - needs a deployed registry address
cp .env.example .env.local
pnpm dev                     # :5199, the API under /api
```

Deploying the contracts, and the one deliberate deviation from the `hasStanding` spec below, are
documented in [`contracts/README.md`](contracts/README.md). The Survey workflow, its two
registration modes and the audit of the crossing payload are in [`cre/README.md`](cre/README.md).
Bazantic registration and the Recipe quality gate are in
[`bazantic/README.md`](bazantic/README.md).

---

## 1. The pitch

An autonomous agent wants credit. It wants to borrow, to trade on margin, to take delivery before payment, to be trusted with a mandate. The counterparty needs to know it is good for it.

Today there are two options and both are bad. Publish your balance sheet — and now the counterparty knows exactly how hard to squeeze, and so does anyone they leak it to. Or be trusted on your word — which is worth nothing.

Plimsoll is a third option. A counterparty agent pays a few cents to ask one question:

> **"Is this agent above the line?"**

A Chainlink CRE Confidential Workflow reads the subject's private holdings **inside an AWS Nitro enclave**, values them at Chainlink prices, evaluates a threshold, and emits a boolean. Only that boolean crosses back to the Workflow DON, where consensus verifies the enclave attestation and signs a report that lands onchain as a **Mark**.

The verdict is public and verifiable. The amounts are never seen by a node operator, never logged, never written.

Bazantic is what makes any of it usable. The Survey endpoint is an x402-paid gateway with an MCP server and a **Recipe** that teaches a counterparty agent *when* to demand a Mark, *what Line* to set it at, and *what to do* when the verdict comes back false.

### The metaphor, used consistently

A Plimsoll line is the mark painted on a ship's hull. The harbourmaster looks at it and knows the ship is loaded safely. He never opens the cargo hold, never sees the manifest, never learns the tonnage. One bit of information, and it is enough to make the decision.

| Term | Meaning |
| --- | --- |
| **Hold** | The subject agent's private balance sheet. Never leaves the enclave. |
| **Line** | The threshold predicate being tested, e.g. `observed_net_assets_usd >= 250000`. |
| **Survey** | One confidential workflow execution. |
| **Mark** | The signed onchain attestation a Survey produces. Boolean verdict plus metadata. No amounts. |
| **Standing** | An unbroken run of true Marks across a window. What a counterparty actually underwrites against. |

---

## 2. Why this needs both sponsors

State this in the video. Judges are testing for exactly this.

### Remove Chainlink and it collapses two ways

**Confidentiality.** Without CRE Confidential Workflows there is nowhere to compute over private balances. A plain CRE workflow runs on Workflow DON nodes where operators can in principle inspect what is being computed — that is fine for a weather feed and unacceptable for a balance sheet. `cre.handlerInTee` is what puts the exchange credentials and the holdings inside a hardware-isolated enclave, with the secret released by the Vault DON only into an attested enclave. There is no other primitive in this hackathon that does this.

**Valuation integrity.** A solvency claim over volatile assets is meaningless without a trusted price. If the subject supplies its own prices, it marks its own book. Chainlink Price Feeds are what stop that.

### Remove Bazantic and it collapses one way

A Mark is worthless if the counterparty agent does not know to ask for one, at the right moment, at the right Line. That judgement is not in an OpenAPI spec. It is precisely what a Recipe encodes. And every Survey costs real money — exchange API calls, RPC, gas — so it has to be paid per request by whoever benefits. That is x402.

Without Bazantic, Plimsoll is an API with a Postman collection that no agent will ever invoke correctly, at the correct time, on its own initiative.

---

## 3. Positioning

Plimsoll is **not** a credit score, a solvency oracle, or a reputation system. Those framings invite the question "how do you know?" and we cannot answer it.

Plimsoll is **a credit check that requires no disclosure**. That framing is narrow, defensible, and true. Everything in this README holds the line on it.

The demo vertical is deliberately concrete: **agent-to-agent commerce on net terms.** A buyer agent wants goods or compute released before payment. A seller agent has to decide. That is a real decision an agent makes today with no good tool.

---

## 4. Architecture

```
Counterparty agent
  │  "buyer wants 60 ETH of compute on net-30. Extend it?"
  │
  ├─► Bazantic MCP + Recipe ──► decides a Mark is required
  │
  ├─► [Bazantic service 1] Chainlink price service
  │       60 ETH → $246,000 exposure → Line = observed_net_assets_usd >= 250000
  │
  ├─► [Bazantic service 2] Plimsoll Survey gateway (x402)
  │       payment settles → gateway calls requestSurvey() onchain
  │
  ▼
PlimsollRegistry.sol emits SurveyRequested(surveyId, subjectId, lineId)
  │
  ▼
CRE workflow — EVM Log trigger (runs on Workflow DON)
  │
  ▼
╔══════════════════════════════════════════════════════════════╗
║ ENCLAVE  — cre.handlerInTee, AWS Nitro / us-west-2            ║
║                                                              ║
║  runtime.getSecret({ id: 'BINANCE_RO_KEY' })   ← Vault DON    ║
║  HTTPClient.sendRequest(runtime, ...)          ← private hold ║
║  HTTPClient.sendRequest(runtime, ...)          ← prices       ║
║                                                              ║
║  value(hold) with haircuts → compare to Line                 ║
║  ── amounts never logged, never emitted ──                   ║
╚═════════════════════════╤════════════════════════════════════╝
                          │ runtime.usingTheDons()
                          │ ONLY { surveyId, verdict, asOf, sourceSetHash }
                          ▼
Workflow DON — donRuntime.report(...) → consensus verifies attestation
                          │
                          ▼
evmClient.writeReport → PlimsollRegistry.postMark()   (Ethereum Sepolia)
                          │
                          ▼
CreditDesk.sol reads Standing → disburses or refuses
```

### Components

| # | Component | Stack | Status |
| --- | --- | --- | --- |
| C1 | `PlimsollRegistry.sol` | Solidity, Ethereum Sepolia | Must have |
| C2 | Survey workflow | CRE TypeScript SDK, `handlerInTee` | Written, unsimulated |
| C3 | Hold adapters | One real CEX read-only key, one real wallet read | Must have |
| C4 | Plimsoll API | Thin HTTP service: trigger Survey, read Marks | Must have |
| C5 | Bazantic gateway + MCP + 2 Recipes | bazantic.com | Must have |
| C6 | `CreditDesk.sol` | Consumer contract that refuses to lend without valid Standing | Must have |
| C7 | Demo agents | Subject agent + counterparty agent, MCP clients | Must have |
| C8 | Chainlink price service on Bazantic | Second service for the composed Recipe | Must have |
| C9 | Minimal UI | Two agent panes, live Mark card, links to Sepolia | Not built |
| C10 | A/B clip | Recipe on vs off, n=10, reported as a rate | Nice to have |

---

## 5. The confidential architecture — read this before writing any workflow code

This section exists because the CRE confidentiality boundary is narrower than most people assume, and building against the wrong mental model costs three days.

### 5.1 What CRE actually protects

Straight from the Confidential Workflows docs:

| Protected | **Not** protected |
| --- | --- |
| Secrets the Vault DON releases into the enclave | Triggers, chain reads, and chain writes — these always run on Workflow DON nodes |
| Sensitive inputs and intermediate values you do not share outside the enclave | Your workflow's source code and deployed binary |
| Capability calls made *from inside* the enclave | Capability calls not routed through the enclave |
| Enclave execution memory while your computation runs | Reports, calldata, and anything you deliver outside the enclave |

Three consequences that shape our design:

1. **`usingTheDons()` is a one-way door.** Whatever you pass onto that runtime executes on DON nodes like any normal call. So the crossing payload is the entire privacy claim, and it must contain no quantities. We audit it as a single struct, once, and grep the simulator output to prove it.
2. **Chain reads do not happen inside the enclave.** So we do **not** read Chainlink Price Feeds via `evm.Client` from inside the TEE. Prices come in over `HTTPClient.sendRequest(runtime, req)`, which is the confirmed-supported path for outbound calls from a TEE handler.
3. **Do not log from inside the enclave.** Logs cross the boundary. Every `runtime.log()` in the TEE handler is gated behind `if (config.debug)` and `debug` is false in the submitted config.

### 5.2 Two hard rules from the docs

- Inside `handlerInTee`, use the **regular `HTTPClient`** and pass it the `TeeRuntime`. **Do not use `ConfidentialHTTPClient`** — it has no `TeeRuntime` overload and is not meant to be called from a TEE handler.
- TEE constraint: `[{ tee: 'nitro', regions: ['us-west-2'] }]`. AWS Nitro in `us-west-2` is currently the only registered TEE type and region. Do not parameterise this.

### 5.3 The de-risking decision: simulate first, deploy if access lands

Confidential Workflows is in **private beta** and requires enrollment through a Chainlink account team. This was the biggest single risk in the original plan.

It is not a blocker, because the track's qualification requirement reads:

> Demonstrate a successful execution through either: a Confidential Workflow simulation using the CRE CLI **or** a live deployment on the CRE network. Provide evidence such as a demo video, terminal output, execution logs, or deployment details.

So the plan is:

- **Day 1, first hour:** submit the Confidential Workflows access request. It is a form. Cost: ten minutes. Upside: a real deployment.
- **Primary qualification path:** `cre workflow simulate` of the confidential Survey, with real secrets, a real exchange API call, real prices, and real threshold logic. Terminal output captured, in the video. This qualifies on its own terms and depends on nothing but the CLI.
- **Live onchain Marks for the product demo:** the Survey handler is written once and registered through a single switch.

```ts
// workflow.ts — one implementation, two registration modes
const survey = async (runtime: TeeRuntime | Runtime, log: SurveyRequestedLog) => { /* ... */ }

export const initWorkflow = (config: Config) =>
  config.confidential
    ? [cre.handlerInTee(evmLogTrigger, survey, [{ tee: "nitro", regions: ["us-west-2"] }])]
    : [cre.handler(evmLogTrigger, survey)]
```

`confidential: true` is simulated with the CRE CLI and is what we submit for the Chainlink track. `confidential: false` is deployed to CRE so that real Marks land on Sepolia during the live demo. **This is stated plainly in the README and the video** — the confidential path is the product, the DON path is a deployment convenience while beta access is pending. If access lands mid-hackathon, the flag flips and the distinction disappears.

The confidential handler is not a placeholder or an isolated example. It is the Survey. It processes the exchange credential, the private holdings, and the threshold comparison — the entire sensitive core of the application. That is what the track asks for.

### 5.4 Trigger choice: EVM Log, not HTTP

The gateway does not call the workflow directly. After x402 payment settles, the gateway sends one transaction:

```solidity
requestSurvey(bytes32 subjectId, uint16 lineId) returns (bytes32 surveyId)
// emits SurveyRequested(surveyId, subjectId, lineId, requester, requestedAt)
```

A CRE **EVM Log trigger** picks that up and runs the Survey. Why this over an HTTP trigger:

- No JWT auth plumbing for deployed workflows. One less system to debug on Day 8.
- The demo gets a clean two-transaction trail: *request tx → Mark tx*. That is far more legible on screen than an opaque HTTP call.
- It matches the shape of the Event Reactor and Automated Liquidation Protection templates, so there is a working reference to copy from.
- The trigger runs on the DON, which is correct — the *request* is public. Only the Hold is secret.

The gateway returns `surveyId` to the caller immediately; the agent polls `GET /mark/{surveyId}`. The Recipe tells the agent to poll, so this is invisible to the counterparty agent's reasoning.

HTTP trigger is a post-hackathon upgrade, not a Day 1 problem.

### 5.5 The Survey handler

```ts
import { cre, type TeeRuntime } from "@chainlink/cre-sdk"

const survey = async (runtime: TeeRuntime, log: SurveyRequestedLog) => {
  const { subjectId, lineId, surveyId } = decode(log)

  // 1. Secrets released by the Vault DON, decrypted in-enclave only
  const cexKey = await runtime.getSecret({ id: `CEX_RO_${subjectId}` })
  const priceKey = await runtime.getSecret({ id: "CHAINLINK_DATA_KEY" })

  // 2. Private holdings — fetched from inside the enclave
  const hold = await readHold(runtime, cexKey)         // HTTPClient.sendRequest(runtime, ...)

  // 3. Prices — also from inside the enclave (chain reads do NOT run in the TEE)
  const prices = await readPrices(runtime, priceKey, hold.assets)

  // 4. The private policy: haircuts and the threshold
  const line = LINES[lineId]
  const value = valueWithHaircuts(hold, prices, HAIRCUTS)   // never leaves
  const verdict = evaluate(line, value)                      // ABOVE | BELOW | INDETERMINATE

  // NO runtime.log() of value, hold, or prices. Ever.

  // 5. One-way door. Audit this payload — it is the entire privacy claim.
  const donRuntime = runtime.usingTheDons()
  const report = await donRuntime.report({
    surveyId,
    subjectId,
    lineId,
    verdict,                    // uint8
    asOf: prices.observedAt,    // uint64
    sourceSetHash,              // bytes32
  })

  return evmClient.writeReport(donRuntime, report)
}
```

Note what is *not* in the crossing payload: no balance, no per-asset amount, no price, no margin, no ratio, no headroom. If you ever find yourself wanting to add `netAssets` so the frontend can show a progress bar — stop. That is the whole product.

### 5.6 Day 1 unknown, with a decided fallback

**D1 — Which Chainlink price source do we call from inside the enclave?**

- **Preferred:** Chainlink Data Streams REST API, credentials fetched via `runtime.getSecret()`. This is the textbook case for enclave secrets and it keeps Chainlink as the price authority. Request credentials from Chainlink Discord on Day 1.
- **Fallback (decided now, no deliberation later):** a thin `chainlink-price` HTTP service we host that reads `AggregatorV3Interface.latestRoundData()` on Sepolia via RPC and returns signed JSON with `roundId` and `updatedAt`. The enclave calls it over HTTP and enforces a staleness guard on `updatedAt`. Prices remain Chainlink prices; only the transport changes. This service is needed anyway — it is Bazantic service 1 in §7.

Either way we get Chainlink valuation and a working enclave. **The Survey does not block on D1.** Build against the fallback from hour one and swap if Data Streams credentials arrive.

**D2 — Staleness guard.** Reject any price older than 3600s on testnet feeds and emit `INDETERMINATE`. Testnet feeds go stale constantly; without this the demo dies on camera.

---

## 6. The trust model

This is what separates a winning submission from a hand-wave. Judges will ask "can't the subject just lie?" Have the answer ready.

**Plimsoll does not attest that an agent is solvent.** It attests:

> *These allowlisted data sources, bound to this subject, queried at time T with credentials the subject provisioned, reported holdings which — valued at Chainlink prices at T, after published haircuts — satisfy Line L.*

That is a narrower and far more defensible claim. Be precise about it everywhere, including in the video.

### 6.1 The metric name is part of the honesty

The original design called the metric `net_equity_usd`. That name implies liabilities are fully accounted for. They are not — a read-only exchange key shows margin borrow, a wallet read shows no debt at all, and nothing shows off-balance-sheet obligations.

The metric is **`observed_net_assets_usd`**: assets observed at the named sources, minus liabilities visible at those same sources, after haircuts. Renaming it costs nothing and it is the clearest possible signal that we understand our own claim.

### 6.2 Haircuts

Valuing a long-tail token at oracle mid and calling it collateral ignores liquidation slippage. Every allowlisted asset carries a haircut factor and the Line is evaluated on haircut value:

| Asset class | Haircut |
| --- | --- |
| USDC, USDT | 1.00 |
| ETH, WETH, BTC | 0.90 |
| Everything else allowlisted | 0.75 |

The haircut table is public, versioned, and committed into `sourceSetHash`. A Mark is therefore reproducible by anyone with the same inputs.

### 6.3 Attacks and mitigations

| Attack | Mitigation | Build or document |
| --- | --- | --- |
| Subject provisions credentials to an account it does not control | **Account binding**, separate from source allowlisting. Wallets: EIP-712 signature from the key, stored as `subjectId → boundAddresses[]`. Exchanges: one-time nonce-derived micro-withdrawal to a bound address. | **Build** wallet binding. Document the CEX binding flow and implement if Day 4 allows. |
| Fabricated or unrecognised data source | Source allowlist in the registry. `sourceSetHash` records which allowlisted sources contributed. | **Build** |
| Replay of an old favourable Mark | `asOf` + `expiry` + `surveyId` nonce. `CreditDesk` rejects stale Marks. | **Build** |
| **Flash-funded hold surveyed at a chosen moment** | **Standing**: `CreditDesk` requires *k* distinct true Marks spanning ≥ *w* seconds, with distinct `surveyId`s. A one-block loan cannot produce a run. | **Build** — this is a loop in Solidity, not a stretch goal |
| Binary-search leak: probing many Lines to reconstruct the balance | Subject pre-registers a coarse Line ladder. Rate-limit per `(subject, requester)` pair, not globally. The Recipe explicitly forbids downward probing. | **Build** the ladder and the pair-scoped limit |
| Subject double-pledges the same hold to two counterparties | Out of scope. Needs an encumbrance registry. | **Document as out of scope, plainly** |

### 6.4 Honest limits we state ourselves

Naming these unprompted reads as confidence, not weakness.

- **The Line ladder *is* the disclosure.** A subject registering `[100k, 250k, 500k, 1m]` has published two bits of its balance to anyone willing to pay four times. That is consented, quantised disclosure — not a defeat of the attack. We say so.
- **A `false` verdict leaks more than a `true` one.** `true` at 250k gives a lower bound; `false` gives an *upper* bound, which is the more sensitive direction. Subjects opt in per-Line to having `false` published at all; otherwise the Mark reads `INDETERMINATE`.
- **The workflow's source code and binary are not confidential.** CRE protects the data processed inside the enclave, not the logic. Our haircuts and Line grammar are public anyway, by design.
- **Rate limits are the privacy mechanism, not the fee.** A few cents does not deter anyone. The pair-scoped counter does.

---

## 7. Bazantic — the Recipe is the product

Most teams treat the Recipe as paperwork. It is the deliverable. Write it before the agents.

### 7.1 Qualifying for "Best Recipe that uses ETHGlobal Hackathon Sponsor APIs"

The track requires **two services in one working flow**, with the final result depending meaningfully on both, and data moving between them. Their own example is Uniswap `GET /swap` feeding 1inch trace.

An earlier draft of this design failed that bar: Chainlink sat *inside* Plimsoll, so an agent only ever called one Bazantic service and the oracle read was invisible. A judge could reasonably call that one service with a wrapper.

**The fix — make the price lookup an agent-visible step that derives the Line.**

| | Service | Provider | Role |
| --- | --- | --- | --- |
| **1** | `chainlink-price` gateway | Ours, reading the Chainlink Data Feed (sponsor API) | Returns the current Chainlink price for an asset, with `roundId` and `updatedAt`, and derives the Line. |
| **2** | `plimsoll-survey` gateway | Ours, x402/MPP | Requests a Survey at a given Line and returns the Mark. |

Two gateways, two specs, one origin. There is no Chainlink price gateway on Bazantic to bind
to - checked against the live listing - so service 1 is ours, and the sponsor API is the feed
it reads.

The composed Recipe, `underwrite_counterparty`:

1. Read the proposed deal. Exposure is denominated in **ETH** — `60 ETH of GPU-hours, net-30`.
2. Call **service 1** for the ETH price. `60 × $4,100 = $246,000`.
3. Round up to the nearest Line the subject has pre-registered → `observed_net_assets_usd >= 250000`.
4. Call **service 2** with that Line. Pay via x402. Poll for the Mark.
5. Read `verdict` and `expiry`. Decide.

The Line's threshold is **literally computed from service 1's output** and the verdict comes from service 2. Change the ETH price and the Line changes and the decision can flip. Data moves 1 → 2. Neither service answers the question alone. This is exactly the shape the track asks for, and it is not contrived — an agent quoting a deal in ETH genuinely needs a price to size a USD credit line.

`chainlink-price` doubles as the D1 fallback from §5.6, so it is not extra work. It is the same service, exposed twice.

> **Not pursuing:** "Agentify a new API" ($1,000). Deliberately dropped. It would demand a third-party API that is neither on Bazantic nor from any sponsor, which is scope we do not have and a dependency we do not want.
>
> **Not pursuing:** "Help an Agent Use Your Hackathon Project" ($1,000). Continuity-track only; we are Start Fresh and ineligible. The A/B evidence is still produced, but as a 30-second supporting clip for Best Recipe, not as a build phase.

### 7.2 The Recipes we ship

**`request_mark`** — the primitive.

> **When.** Before extending credit, opening undercollateralised exposure, releasing goods ahead of payment, or granting a spending mandate to a counterparty you have not previously transacted with.
>
> **Needs.** A subject identity, a Line at or above your intended exposure chosen from the subject's registered ladder, and a freshness window. Default 300 seconds.
>
> **Reading the result.** A Mark is a boolean, not a balance. `verdict: ABOVE` means the named, bound sources reported holdings satisfying the Line at `asOf`, after published haircuts. It does not mean the counterparty is solvent, unencumbered, or will remain so. Check `expiry` before acting. `INDETERMINATE` is not a soft yes — treat it as no.
>
> **On false.** Do **not** retry at a lower Line to discover the actual balance. Plimsoll rate-limits this per requester and the subject has not consented to it. Either require collateral, reduce exposure below a Line the subject has already cleared, or decline.

That last instruction is load-bearing: it is the Recipe defending the privacy property against the agent's own natural curiosity. Call this out explicitly in the submission — it is the single most interesting thing about the Recipe.

**`underwrite_counterparty`** — the composed two-service flow in §7.1. This is the one submitted for the track.

If time allows, `maintain_standing` (subject-side, keeps a valid Mark live) is a third. It is cut without hesitation if Day 9 is tight.

### 7.3 Recipe quality gate

From a bare MCP client with only the Recipe and no other context, an agent completes an underwriting decision without human intervention — including refusing on `false` and not probing downward. Iterate until that holds on 8 of 10 runs. Budget more time here than feels necessary; Recipe quality is judged directly.

---

## 8. Data model

### The Mark, onchain

```solidity
struct Mark {
    bytes32 subjectId;      // ENS node or agent DID — NOT hashed; hashing buys no privacy
    uint16  lineId;         // index into the subject's registered Line ladder
    uint8   verdict;        // 0 = INDETERMINATE, 1 = ABOVE, 2 = BELOW
    uint64  asOf;           // when the hold and prices were observed
    uint64  expiry;         // after which no consumer should honour it
    bytes32 surveyId;       // unique per execution, prevents replay
    bytes32 sourceSetHash;  // allowlisted sources + haircut table version
    bytes32 workflowId;     // which workflow version produced it
}
```

Nothing here is a quantity.

`workflowId` exists because you *will* redeploy the workflow mid-hackathon, and old Marks must be distinguishable from new ones.

`verdict` is three-valued deliberately. Without `INDETERMINATE`, a consumer cannot distinguish "the exchange API was down" from "insolvent" from "never asked", and a subject's Standing record becomes dishonest.

### The Line, structured — not just a hash

The original design stored only `bytes32 lineHash`. That is a real bug: a hash gives equality, not ordering. A counterparty with $180k exposure holding a Mark cleared at $250k could not tell whether it satisfies their requirement, because `keccak("...>= 250000") != keccak("...>= 180000")`. `isAboveLine()` could not answer the question it is named for, every consumer would need an exact-match Line, and that multiplies Surveys *and* worsens the binary-search leak.

```solidity
struct Line {
    uint8   metricId;    // 0 = OBSERVED_NET_ASSETS_USD, 1 = OBSERVED_LIQUID_USD
    uint8   comparator;  // 0 = GTE
    uint256 threshold;   // 1e8 fixed point
}
```

Now `isAboveLine(subjectId, OBSERVED_NET_ASSETS_USD, 180000e8)` scans for any unexpired `ABOVE` Mark whose `threshold >= 180000e8`. One Mark serves many counterparties. `lineHash` is retained only as a canonical display string for the UI.

The grammar is frozen after Day 3. Two metrics, one comparator, no boolean operators in v1. A general expression language is a two-day sinkhole and we are not building one.

### Standing

```solidity
function hasStanding(
    bytes32 subjectId,
    uint8   metricId,
    uint256 threshold,
    uint8   k,        // e.g. 3
    uint64  window    // e.g. 86400
) external view returns (bool);
```

Requires `k` distinct `surveyId`s, all `ABOVE`, all with `threshold >= requested`, spanning at least `window` seconds, none expired. This is the answer to flash-funding and it is an afternoon of work.

### Registry access control

```solidity
address public immutable forwarder;   // the CRE Forwarder for our workflow
modifier onlyForwarder() { require(msg.sender == forwarder, "not forwarder"); _; }
function postMark(...) external onlyForwarder { ... }
```

Without this, anyone posts themselves an `ABOVE`. It is the first question a Chainlink judge asks. The forwarder address comes from the CRE Forwarder Directory for Sepolia.

### CreditDesk binds the borrower to the subject

The Mark attests about `subjectId`. The money goes to an address. Nothing connects them unless we make it:

```solidity
function borrow(uint256 amount) external {
    bytes32 subjectId = registry.subjectOf(msg.sender);   // from the binding registry
    require(subjectId != bytes32(0), "unbound borrower");
    require(registry.hasStanding(subjectId, OBSERVED_NET_ASSETS_USD, amount, 3, 1 days), "no standing");
    // ... disburse
}
```

Otherwise any address can present someone else's good Mark.


