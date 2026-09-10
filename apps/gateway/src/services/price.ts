import {type Address, parseAbi} from "viem";
import {publicClient} from "../chain.js";
import {env} from "../env.js";

/// Bazantic service 1: `chainlink-price`.
///
/// Two jobs, one implementation. It is the agent-visible step that derives the Line - the thing
/// that makes the composed Recipe a genuine two-service flow rather than one service with a
/// wrapper. And it is the fallback price transport for the Survey enclave, which cannot read
/// chain state directly: chain reads run on Workflow DON nodes, never inside the TEE, so the
/// enclave reaches prices over HTTP or not at all.

const aggregatorV3 = parseAbi([
  "function decimals() view returns (uint8)",
  "function description() view returns (string)",
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
]);

/// Chainlink Data Feed proxies on Ethereum Sepolia.
export const FEEDS: Record<string, Address> = {
  "ETH/USD": "0x694AA1769357215DE4FAC081bf1f309aDC325306",
  "BTC/USD": "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
};

export type PriceQuote = {
  pair: string;
  price: string;
  decimals: number;
  roundId: string;
  updatedAt: number;
  ageSeconds: number;
  stale: boolean;
  feed: Address;
  chainId: number;
};

export async function getPrice(pair: string): Promise<PriceQuote> {
  const feed = FEEDS[pair.toUpperCase()];
  if (!feed) throw new UnknownPair(pair);

  const [decimals, round] = await Promise.all([
    publicClient.readContract({address: feed, abi: aggregatorV3, functionName: "decimals"}),
    publicClient.readContract({address: feed, abi: aggregatorV3, functionName: "latestRoundData"}),
  ]);

  const [roundId, answer, , updatedAt] = round;
  const ageSeconds = Math.floor(Date.now() / 1000) - Number(updatedAt);

  return {
    pair: pair.toUpperCase(),
    price: answer.toString(),
    decimals,
    roundId: roundId.toString(),
    updatedAt: Number(updatedAt),
    ageSeconds,
    // Surfaced rather than thrown on. A caller sizing a credit line needs to see that the
    // number is old and decide; silently serving it is how a demo dies on camera.
    stale: ageSeconds > env.priceMaxAgeSeconds,
    feed,
    chainId: 11155111,
  };
}

/// Convert an exposure denominated in an asset into a USD threshold at 1e8 fixed point -
/// the scale `PlimsollTypes.Line.threshold` is expressed in.
export function exposureToUsd1e8(amount: number, quote: PriceQuote): bigint {
  const price = BigInt(quote.price);
  const scaled = BigInt(Math.round(amount * 1e8));
  return (scaled * price) / 10n ** BigInt(quote.decimals);
}

export class UnknownPair extends Error {
  constructor(pair: string) {
    super(`unknown pair: ${pair}. known: ${Object.keys(FEEDS).join(", ")}`);
  }
}
