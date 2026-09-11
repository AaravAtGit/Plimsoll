import {privateKeyToAccount} from "viem/accounts";
import type {Address, Hex} from "viem";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env: ${name}`);
  return v;
}

/// Getters, not values. The API routes are bundled by `next build`, which imports this module
/// while collecting route metadata - resolving required vars eagerly would fail the build on
/// any machine without a populated .env. Reads happen per request instead.
export const env = {
  get rpcUrl() {
    return process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com";
  },
  get registry() {
    return req("PLIMSOLL_REGISTRY") as Address;
  },
  get priceMaxAgeSeconds() {
    return Number(process.env.PRICE_MAX_AGE_SECONDS ?? 3600);
  },
};

/// Lazily resolved: `/api/price` works without a key, so a read-only deployment should not be
/// forced to hold one.
export function gatewayAccount() {
  return privateKeyToAccount(req("GATEWAY_PRIVATE_KEY") as Hex);
}
