import {type Address, type Hex, formatEther, isAddress} from "viem";
import {publicClient} from "@/server/chain";

/// C3: the Hold adapter's first source - a wallet read.
///
/// The binding from a subjectId to the wallets behind it is the secret this whole system
/// protects. It lives in server environment only (`PLIMSOLL_HOLD_WALLETS`), it is resolved
/// here, and it never appears in a response: `sources` names the *kind* of source, not the
/// address. A read-only exchange key is the next source to add, and it slots in beside this
/// one without the workflow changing - the JSON shape below is the contract.

export type Hold = {
  subjectId: Hex;
  observedAt: number;
  sources: string[];
  positions: {symbol: string; amount: string}[];
  liabilities: {symbol: string; amount: string}[];
};

export class UnboundSubject extends Error {}

/// `PLIMSOLL_HOLD_WALLETS` is JSON: { "<subjectId>": ["0x...", "0x..."] }.
function walletsFor(subjectId: Hex): Address[] {
  const raw = process.env.PLIMSOLL_HOLD_WALLETS;
  if (!raw) throw new UnboundSubject(subjectId);
  const map = JSON.parse(raw) as Record<string, string[]>;
  const entry = Object.entries(map).find(([k]) => k.toLowerCase() === subjectId.toLowerCase());
  const wallets = entry?.[1]?.filter((w) => isAddress(w)) ?? [];
  if (wallets.length === 0) throw new UnboundSubject(subjectId);
  return wallets as Address[];
}

export async function readHold(subjectId: Hex): Promise<Hold> {
  const wallets = walletsFor(subjectId);
  const balances = await Promise.all(wallets.map((address) => publicClient.getBalance({address})));
  const total = balances.reduce((a, b) => a + b, 0n);

  return {
    subjectId,
    observedAt: Math.floor(Date.now() / 1000),
    // What was consulted, not where. One entry per source kind, never per address.
    sources: ["wallet:ethereum-sepolia"],
    positions: [{symbol: "ETH", amount: formatEther(total)}],
    // A bare wallet read sees no debt. Saying so explicitly is the honest shape; the metric is
    // named observed_net_assets_usd for exactly this reason.
    liabilities: [],
  };
}
