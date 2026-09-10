# Recipe · `underwrite_counterparty`

**Services:** `chainlink-price` → `plimsoll-survey`
**Purpose:** Decide whether to extend net terms to a counterparty agent, end to end, without
either side disclosing a balance.

---

## When to use this

A counterparty agent has proposed a deal denominated in a volatile asset and wants delivery
before payment. You need to size the credit risk in USD and decide.

Worked example, and the one the demo runs:

> A buyer agent wants **60 ETH of GPU-hours on net-30**. Extend it?

You cannot answer that without a price. 60 ETH is not a credit limit; $145,000 is. And you
cannot get the price from the buyer, because the buyer is the party you are underwriting.

## Why two services

Neither service answers the question alone, and the second depends on the output of the first:

1. **`chainlink-price`** turns the deal's denomination into a USD exposure at an oracle price
   the counterparty cannot influence.
2. **`plimsoll-survey`** tests whether the counterparty clears a Line — *and the Line's
   threshold is computed from step 1's output.*

Move the ETH price and the derived Line moves with it. Move it far enough and the selected rung
changes, and the decision can flip. That is the data dependency, and it is not contrived: an
agent quoting a deal in ETH genuinely needs a price to size a USD credit line.

## Steps

1. **Read the deal.** Extract the exposure amount and its denomination — `60`, `ETH` — and the
   settlement term. Get the counterparty's `subjectId`.

2. **Derive the Line.** Call `deriveLine(pair="ETH/USD", amount=60, subjectId=...)`.

   This prices the exposure and selects the lowest registered rung that covers it, in one call,
   so the arithmetic is auditable rather than reconstructed.

   Check three things in the response:
   - `quote.stale` — if true, the oracle round is older than the staleness guard. Do not
     underwrite off a stale price. Stop and report why.
   - `exposureUsd` — sanity-check it against the deal. This is your real credit risk.
   - `line` — if `null`, no registered rung covers this exposure. **Decline.** Do not ask at a
     lower rung; see `request_mark`.

3. **Request the Survey.** Call `requestSurvey({subjectId, lineId: line.lineId})`. This is the
   paid call. Keep the returned `surveyId`.

4. **Poll for the Mark.** Call `getMark(surveyId)` every ~5s until it returns 200. Give up after
   60 seconds and treat the outcome as `INDETERMINATE`.

5. **Decide.**

   | Condition | Decision |
   | --- | --- |
   | `verdict == ABOVE` and `expiry` in the future | Extend the terms. |
   | `verdict == BELOW` | Decline, or re-quote fully collateralised. |
   | `verdict == INDETERMINATE` | Decline. Not a soft yes. |
   | `expiry` already passed | Do not act. Request a fresh Survey. |

   For exposure you would be unhappy to lose, require Standing rather than a single Mark:
   `hasStanding(subjectId, thresholdUsd=line.thresholdUsd, k=3, window=86400)`. Three Surveys
   across a day cannot be flash-funded.

## Rules that are not optional

- **Never ask at a lower Line after a `BELOW`.** Binary-searching a private balance sheet is the
  one thing this protocol exists to prevent, and doing it is a defection against the subject
  that consented to answer you. Rate limits will stop you; do not make them have to.
- **Never treat `INDETERMINATE` as a weak yes.** It exists precisely so that "the exchange API
  was down" is distinguishable from "insolvent". Collapsing them destroys that.
- **Never underwrite off a stale price.** A wrong price yields a wrong Line, and a wrong Line
  yields a confidently wrong decision.
- **Report the derivation, not just the verdict.** When you explain your decision, state the
  price, the exposure, the Line selected, and the verdict. A bare "declined" is not auditable.

## What you are relying on when you say yes

Be precise about this, because `ABOVE` is narrower than it sounds. It attests:

> These allowlisted data sources, bound to this subject, queried at `asOf` with credentials the
> subject provisioned, reported holdings which — valued at Chainlink prices at `asOf`, after
> published haircuts — satisfied Line L.

It is not a solvency guarantee, not a credit score, and not a promise about the future. It does
not see off-balance-sheet obligations, and it cannot tell you whether the same assets have been
pledged to someone else. Size your exposure accordingly.
