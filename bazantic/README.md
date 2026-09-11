# Bazantic integration

Bazantic is where Plimsoll becomes usable by an agent. It wraps our HTTP API in an x402/MPP
gateway, serves an MCP server, and hosts the Recipes that teach a counterparty agent *when* to
demand a Mark, *what Line* to set it at, and *what to do* when the verdict comes back false.

Without it, Plimsoll is an API with a Postman collection that no agent will ever invoke
correctly, at the correct time, on its own initiative.

## What lives where

| | |
| --- | --- |
| `../app/api/` | The HTTP surface Bazantic fronts. Plain, unauthenticated, testable. |
| `../openapi.yaml` | The spec to hand Bazantic when registering the gateway. |
| `recipes/request_mark.md` | The primitive. One Survey, one verdict, and the rules for reading it. |
| `recipes/underwrite_counterparty.md` | The composed two-service flow. **This is the one submitted for the track.** |

## Payment lives in exactly one place

The route handlers implement **no** x402 middleware, deliberately. Bazantic creates the x402/MPP
gateway for our API and enforces the paywall there. Two paywalls is one more than the number
that can be correct — if payment logic starts appearing in `app/api/`, something has gone wrong.

Every Survey costs real money (exchange API calls, RPC, Sepolia gas), so it has to be paid per
request by whoever benefits. That is what x402 is for. Note that the fee is **not** the privacy
mechanism: a few cents deters nobody from walking the ladder downward. The per-(subject,
requester) rate limit in `PlimsollRegistry` is what does that work.

## Registering — the two services

The track requires two services in one working flow, with the final result depending
meaningfully on both and data moving between them.

| | Service | Provider | Role |
| --- | --- | --- | --- |
| 1 | `chainlink-price` | Chainlink (sponsor) | Returns the Chainlink price, with `roundId` and `updatedAt`, and derives the Line an exposure implies. |
| 2 | `plimsoll-survey` | Plimsoll (ours, x402/MPP) | Requests a Survey at that Line and returns the Mark. |

The data dependency is real and load-bearing: the Line's threshold is *computed from service 1's
output*, and the verdict comes from service 2. Change the ETH price and the derived Line changes,
the selected rung can change, and the decision can flip. Neither service answers the question
alone.

`chainlink-price` is not extra work — it doubles as the price transport for the Survey enclave,
which cannot read chain state directly. Chain reads always run on Workflow DON nodes, never
inside the TEE, so the enclave reaches prices over HTTP or not at all. Same service, exposed
twice.

## Steps

1. Deploy the app (Vercel). The API rides along at `<origin>/api`. Set `PLIMSOLL_REGISTRY` to the
   deployed registry address.
2. On bazantic.com, create an **x402/MPP gateway** for `<origin>/api`, using `../openapi.yaml`
   as the spec.
3. Expose the two services above as separate tool groups so an agent sees them as two.
4. Publish both Recipes.
5. Generate the MCP server and verify an agent can complete a decision from a bare client.

## The quality gate

From a bare MCP client with only the Recipe and no other context, an agent must complete an
underwriting decision without human intervention — including **refusing on `false`** and **not
probing downward**. Iterate until that holds on 8 of 10 runs.

Budget more time here than feels necessary. Recipe quality is judged directly, and the
downward-probing refusal is the single most interesting thing in the submission: it is the
Recipe defending the privacy property against the agent's own natural curiosity.
