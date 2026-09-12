# Bazantic integration

Bazantic is where Plimsoll becomes usable by an agent. It fronts our HTTP API with an x402/MPP
gateway, generates an MCP server from our OpenAPI spec, and hosts the Recipes that teach a
counterparty agent *when* to demand a Mark, *what Line* to set it at, and *what to do* when the
verdict comes back false.

Without it, Plimsoll is an API with a Postman collection that no agent will ever invoke
correctly, at the correct time, on its own initiative.

## What lives where

| | |
| --- | --- |
| `../app/api/` | The HTTP surface Bazantic fronts. Plain, unauthenticated, testable. |
| `../public/openapi.chainlink-price.yaml` | Spec for gateway 1. Served at `<origin>/openapi.chainlink-price.yaml`. |
| `../public/openapi.plimsoll-survey.yaml` | Spec for gateway 2. Served at `<origin>/openapi.plimsoll-survey.yaml`. |
| `recipes/*.recipe.json` | The two Recipe definitions, in the shape `baz recipe create` takes. |
| `recipes/*.md` | The same Recipes as prose - the rationale, and the source of each `prompt_template`. |

## Payment lives in exactly one place

The route handlers implement **no** x402 middleware, deliberately. The Bazantic gateway takes
payment, forwards the call, and returns whatever we said. Two paywalls is one more than the
number that can be correct - if payment logic starts appearing in `app/api/`, something has
gone wrong.

Every Survey costs real money (exchange API calls, RPC, Sepolia gas), so it is paid per request
by whoever benefits. The fee is **not** the privacy mechanism: a few cents deters nobody from
walking the ladder downward. The per-(subject, requester) rate limit in `PlimsollRegistry` is
what does that work.

## Two gateways, not two tool groups

The track requires two services in one working flow, with the final result depending on both
and data moving between them. On Bazantic the unit of a service is a **gateway**, and a gateway
is one OpenAPI spec - so the two services are two registrations, each with its own spec, both
pointing at the same origin.

| | Gateway | Spec | Role |
| --- | --- | --- | --- |
| 1 | `chainlink-price` | `openapi.chainlink-price.yaml` | Returns the Chainlink price with `roundId` and `updatedAt`, and derives the Line an exposure implies. |
| 2 | `plimsoll-survey` | `openapi.plimsoll-survey.yaml` | Requests a Survey at that Line and returns the Mark. |

Both are ours. There is no Chainlink price gateway on Bazantic to bind to (checked against the
live listing), and the sponsor API in play is the Chainlink Data Feed that gateway 1 reads.

The data dependency is real and load-bearing: `deriveLine` on gateway 1 computes the threshold
that `requestSurvey` on gateway 2 is asked at. Change the ETH price and the derived Line
changes, the selected rung can change, and the decision can flip. Neither answers alone.

`chainlink-price` is not extra work. The Survey enclave cannot read chain state - chain reads
run on Workflow DON nodes, never in the TEE - so it reaches `/api/price` over HTTP too. The
enclave hits the origin directly; the gateway fronts the same route for agents. One
implementation, exposed twice.

## Steps

The split to plan around: **the CLI registers a draft, the browser makes it serve.** Auth type,
credential delivery and per-method prices are dashboard-only.

```bash
npm i -g @bazantic/cli            # `baz`, needs >= 0.8.0 for `baz recipe`
baz login                         # prints an approval URL to stderr; open it, approve
baz whoami --json
```

1. **Deploy the app** (Vercel). The API rides along at `<origin>/api` and the specs at
   `<origin>/openapi.*.yaml`. Set `PLIMSOLL_REGISTRY` and `GATEWAY_PRIVATE_KEY`. The endpoint
   must be **https** - Bazantic refuses a plaintext upstream outright.

2. **Register both gateways as drafts.** The spec is fetched server-side, so it has to be
   publicly reachable; `--auth-type x402-mpp` is the default and the right one for an upstream
   that needs no credential.

   ```bash
   baz gateway add --name "chainlink-price" --status draft --json \
     --spec-url https://<origin>/openapi.chainlink-price.yaml --endpoint https://<origin>/api
   baz gateway add --name "plimsoll-survey" --status draft --json \
     --spec-url https://<origin>/openapi.plimsoll-survey.yaml --endpoint https://<origin>/api
   ```

   Each returns `{ok, id, slug, mcpUrl}`. **Keep the two slugs** - the Recipes bind to them.

3. **Finish in the dashboard** (`/gateways/new` or the gateway's page): confirm no-auth, set the
   per-method prices - `requestSurvey` is the one that costs us money - and activate.

4. **Confirm the tools exist before binding anything.** Never hand-build the URL; read it.

   ```bash
   baz gateway list --json | jq -r '.listings[] | [.slug, .status, .endpointUrl] | @tsv'
   curl -s -X POST -H 'Content-Type: application/json' \
     -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' \
     {endpointUrl}/mcp | sed -n 's/^data: //p' | jq -r '.result.tools[].name'
   ```

   You should see `getPrice`, `deriveLine` on one and `getLadder`, `requestSurvey`, `getMark`,
   `hasStanding` on the other. A wrong path is a free 404; a right one is a free 402 that states
   the price.

5. **Fill the two `REPLACE_ME` fields** in each `recipes/*.recipe.json`: every `gateway_slug`
   (from step 2) and `model` (pick from the list the dashboard's New Recipe drafter offers). The
   sentinels are deliberate - `baz recipe create` fails loudly on them rather than publishing a
   Recipe bound to nothing.

   ```bash
   grep -n REPLACE_ME recipes/*.recipe.json      # must print nothing
   baz recipe create recipes/request_mark.recipe.json --json
   baz recipe create recipes/underwrite_counterparty.recipe.json --json
   ```

   Bazantic derives the handle from `name`; you do not choose it.

6. **Test in the dashboard, then publish.** A dashboard test run uses Bazantic's own credential
   and costs nothing. The CLI has no test command. Publish locks the definition; unpublish to
   edit.

   ```bash
   baz recipe publish <handle> --json
   ```

7. **Run the quality gate** from a bare client:

   ```bash
   baz recipe install --client claude-code     # wires the live catalog + payment into the client
   ```

## The quality gate

From a bare MCP client with only the Recipe and no other context, an agent must complete an
underwriting decision without human intervention - including **refusing on `false`** and **not
probing downward**. Iterate on the `prompt_template` until that holds on 8 of 10 runs.

Budget more time here than feels necessary. Recipe quality is judged directly, and the
downward-probing refusal is the single most interesting thing in the submission: it is the
Recipe defending the privacy property against the agent's own natural curiosity.

## Things that bite

- **Grants settle on Base.** The demo agent's `baz grant create` must be on the network the
  gateways settle on, or every paid call fails after the 402.
- **A failing upstream still costs the caller.** If `/api/survey` returns 502 because the
  registry rate-limited the request, the agent paid for that 502. Price `requestSurvey` with
  that in mind, and keep the rate limit honest.
- **The public Recipe server discovers only.** `tools/call` against `api.bazantic.com/mcp`
  returns *Method not found*; the paid URL comes from `initialize`, and `baz recipe install`
  handles that.
- **Bazantic keeps prompts and test inputs.** Never paste a Hold credential or a private key
  into a Recipe or a test run.
