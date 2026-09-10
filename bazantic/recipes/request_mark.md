# Recipe · `request_mark`

**Service:** `plimsoll-survey`
**Purpose:** Obtain one confidential credit verdict about a counterparty without asking it to
disclose anything.

---

## When to use this

Reach for a Mark before you take uncollateralised exposure to an agent you have not previously
transacted with:

- extending credit or net terms
- releasing goods, compute or data ahead of payment
- opening margin against a counterparty
- granting a spending mandate

Do **not** use it for a fully collateralised, atomic, or prepaid trade. There is no exposure to
underwrite, and a Survey costs real money.

## What you need first

1. **A subject identity** — the `subjectId` (bytes32) of the agent you are underwriting. If the
   counterparty has not given you one, it is not enrolled and you cannot get a Mark.
2. **A Line** — a threshold at or above your intended exposure, chosen from the rungs the subject
   has already registered. Call `getLadder` to see them. You cannot invent a Line.
3. **A freshness window** — how old a verdict you will accept. Default 300 seconds.

## Steps

1. `getLadder(subjectId)` — read the registered rungs.
2. Select the **lowest** rung whose `thresholdUsd` is greater than or equal to your exposure.
   If no rung covers it, stop: the deal is larger than anything this subject consented to be
   asked about. Decline or reduce exposure. Do not ask at a lower rung.
3. `requestSurvey({subjectId, lineId})` — this is the paid call. You get back a `surveyId`.
4. `getMark(surveyId)` — poll every ~5s. It returns 202 `pending` while the enclave runs.
   Give up after 60 seconds and treat the result as INDETERMINATE.

## Reading the result

**A Mark is a boolean, not a balance.** There is no amount in it and there never will be.

| verdict | What it means | What to do |
| --- | --- | --- |
| `ABOVE` | The named, bound sources reported holdings satisfying the Line at `asOf`, after published haircuts. | Proceed, if `expiry` is still in the future. |
| `BELOW` | They did not. | Decline, or require collateral. |
| `INDETERMINATE` | No defensible answer: a source was down, a price was stale, or the subject withheld consent for BELOW on this rung. | Treat as no. It is **not** a soft yes. |

Always check `expiry` before acting on a Mark. A Mark that has lapsed tells you what was true
then, not what is true now.

`ABOVE` does **not** mean the counterparty is solvent, unencumbered, or will remain either. It
means specific allowlisted sources reported specific holdings at one moment. Nothing about
off-balance-sheet obligations, and nothing about whether the same assets are already pledged
elsewhere, is visible to a Survey.

## On `false` — read this before retrying

**Do not retry at a lower Line to discover the actual balance.**

It will feel like the obvious next move. A `BELOW` at $250k invites the question "well, what
*would* clear?", and walking down the ladder answers it in two or three calls. That is a
binary search over a private balance sheet, and the subject has not consented to it.

Plimsoll rate-limits requests per (subject, requester) pair specifically to bound this, so the
attempt will mostly fail anyway. But the reason not to do it is not that it fails. It is that
the entire value of a Mark to the subject is that answering does not disclose.

When a verdict comes back `BELOW` or `INDETERMINATE`, choose one of:

- **require collateral**, and price the deal accordingly
- **reduce exposure** below a rung the subject has *already* cleared, using an existing Mark
- **decline**

Note also that a `BELOW` leaks more than an `ABOVE`: `ABOVE` at $250k gives you a lower bound;
`BELOW` gives you an *upper* bound, which is the more sensitive direction. Treat a `BELOW` you
receive as confidential to the deal you are underwriting.

## Standing, when one Mark is not enough

A single Mark is a snapshot, and a snapshot can be arranged. An agent can borrow to fund its
holdings, take one favourable Survey, draw credit, and unwind.

For material exposure, call `hasStanding` instead: `k` distinct Surveys, all `ABOVE` at or above
your threshold, spanning at least `window` seconds. Three Marks across a day cannot be bought
with a one-block loan. Use a single Mark for small or short-dated exposure; require Standing for
anything you would be unhappy to lose.
