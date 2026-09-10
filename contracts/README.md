# Plimsoll contracts

Foundry workspace for the onchain half of Plimsoll. Two contracts do the work:

- **`PlimsollRegistry.sol`** — subject identities, Line ladders, EIP-712 address bindings,
  Survey requests, and the Marks the CRE workflow writes. `postMark` is gated to the CRE
  Forwarder; without that, anyone posts themselves an `ABOVE`.
- **`CreditDesk.sol`** — the reference consumer. Refuses to disburse without valid Standing,
  and binds the borrowing address to the attested subject.

Nothing in either contract accepts, stores or returns a quantity of anything a subject holds.

## Commands

```bash
forge build
forge test -vv
forge fmt

# deploy
export PRIVATE_KEY=0x...
export SEPOLIA_RPC_URL=https://...
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
```

`via_ir` is on — `hasStanding` overflows the stack without it. Note the consequence for tests:
`vm.warp(block.timestamp + n)` is **unsafe**, because the optimizer reuses a stale `TIMESTAMP`
read across cheatcode boundaries and silently collapses two warps into one. Advance time with
the `_skip()` helper in `test/Base.t.sol`, which reads the clock through `vm.getBlockTimestamp()`.

## Forwarder addresses

From the CRE Forwarder Directory:

| Use | Address |
| --- | --- |
| Ethereum Sepolia, deployed workflows | `0xF8344CFd5c43616a4366C34E3EEE75af79a74482` |
| `cre workflow simulate --broadcast` | `0x15fC6ae953E024d975e77382eEeC56A9101f9F88` |

The forwarder is immutable — a mutable one is a backdoor — so deploy a second registry to switch
between simulation and live. Override with `CRE_FORWARDER`.

## One deliberate deviation from the spec

`hasStanding` does **not** require every Mark in the run to be unexpired, because that is
unsatisfiable: a Mark expires in ~300s while a run must span ~86400s, so no set of Marks could
ever satisfy both conditions at once. Instead it requires the run to span `window` and at least
one qualifying Mark to still be live. Older Marks are historical evidence and are allowed to
have lapsed. See the NatSpec on the function.

## Test coverage

`forge test` — 38 tests. The ones worth reading, because they encode the trust model rather than
the syntax:

| Test | What it pins down |
| --- | --- |
| `test_isAboveLine_isOrderedNotExactMatch` | A Mark cleared at 250k serves a counterparty carrying 180k. Why `Line` is a struct, not a hash. |
| `test_hasStanding_rejectsFlashFundedSingleMark` | One live Mark passes `isAboveLine` and is still not Standing. |
| `test_rateLimit_isScopedToTheSubjectRequesterPair` | The binary-search leak is bounded per requester, without letting one requester starve the others. |
| `test_bindAddress_rejectsSubjectOwnerClaimingAnAddressItDoesNotHold` | A subject cannot bind an address it has no key for. |
| `test_borrow_underwritesCumulativeExposure` | One Mark at 250k does not fund an unbounded number of 250k draws. |
| `test_relaxedTerms_acceptWhatStrictTermsRefuse` | Standing is lender policy, and a lender is free to choose a bad one. |
