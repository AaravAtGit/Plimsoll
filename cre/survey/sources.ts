import {z} from "zod";
import {Indeterminate, type Hold, type Line, type Quote} from "./policy";

/// The Survey's three reads, expressed against an injected fetcher rather than a runtime.
///
/// That indirection is the whole point of the file. In the confidential build the fetcher is
/// bound to the `TeeRuntime`, so these requests - credential, balance sheet and all - execute
/// from inside the enclave. In the DON build it is bound to node mode. The reads themselves do
/// not know or care, which is why there is exactly one implementation of each.

/// Returns parsed JSON, or throws. Never returns the raw response: a status line or a body
/// fragment in an error message is one more thing that can carry a quantity outward.
export type Fetch = (req: {url: string; method: "GET"; headers?: Record<string, string>}) => unknown;

const ladderSchema = z.object({
  ladder: z.array(
    z.object({
      lineId: z.number().int(),
      metricId: z.number().int(),
      threshold: z.string(),
      publishBelow: z.boolean(),
    }),
  ),
});

const quoteSchema = z.object({
  pair: z.string(),
  price: z.string(),
  decimals: z.number().int(),
  updatedAt: z.number().int(),
});

const holdSchema = z.object({
  observedAt: z.number().int(),
  positions: z.array(z.object({symbol: z.string(), amount: z.string()})),
  liabilities: z.array(z.object({symbol: z.string(), amount: z.string()})),
});

/// The Line the Survey is being asked to test.
///
/// Read over HTTP rather than from the registry, because chain reads execute on Workflow DON
/// nodes and never inside the enclave. Nothing is given away by that: the ladder is public
/// onchain state. The ladder IS the subject's disclosure surface, and it was consented to rung
/// by rung at registration time.
export function readLine(fetch: Fetch, apiBaseUrl: string, subjectId: string, lineId: number): Line {
  const parsed = ladderSchema.safeParse(
    fetch({url: `${apiBaseUrl}/api/ladder/${subjectId}`, method: "GET"}),
  );
  if (!parsed.success) throw new Indeterminate("ladder unreadable");

  const rung = parsed.data.ladder.find((l) => l.lineId === lineId);
  if (!rung) throw new Indeterminate("line not on the subject's ladder");

  // The API reports the frozen grammar's only comparator; `evaluate` re-checks it anyway.
  return {metricId: rung.metricId, comparator: 0, threshold: rung.threshold, publishBelow: rung.publishBelow};
}

/// The Hold. This is the sensitive read - the response is the subject's balance sheet, and in
/// the confidential build it is decrypted and parsed without ever leaving the enclave.
export function readHold(fetch: Fetch, holdBaseUrl: string, subjectId: string, credential: string): Hold {
  const parsed = holdSchema.safeParse(
    fetch({
      url: `${holdBaseUrl}/hold/${subjectId}`,
      method: "GET",
      headers: {Authorization: `Bearer ${credential}`},
    }),
  );
  // Deliberately says nothing about what failed to parse.
  if (!parsed.success) throw new Indeterminate("hold unreadable");
  return parsed.data;
}

/// Chainlink prices, one call per distinct pair.
///
/// D1's decided fallback: the `chainlink-price` service reads `latestRoundData()` on Sepolia and
/// returns it as JSON, so the price authority is still Chainlink and only the transport changed.
/// Swapping in Data Streams means changing this function and nothing else.
export function readPrices(fetch: Fetch, apiBaseUrl: string, pairs: string[]): Map<string, Quote> {
  const quotes = new Map<string, Quote>();
  for (const pair of [...new Set(pairs)].sort()) {
    const parsed = quoteSchema.safeParse(fetch({url: `${apiBaseUrl}/api/price/${pair}`, method: "GET"}));
    if (!parsed.success) throw new Indeterminate("price unreadable");
    quotes.set(parsed.data.pair, parsed.data);
  }
  return quotes;
}
