import {hasStanding} from "@/server/services/survey";
import {bad, isBytes32, json} from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, {params}: {params: Promise<{subjectId: string}>}) {
  const {subjectId} = await params;
  if (!isBytes32(subjectId)) return bad("subjectId must be bytes32");

  const q = new URL(req.url).searchParams;
  const thresholdUsd = Number(q.get("thresholdUsd") ?? 0);
  const k = Number(q.get("k") ?? 3);
  const window = Number(q.get("window") ?? 86400);
  if (!Number.isFinite(thresholdUsd) || thresholdUsd <= 0) return bad("thresholdUsd required");

  const threshold = BigInt(Math.round(thresholdUsd * 1e8));
  return json({
    subjectId,
    thresholdUsd,
    k,
    window,
    standing: await hasStanding(subjectId, threshold, k, window),
  });
}
