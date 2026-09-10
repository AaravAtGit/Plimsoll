import {privateKeyToAccount} from "viem/accounts";
import type {Address, Hex} from "viem";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`missing env: ${name}`);
  return v;
}

export const env = {
  rpcUrl: process.env.SEPOLIA_RPC_URL ?? "https://ethereum-sepolia-rpc.publicnode.com",
  registry: req("PLIMSOLL_REGISTRY") as Address,
  priceMaxAgeSeconds: Number(process.env.PRICE_MAX_AGE_SECONDS ?? 3600),
  port: Number(process.env.PORT ?? 8402),
};

/// Lazily resolved: `/price` works without a key, so a read-only deployment should not be
/// forced to hold one.
export function gatewayAccount() {
  return privateKeyToAccount(req("GATEWAY_PRIVATE_KEY") as Hex);
}
