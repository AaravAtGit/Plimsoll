# Plimsoll

**The load line for autonomous agents.** Proof of enough, not proof of how much.

A counterparty agent pays a few cents to ask one question about another agent — *"is it above
the line?"* — and gets a signed yes or no. The balance sheet behind the answer is read and valued
inside an AWS Nitro enclave by a Chainlink CRE Confidential Workflow. No node operator, no
counterparty, and not even Plimsoll ever sees an amount.

ETHOnline 2026 · **Chainlink — Best Confidential Workflow** · **Bazantic — Best Recipe that uses
ETHGlobal Hackathon Sponsor APIs**

---

## It is running. Check it yourself.

**On Bazantic:** the composed Recipe
[`underwrite-counterparty`](https://bazantic.com/recipes/underwrite-counterparty) is published,
bound to two live gateways — `chainlink-price` and `plimsoll-survey`. An agent with
`baz recipe install` sees it as one tool. Free discovery, no key:

```bash
curl -s https://api.bazantic.com/v1/recipes/underwrite-counterparty | jq '{handle, input_schema}'
curl -s -o /dev/null -w '%{http_code}\n' https://n5ejlr45ffgexl2vobsk72jv7e.bazgateway.com/price/ETH-USD   # 402: the price of asking
```

Two Marks are on Ethereum Sepolia, written by the Survey workflow through the CRE Forwarder from
real request transactions. Same subject, same Hold, same Chainlink round — opposite verdicts,
and not one amount in either.

| | Verdict | Line | Transaction |
| --- | --- | --- | --- |
| Survey `0xf0d9…61bf` | **ABOVE** | `observed_net_assets_usd >= $50` | [`0x8c9f…14d8`](https://sepolia.etherscan.io/tx/0x8c9ff398bbe53c86b7202f35a94eab088f20f4b73ef2d4ebab7d9c79973214d8) |
| Survey `0x447e…7b45` | **BELOW** | `observed_net_assets_usd >= $1000` | [`0x2e6b…736c`](https://sepolia.etherscan.io/tx/0x2e6b30b63ab4688e8d9f918b95891598d5b13f4758f094dd2f16a886ec5c736c) |

Sixty seconds, no keys:

```bash
O=https://plimsol-xi.vercel.app
S=0x61335871890d6e0c866ec4743b63b48d546c6c9d8acac9344c5787fbdec34838   # keccak("agent-solv-alpha.eth")

curl $O/api/price/ETH/USD                          # the Chainlink round the Survey valued at
curl $O/api/ladder/$S                              # the Lines the subject consented to be asked
curl $O/api/mark/0xf0d98823ca5d0b204e8048ff47060709425ab180c3daf0d3f954519c2fe061bf   # ABOVE
curl $O/api/mark/0x447ebfacd7bcb9fec9cfeee63c4da1dfeb9d31bf7a091a6e6906750da27b7b45   # BELOW
curl "$O/api/line-for/ETH/USD?amount=0.03&subjectId=$S"   # price an exposure, get the Line it implies
```

Read the Mark JSON and notice what is not in it: no balance, no per-asset amount, no price, no
margin, no ratio, no headroom. That absence is the product.

The Confidential Workflow simulation transcripts — the qualifying evidence for the Chainlink
track — are in [`docs/evidence/`](docs/evidence/), with the `handlerInTee` execution banner
intact.

| Contract | Sepolia |
| --- | --- |
| `PlimsollRegistry` | [`0xDE76042288d04539B9e18dc1C355219567B88447`](https://sepolia.etherscan.io/address/0xDE76042288d04539B9e18dc1C355219567B88447) |
| `CreditDesk` | [`0xf7F8332277D023c34d25F8aB51821942585D9aAB`](https://sepolia.etherscan.io/address/0xf7F8332277D023c34d25F8aB51821942585D9aAB) |
| `DemoUSD` | [`0x56ADc48076AB73a0f6ef664a3A3C03e9fAe8B398`](https://sepolia.etherscan.io/address/0x56ADc48076AB73a0f6ef664a3A3C03e9fAe8B398) |

---

## The problem

An autonomous agent wants credit: to borrow, to trade on margin, to take delivery before payment,
to be trusted with a mandate. The counterparty needs to know it is good for it.

Today there are two options and both are bad. Publish your balance sheet — and now the
counterparty knows exactly how hard to squeeze, and so does anyone they leak it to. Or be trusted
on your word — which is worth nothing.

Plimsoll is the third option: **a credit check that requires no disclosure.** It is deliberately
*not* a credit score, a solvency oracle or a reputation system. Those invite the question "how do
you know?", and nobody can answer it. A Plimsoll Mark makes a narrower claim, stated precisely,
and keeps it.

### The metaphor

A Plimsoll line is the mark painted on a ship's hull. The harbourmaster looks at it and knows the
ship is loaded safely. He never opens the hold, never sees the manifest, never learns the tonnage.
One bit, and it is enough to decide.

| Term | Meaning |
| --- | --- |
| **Hold** | The subject agent's private balance sheet. Never leaves the enclave. |
| **Line** | A threshold predicate, e.g. `observed_net_assets_usd >= 250000`. Chosen from rungs the subject pre-registered. |
| **Survey** | One confidential workflow execution. |
| **Mark** | The signed onchain attestation a Survey produces. A verdict plus provenance. No amounts. |
| **Standing** | An unbroken run of ABOVE Marks across a window. What a counterparty actually underwrites against. |

---

## How it works

```
Counterparty agent  "buyer wants 60 ETH of compute on net-30. Extend it?"
  │
  ├─► Bazantic Recipe `underwrite_counterparty`  ─►  decides a Mark is required
  │
  ├─► gateway 1  chainlink-price   GET /line-for/ETH/USD?amount=60&subjectId=…
  │       Chainlink ETH/USD → $151,200 exposure → lowest covering rung on the subject's ladder
  │
  ├─► gateway 2  plimsoll-survey   POST /survey  (x402, a few cents)
  │       the gateway sends ONE transaction: PlimsollRegistry.requestSurvey(subjectId, lineId)
  ▼
PlimsollRegistry emits SurveyRequested(surveyId, subjectId, lineId)          ← public, by design
  │
  ▼
CRE workflow — EVM Log trigger (Workflow DON)
  │
  ▼
╔══════════════════════════════════════════════════════════════════════╗
║ ENCLAVE — cre.handlerInTee, AWS Nitro us-west-2                      ║
║                                                                      ║
║   runtime.getSecret()             ← Vault DON releases the Hold key  ║
║   GET {api}/ladder/{subject}      ← the Line being tested (public)   ║
║   GET {api}/hold/{subject}        ← the Hold. Never leaves.          ║
║   GET {api}/price/ETH/USD         ← Chainlink Data Feed              ║
║                                                                      ║
║   value × haircuts  −  liabilities  ≥  threshold ?                   ║
║   mask BELOW → INDETERMINATE unless the subject consented            ║
╚═══════════════════════════════╤══════════════════════════════════════╝
                                │ runtime.usingTheDons()
                                │ surveyId · verdict · asOf · expiry · sourceSetHash · workflowId
                                ▼
Workflow DON  report → CRE Forwarder → PlimsollRegistry.onReport() → Mark
                                │
                                ▼
Recipe polls GET /mark/{surveyId} → reads verdict + expiry → extends terms, or refuses
CreditDesk.borrow() → registry.hasStanding() → disburses, or refuses
```

### The boundary, audited

`usingTheDons()` is a one-way door: whatever crosses it runs on ordinary DON nodes. So the
crossing payload *is* the privacy claim, and it is one struct, six fields, all verdict or
provenance:

```
bytes32 surveyId · uint8 verdict · uint64 asOf · uint64 expiry · bytes32 sourceSetHash · bytes32 workflowId
```

Not even the failure reason crosses. A source down, a stale price, a non-allowlisted asset, a
subject withholding consent — all collapse to the same `INDETERMINATE`, because *why* a Survey
could not answer is itself a fact about the Hold. Nothing is logged inside the handler unless a
debug flag is set, and it is off in every shipped config: logs cross the boundary too.

### Why it needs both sponsors

**Remove Chainlink and it collapses twice.** Without CRE Confidential Workflows there is nowhere
to compute over private balances — a plain workflow runs where operators can inspect it, which is
fine for weather and unacceptable for a balance sheet. And without Chainlink Data Feeds the
subject would price its own holdings, which is marking your own book.

**Remove Bazantic and it collapses once.** A Mark is worthless if the counterparty agent does not
know to ask for one, at the right moment, at the right Line. That judgement is not in an OpenAPI
spec — it is what the Recipe encodes. And every Survey costs real money, so it is paid per call
by whoever benefits, which is x402.

The Recipe chains two gateways, and the dependency is load-bearing: `chainlink-price` computes
the threshold that `plimsoll-survey` is asked at. Move the ETH price and the rung changes, and the
decision can flip.

---

## The trust model

A Mark does **not** attest that an agent is solvent. It attests:

> *These allowlisted data sources, bound to this subject, queried at time T with credentials the
> subject provisioned, reported holdings which — valued at Chainlink prices at T, after published
> haircuts — satisfy Line L.*

Narrower, and defensible. Everything below exists to keep that sentence true.

**The metric is `observed_net_assets_usd`, not net equity.** A read-only exchange key sees margin
borrow; a wallet read sees no debt at all; nothing sees an off-balance-sheet obligation. The
name says so.

**Haircuts, published.** USDC/USDT 1.00 · ETH/WETH/BTC 0.90 · everything else allowlisted 0.75.
Applied to assets, never to liabilities — a haircut shrinks what it touches, and shrinking a debt
would flatter the subject, the one direction this system must never round.

**Three-valued verdicts.** `INDETERMINATE` is not a soft yes. It exists so that "the exchange API
was down" is distinguishable from "insolvent", and consumers are required to treat it as no.

**Standing beats a snapshot.** One favourable Mark can be flash-funded: borrow, survey, draw,
unwind, in one block. `hasStanding(subject, metric, threshold, k, window)` requires *k* distinct
Surveys, all ABOVE, spanning *window* seconds. Three Marks across a day cannot be bought with a
one-block loan. `CreditDesk` refuses to lend without it.

**The ladder is the disclosure surface.** A subject registering `[50, 100, 250, 500, 1000]` has
consented to publishing roughly two bits about itself. Coarse ladders are a privacy property. The
per-`(subject, requester)` rate limit — not the fee — is what stops one counterparty walking the
ladder downward, and the Recipe forbids it in words.

**A BELOW leaks more than an ABOVE.** ABOVE gives a lower bound; BELOW gives an *upper* bound,
the more sensitive direction. Publishing a BELOW is opt-in per rung, and the enclave masks it to
INDETERMINATE before anything crosses.

**Honest limits, stated first.** The workflow's code and binary are not confidential — CRE
protects the data, not the logic, and our haircuts and grammar are public anyway. A Survey cannot
see whether the same assets are pledged elsewhere; an encumbrance registry is out of scope. And
a wallet that is publicly linked to its owner gains nothing from any of this: the protected thing
is the *mapping* from subject to sources, which lives only in server environment and never in a
response.

---

## Status

| | Component | State |
| --- | --- | --- |
| C1 | `PlimsollRegistry` | Deployed. 42 tests. |
| C2 | Survey workflow (`handlerInTee`) | Simulates end to end; two real Marks posted via `--broadcast`. |
| C3 | Hold adapter | Wallet read behind a shared key. A read-only exchange source is the next one in. |
| C4 | API | Live at `plimsol-xi.vercel.app`. |
| C5 | Bazantic gateways + Recipes | **Live.** Two active gateways; [`underwrite-counterparty`](https://bazantic.com/recipes/underwrite-counterparty) and [`request-mark`](https://bazantic.com/recipes/request-mark) published. |
| C6 | `CreditDesk` | Deployed. Refuses to lend without Standing. |
| C8 | Chainlink price service | Live (`/api/price`, `/api/line-for`). |
| C7 / C9 / C10 | Demo agents · dashboard · A/B clip | Not built. `baz recipe install` in an MCP client is the demo agent. |

Two things to say plainly. Confidential Workflows is in private beta; the confidential path is
what is simulated and submitted, exactly as the track allows, and the same handler registers with
`cre.handler` for a live DON deployment if access lands — one flag, one implementation. And the
registry is deployed against the *simulation* Forwarder, because that is what lets the Marks
above be real; a second registry against the live Forwarder is a redeploy, not a rewrite.

---

## Repository

```
plimsoll/
├── app/api/            The HTTP surface. /price /line-for /ladder /survey /mark /standing, and
│                       /hold — enclave-only, absent from every spec and gateway on purpose
├── contracts/          Foundry. PlimsollRegistry, CreditDesk, deploy + seed scripts
├── cre/                The Survey workflow: policy.ts (pure valuation), sources.ts, workflow.ts
├── bazantic/           Two Recipe definitions, and the registration guide
├── public/             The two OpenAPI specs Bazantic fetches
├── docs/evidence/      Simulation transcripts
└── src/                Landing page, guide, server services
```

Each directory's README goes deeper: [`contracts/`](contracts/README.md) on the receiver path
and the one deliberate deviation in `hasStanding`; [`cre/`](cre/README.md) on the boundary rules
and how to simulate; [`bazantic/`](bazantic/README.md) on the two-gateway flow.

```bash
pnpm install
pnpm contracts:test          # 42 tests
pnpm cre:test                # 14 tests over the valuation policy - no CRE toolchain needed
cp .env.example .env.local && pnpm dev     # :5199

# simulate a Survey against a real request transaction (needs the CRE CLI + Bun)
cd cre && cre workflow simulate ./survey --target staging-settings --non-interactive \
  --trigger-index 0 --evm-tx-hash 0xf144ebe718231974f38712e067ac0b42ad54eb69e7ab230d43f6801784fbd51b --evm-event-index 0
```

*"You will be notified when the ship is above the line. You will not be told by how much."*
