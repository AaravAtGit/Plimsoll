import {type Address, type Hex, decodeEventLog} from "viem";
import {publicClient, walletClient} from "../chain.js";
import {env} from "../env.js";
import {plimsollRegistryAbi} from "../abi/plimsollRegistry.js";

/// Bazantic service 2: `plimsoll-survey`.
///
/// The gateway is deliberately thin. It settles payment, sends ONE transaction, and hands back
/// a `surveyId`. It does not talk to the workflow: `requestSurvey` emits `SurveyRequested`, a
/// CRE EVM Log trigger picks that up, and the Survey runs. The request is public; only the Hold
/// is secret, so the trigger belongs on the DON.
///
/// The two-transaction trail this produces - request tx, then Mark tx - is also far more legible
/// on a demo screen than an opaque HTTP call would be.

export const VERDICT = ["INDETERMINATE", "ABOVE", "BELOW"] as const;
export type Verdict = (typeof VERDICT)[number];

export type Line = {
  lineId: number;
  metricId: number;
  metric: string;
  comparator: string;
  threshold: string;
  thresholdUsd: number;
  publishBelow: boolean;
};

export type Mark = {
  surveyId: Hex;
  subjectId: Hex;
  lineId: number;
  verdict: Verdict;
  asOf: number;
  expiry: number;
  expired: boolean;
  sourceSetHash: Hex;
  workflowId: Hex;
};

const METRICS = ["observed_net_assets_usd", "observed_liquid_usd"] as const;

export async function getLadder(subjectId: Hex): Promise<Line[]> {
  const lines = await publicClient.readContract({
    address: env.registry,
    abi: plimsollRegistryAbi,
    functionName: "ladderOf",
    args: [subjectId],
  });

  return lines.map((l, i) => ({
    lineId: i,
    metricId: l.metricId,
    metric: METRICS[l.metricId] ?? `unknown(${l.metricId})`,
    comparator: ">=",
    threshold: l.threshold.toString(),
    thresholdUsd: Number(l.threshold) / 1e8,
    publishBelow: l.publishBelow,
  }));
}

/// Pick the lowest registered rung that still covers `exposureUsd1e8`.
///
/// Rounding UP is the privacy-preserving direction. Rounding down would ask a question the
/// subject's holdings might clear while the actual exposure does not - and repeatedly asking
/// at ever-lower rungs is precisely the binary-search leak the ladder exists to bound.
export function selectLine(ladder: Line[], exposureUsd1e8: bigint, metricId = 0): Line | null {
  const candidates = ladder
    .filter((l) => l.metricId === metricId && BigInt(l.threshold) >= exposureUsd1e8)
    .sort((a, b) => (BigInt(a.threshold) < BigInt(b.threshold) ? -1 : 1));
  return candidates[0] ?? null;
}

/// Submit the Survey request. Call this only after payment has settled.
export async function requestSurvey(
  subjectId: Hex,
  lineId: number,
): Promise<{surveyId: Hex; txHash: Hex}> {
  const wallet = walletClient();

  const {request} = await publicClient.simulateContract({
    account: wallet.account,
    address: env.registry,
    abi: plimsollRegistryAbi,
    functionName: "requestSurvey",
    args: [subjectId, lineId],
  });

  const txHash = await wallet.writeContract(request);
  const receipt = await publicClient.waitForTransactionReceipt({hash: txHash});

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== (env.registry as string).toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: plimsollRegistryAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "SurveyRequested") {
        return {surveyId: decoded.args.surveyId, txHash};
      }
    } catch {
      // not our event; the receipt may carry logs from other contracts
    }
  }
  throw new Error(`SurveyRequested not found in tx ${txHash}`);
}

/// Poll target. Returns null while the Survey is still running.
export async function getMark(surveyId: Hex): Promise<Mark | null> {
  const survey = await publicClient.readContract({
    address: env.registry,
    abi: plimsollRegistryAbi,
    functionName: "surveyOf",
    args: [surveyId],
  });

  if (survey.subjectId === ZERO32) throw new UnknownSurvey(surveyId);
  if (!survey.fulfilled) return null;

  const count = await publicClient.readContract({
    address: env.registry,
    abi: plimsollRegistryAbi,
    functionName: "markCount",
    args: [survey.subjectId],
  });

  // Walk backwards: the Mark for a just-fulfilled Survey is almost always the last one.
  for (let i = Number(count) - 1; i >= 0; i--) {
    const m = await publicClient.readContract({
      address: env.registry,
      abi: plimsollRegistryAbi,
      functionName: "markAt",
      args: [survey.subjectId, BigInt(i)],
    });
    if (m.surveyId !== surveyId) continue;
    return {
      surveyId: m.surveyId,
      subjectId: m.subjectId,
      lineId: m.lineId,
      verdict: VERDICT[m.verdict] ?? "INDETERMINATE",
      asOf: Number(m.asOf),
      expiry: Number(m.expiry),
      expired: Number(m.expiry) <= Math.floor(Date.now() / 1000),
      sourceSetHash: m.sourceSetHash,
      workflowId: m.workflowId,
    };
  }
  return null;
}

export async function hasStanding(
  subjectId: Hex,
  thresholdUsd1e8: bigint,
  k: number,
  window: number,
  metricId = 0,
): Promise<boolean> {
  return publicClient.readContract({
    address: env.registry,
    abi: plimsollRegistryAbi,
    functionName: "hasStanding",
    args: [subjectId, metricId, thresholdUsd1e8, k, BigInt(window)],
  });
}

const ZERO32 = "0x0000000000000000000000000000000000000000000000000000000000000000";

export class UnknownSurvey extends Error {
  constructor(id: Hex) {
    super(`unknown surveyId: ${id}`);
  }
}
