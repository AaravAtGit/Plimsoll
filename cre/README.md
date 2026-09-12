# The Survey workflow

**C2.** A Chainlink CRE Confidential Workflow. It reads a subject's private Hold inside an AWS
Nitro enclave, values it at Chainlink prices after published haircuts, tests it against one
Line, and emits a boolean that lands onchain as a Mark.

Read [§5 of the root README](../README.md) before changing anything here. The confidentiality
boundary is narrower than it looks, and the rules that follow from it are not stylistic.

```
cre/
├── project.yaml          chain selector + RPC for the trigger and the write
├── secrets.yaml          PLIMSOLL_HOLD_KEY -> env var. Never the value.
└── survey/
    ├── config.ts         the config schema. Public by construction.
    ├── policy.ts         haircuts, valuation, the threshold. Pure, integer-only.
    ├── sources.ts        the three reads, against an injected fetcher
    ├── workflow.ts       the handler, and the handlerInTee / handler switch
    └── policy.test.ts    14 tests over the trust model
```

## Running it

The workflow needs the `cre` CLI and Bun; the policy tests need neither.

```bash
pnpm cre:test                    # 14 tests, plain node, no CRE toolchain

# simulation
cd cre/survey && bun install && bunx cre-setup && cd ../..
cp cre/.env.example cre/.env     # fill in PLIMSOLL_HOLD_KEY_VAR
pnpm dev                         # :5199 - serves /api/ladder and /api/price

cd cre && cre workflow simulate ./survey \
  --target staging-settings \
  --non-interactive \
  --trigger-index 0 \
  --evm-tx-hash 0x<the requestSurvey tx>
```

Set `registryAddress` in `config.staging.json` to the deployed registry first. `sourceSetId`
must hash to a source set the registry has allowlisted — `Deploy.s.sol` allowlists
`keccak256("plimsoll-sources-v1")` by default, which is what both configs ship with. Change the
haircut table or the sources and you must bump this string on both sides, or every Mark reverts
with `SourceSetNotAllowed`.

Add `--broadcast` to land a real Mark on Sepolia. That path writes through the
`MockKeystoneForwarder`, so the registry must have been deployed with that forwarder address:
see the table in [`../contracts/README.md`](../contracts/README.md).

## The two modes

`confidential: true` registers the Survey with `handlerInTee` and is what the Chainlink track
submission simulates. `confidential: false` registers the same handler on the Workflow DON, as a
deployment convenience while Confidential Workflows beta access is pending. Say so out loud in
the video; the distinction disappears the moment access lands.

The handler does not branch on the flag. It discovers where it is running from the runtime it
was handed, so there is exactly one implementation of the decision.

What the DON mode costs, stated plainly: node mode has no access to secrets, so the Hold
credential is read in DON mode and passed in — which puts it in node memory. That is precisely
the exposure `handlerInTee` exists to remove, and it is why the confidential path is the product.

## The rules this code is built around

**Nothing is logged unless `config.debug` is set, and `debug` is false in both shipped configs.**
Log output crosses the boundary. A logged balance is a disclosed balance.

**Chain reads never happen inside the enclave.** So the Line ladder and the prices arrive over
HTTP from the Plimsoll API rather than through `evm.Client`. Neither is a concession: the ladder
is public onchain state and the prices are oracle mid. The Hold is the only sensitive read, and
it is the one that never leaves.

**The payload handed to `usingTheDons()` is the entire privacy claim.** It is six fields:

```
bytes32 surveyId, uint8 verdict, uint64 asOf, uint64 expiry, bytes32 sourceSetHash, bytes32 workflowId
```

No balance, no per-asset amount, no price, no margin, no ratio, no headroom. Not even the failure
reason — every `Indeterminate` collapses to the same verdict, because *why* a Survey could not
answer is itself information about the Hold. `subjectId` and `lineId` are absent because the
registry already holds them against the `surveyId` it minted.

If you ever want to add `netAssets` so the dashboard can draw a progress bar — that is the
product you would be deleting.

## What the tests pin down

`pnpm cre:test`. The ones worth reading, because they encode the trust model rather than the
arithmetic:

| Test | What it pins down |
| --- | --- |
| `a liability is NOT haircut` | A haircut shrinks what it touches. Applied to a debt it would flatter the subject — the one direction this protocol must never round. |
| `observed_liquid_usd counts only 1.00-haircut assets, but still carries every liability` | Dropping an illiquid debt from the liquid metric would flatter it twice over. |
| `a position in a non-allowlisted asset is indeterminate, never free` | Valuing an unpriceable position at zero is a silent gift to whoever holds one. |
| `BELOW is masked to INDETERMINATE unless the subject consented to that rung` | A BELOW leaks an *upper* bound, the more sensitive direction. Opt-in per rung, and masked before the verdict reaches the boundary. |
| `the comparator is ordered, so one Mark serves any exposure it covers` | Why `Line` is a struct and not a hash. |
| `D2: a stale feed is indeterminate` | Testnet feeds go stale constantly, and staleness is judged on the *oldest* input. |

## Known gaps

- **Nothing here has been compiled or simulated.** The `cre` CLI and Bun are not installed on
  this machine, so `policy.ts` is verified by unit test and the rest is verified by reading. The
  first `cre workflow simulate` is the real test; expect to correct SDK details in `workflow.ts`,
  most likely the EVM log payload field names and the DON-mode consensus aggregators.
- **Only ETH and BTC are allowlisted**, because `FEEDS` in `src/server/services/price.ts` knows
  only those two pairs. A stablecoin leg needs its Sepolia feed added there first — until then a
  Hold holding USDC returns INDETERMINATE, which is the honest failure but a poor demo.
- **There is no Hold adapter yet.** `holdBaseUrl` points at `/api/hold`, which does not exist
  until C3 is built, so every Survey currently ends INDETERMINATE. That is the honest failure,
  not a broken workflow. The JSON shape in `sources.ts` is the contract C3 must serve.
- **`holdSecretId` is one ID, not one per subject.** Production templates it as
  `CEX_RO_<subjectId>`; staging uses a single ID so `secrets.yaml` can name it.
