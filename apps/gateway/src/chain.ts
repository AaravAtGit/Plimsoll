import {createPublicClient, createWalletClient, http} from "viem";
import {sepolia} from "viem/chains";
import {env, gatewayAccount} from "./env.js";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(env.rpcUrl),
});

export function walletClient() {
  return createWalletClient({
    account: gatewayAccount(),
    chain: sepolia,
    transport: http(env.rpcUrl),
  });
}
