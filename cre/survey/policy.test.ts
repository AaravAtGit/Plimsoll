import assert from "node:assert/strict";
import {test} from "node:test";
import {
  Indeterminate,
  METRIC_OBSERVED_LIQUID_USD,
  METRIC_OBSERVED_NET_ASSETS_USD,
  USD_SCALE,
  VERDICT_ABOVE,
  VERDICT_BELOW,
  VERDICT_INDETERMINATE,
  asOfOrStale,
  evaluate,
  maskUnpublishable,
  usd1e8,
  valueHold,
  type Hold,
  type Line,
  type Quote,
} from "./policy.ts";
import type {Asset} from "./config.ts";

/// These tests pin the trust model rather than the arithmetic. Each one is a claim Plimsoll
/// makes out loud, and the point is that it is false if the code says otherwise.
///
///   node --test cre/survey/

const ETH: Asset = {symbol: "ETH", pair: "ETH/USD", haircutBps: 9000, liquid: false};
const USDC: Asset = {symbol: "USDC", pair: "USDC/USD", haircutBps: 10_000, liquid: true};
const ASSETS = new Map([
  ["ETH", ETH],
  ["USDC", USDC],
]);

const quote = (pair: string, usd: number, updatedAt = 1_000_000): Quote => ({
  pair,
  price: String(BigInt(Math.round(usd * 1e8))),
  decimals: 8,
  updatedAt,
});

const QUOTES = new Map([
  ["ETH/USD", quote("ETH/USD", 4_500)],
  ["USDC/USD", quote("USDC/USD", 1)],
]);

const hold = (positions: Hold["positions"], liabilities: Hold["liabilities"] = []): Hold => ({
  observedAt: 1_000_000,
  positions,
  liabilities,
});

const line = (threshold: number, publishBelow = true, metricId = METRIC_OBSERVED_NET_ASSETS_USD): Line => ({
  metricId,
  comparator: 0,
  threshold: String(BigInt(threshold) * USD_SCALE),
  publishBelow,
});

test("values a position at Chainlink mid, on the 1e8 grid the Line is expressed in", () => {
  assert.equal(usd1e8("2", quote("ETH/USD", 4_500)), 9_000n * USD_SCALE);
});

test("fractional amounts survive the conversion without a float in sight", () => {
  assert.equal(usd1e8("0.125", quote("ETH/USD", 4_000)), 500n * USD_SCALE);
});

test("the haircut is applied to assets, so oracle mid is not mistaken for collateral", () => {
  // 80 ETH at 4500 is 360k at mid; the 0.90 haircut is what liquidation slippage costs.
  assert.equal(valueHold(hold([{symbol: "ETH", amount: "80"}]), ASSETS, QUOTES, 0), 324_000n * USD_SCALE);
});

test("a liability is NOT haircut - rounding a debt downward would flatter the subject", () => {
  const v = valueHold(
    hold([{symbol: "ETH", amount: "80"}], [{symbol: "ETH", amount: "10"}]),
    ASSETS,
    QUOTES,
    METRIC_OBSERVED_NET_ASSETS_USD,
  );
  // 324k after the haircut, less the full 45k of debt - not 45k * 0.9.
  assert.equal(v, 279_000n * USD_SCALE);
});

test("observed_liquid_usd counts only 1.00-haircut assets, but still carries every liability", () => {
  const h = hold(
    [
      {symbol: "ETH", amount: "80"},
      {symbol: "USDC", amount: "100000"},
    ],
    [{symbol: "ETH", amount: "10"}],
  );
  // The ETH position drops out of the liquid metric. The ETH debt does not: dropping it would
  // flatter the subject twice over.
  assert.equal(valueHold(h, ASSETS, QUOTES, METRIC_OBSERVED_LIQUID_USD), 55_000n * USD_SCALE);
});

test("a position in a non-allowlisted asset is indeterminate, never free", () => {
  assert.throws(
    () => valueHold(hold([{symbol: "DOGE", amount: "1000000"}]), ASSETS, QUOTES, 0),
    Indeterminate,
  );
});

test("the comparator is ordered, so one Mark serves any exposure it covers", () => {
  const v = 274_500n * USD_SCALE;
  assert.equal(evaluate(v, line(250_000)), VERDICT_ABOVE);
  assert.equal(evaluate(v, line(180_000)), VERDICT_ABOVE);
  assert.equal(evaluate(v, line(300_000)), VERDICT_BELOW);
});

test("the boundary is inclusive - a Line reading >= means >=", () => {
  assert.equal(evaluate(250_000n * USD_SCALE, line(250_000)), VERDICT_ABOVE);
  assert.equal(evaluate(250_000n * USD_SCALE - 1n, line(250_000)), VERDICT_BELOW);
});

test("a Line outside the frozen grammar is refused rather than improvised", () => {
  assert.throws(() => evaluate(1n, {...line(1), comparator: 7}), Indeterminate);
  assert.throws(() => evaluate(1n, {...line(1), metricId: 9}), Indeterminate);
});

test("BELOW is masked to INDETERMINATE unless the subject consented to that rung", () => {
  assert.equal(maskUnpublishable(VERDICT_BELOW, line(250_000, false)), VERDICT_INDETERMINATE);
  assert.equal(maskUnpublishable(VERDICT_BELOW, line(250_000, true)), VERDICT_BELOW);
});

test("consent masking never suppresses an ABOVE - it only withholds the upper bound", () => {
  assert.equal(maskUnpublishable(VERDICT_ABOVE, line(250_000, false)), VERDICT_ABOVE);
});

test("D2: a stale feed is indeterminate, and staleness is judged on the oldest input", () => {
  const fresh = quote("ETH/USD", 4_500, 9_000);
  const stale = quote("BTC/USD", 60_000, 1_000);
  assert.equal(asOfOrStale([fresh], 10_000, 3_600), 9_000);
  assert.throws(() => asOfOrStale([fresh, stale], 10_000, 3_600), Indeterminate);
});

test("asOf is clamped to now, because postMark rejects a Mark dated in the future", () => {
  assert.equal(asOfOrStale([quote("ETH/USD", 4_500, 10_050)], 10_000, 3_600), 10_000);
});

test("a levered book clears the 250k rung, and the same book more levered does not", () => {
  // 80 ETH at 4500 is 324k after the 0.90 haircut. The borrow is what decides the verdict,
  // and it is subtracted at full value - which is the whole point of the test above.
  const solvent = valueHold(
    hold([{symbol: "ETH", amount: "80"}], [{symbol: "ETH", amount: "11"}]),
    ASSETS,
    QUOTES,
    0,
  );
  const levered = valueHold(
    hold([{symbol: "ETH", amount: "80"}], [{symbol: "ETH", amount: "45"}]),
    ASSETS,
    QUOTES,
    0,
  );
  assert.equal(evaluate(solvent, line(250_000)), VERDICT_ABOVE);
  assert.equal(evaluate(levered, line(250_000)), VERDICT_BELOW);
});
