import {parseUnits} from "viem";
import type {Asset} from "./config";

/// The private policy: valuation, haircuts, and the threshold comparison.
///
/// Every function here is pure and integer-only. Two reasons, and both are load-bearing:
///
///  1. The enclave result is attested and then verified by DON consensus, so the same inputs
///     must always produce the same output. A float would not guarantee that.
///  2. This is the code that touches the amounts. Keeping it free of I/O is what makes it
///     possible to state, and test, that no quantity escapes: nothing in this file can log,
///     fetch or emit.

/// 1e8 fixed point, matching Chainlink USD feed decimals and `PlimsollTypes.USD_SCALE`.
export const USD_SCALE = 100_000_000n;
const WAD = 1_000_000_000_000_000_000n;
const BPS = 10_000n;

export const VERDICT_INDETERMINATE = 0;
export const VERDICT_ABOVE = 1;
export const VERDICT_BELOW = 2;

export const METRIC_OBSERVED_NET_ASSETS_USD = 0;
export const METRIC_OBSERVED_LIQUID_USD = 1;

export const COMPARATOR_GTE = 0;

export type Quote = {pair: string; price: string; decimals: number; updatedAt: number};
export type Position = {symbol: string; amount: string};
export type Hold = {observedAt: number; positions: Position[]; liabilities: Position[]};
export type Line = {metricId: number; comparator: number; threshold: string; publishBelow: boolean};

/// Raised when the Survey cannot reach a defensible answer. Never carries a quantity: an error
/// string is as much a channel out of the enclave as a log line is.
export class Indeterminate extends Error {}

/// Value one position at 1e8 USD. Integer throughout - `parseUnits` puts the decimal amount on
/// a 1e18 grid and it stays there until the final scaling.
export function usd1e8(amount: string, quote: Quote): bigint {
  const units = parseUnits(amount, 18);
  if (units < 0n) throw new Indeterminate("negative position amount");
  return (units * BigInt(quote.price) * USD_SCALE) / (10n ** BigInt(quote.decimals) * WAD);
}

/// `observed_net_assets_usd`: assets observed at the named sources, after haircuts, minus the
/// liabilities visible at those same sources.
///
/// Deliberately not called net equity. A read-only exchange key sees margin borrow and a wallet
/// read sees no debt at all; neither sees an off-balance-sheet obligation, and the metric name
/// is the clearest possible signal that we know it.
export function valueHold(
  hold: Hold,
  assets: Map<string, Asset>,
  quotes: Map<string, Quote>,
  metricId: number,
): bigint {
  const quoteFor = (symbol: string): {asset: Asset; quote: Quote} => {
    const asset = assets.get(symbol);
    // Not an allowlisted asset. Valuing it at nothing would flatter a subject holding it, and
    // valuing it at a price we do not have would be worse.
    if (!asset) throw new Indeterminate("position in a non-allowlisted asset");
    const quote = quotes.get(asset.pair);
    if (!quote) throw new Indeterminate("no quote for an allowlisted asset");
    return {asset, quote};
  };

  let total = 0n;

  for (const p of hold.positions) {
    const {asset, quote} = quoteFor(p.symbol);
    // `observed_liquid_usd` is the subset of assets carrying a 1.00 haircut.
    if (metricId === METRIC_OBSERVED_LIQUID_USD && !asset.liquid) continue;
    total += (usd1e8(p.amount, quote) * BigInt(asset.haircutBps)) / BPS;
  }

  for (const l of hold.liabilities) {
    const {quote} = quoteFor(l.symbol);
    // No haircut on a liability, and no metric filter either. A haircut shrinks what it is
    // applied to; applying one to a debt would flatter the subject, and dropping an illiquid
    // debt from the liquid metric would flatter it further. Both round the wrong way.
    total -= usd1e8(l.amount, quote);
  }

  return total;
}

/// Apply the Line. The grammar is frozen at two metrics and one comparator; anything else is a
/// Line this workflow version was not built to evaluate, and it says so rather than improvising.
export function evaluate(value: bigint, line: Line): number {
  if (line.comparator !== COMPARATOR_GTE) throw new Indeterminate("unsupported comparator");
  if (line.metricId !== METRIC_OBSERVED_NET_ASSETS_USD && line.metricId !== METRIC_OBSERVED_LIQUID_USD) {
    throw new Indeterminate("unsupported metric");
  }
  return value >= BigInt(line.threshold) ? VERDICT_ABOVE : VERDICT_BELOW;
}

/// Consent masking, applied before the verdict ever reaches the boundary.
///
/// A BELOW leaks an *upper* bound on the subject's holdings, which is the more sensitive
/// direction, so publishing it is opt-in per rung. INDETERMINATE is not a soft no here - it is
/// the honest statement that this Survey produced no publishable answer.
export function maskUnpublishable(verdict: number, line: Line): number {
  return verdict === VERDICT_BELOW && !line.publishBelow ? VERDICT_INDETERMINATE : verdict;
}

/// D2. One stale quote poisons the whole valuation, so the guard is over the oldest of them.
/// Returns the `asOf` the Mark should carry: the valuation is only as current as its stalest input.
export function asOfOrStale(quotes: Quote[], now: number, maxAgeSeconds: number): number {
  if (quotes.length === 0) throw new Indeterminate("no quotes");
  const oldest = quotes.reduce((a, q) => (q.updatedAt < a ? q.updatedAt : a), quotes[0].updatedAt);
  if (now - oldest > maxAgeSeconds) throw new Indeterminate("stale price");
  // `postMark` rejects an asOf in the future, and a feed a few seconds ahead of DON time would
  // trip it. Clamping is safe: it only ever makes the Mark claim to be older than it is.
  return Math.min(oldest, now);
}
