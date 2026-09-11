import type {Hex} from "viem";

/// Shared helpers for the API route handlers.
///
/// These endpoints are the HTTP surface Bazantic fronts with the x402/MPP paywall. Payment is
/// NOT handled here, deliberately: the paywall lives in exactly one place, and this stays a
/// plain, testable API. Do not add payment middleware to these routes.

export const isBytes32 = (s: string): s is Hex => /^0x[0-9a-fA-F]{64}$/.test(s);

export const json = (body: unknown, status = 200) => Response.json(body, {status});

export const bad = (error: string, status = 400) => Response.json({error}, {status});

/// Catch-all segments arrive split on "/" - pairs like `ETH/USD` need rejoining.
export const joinPair = (pair: string[]) => pair.join("/");
