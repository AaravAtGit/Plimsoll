import {FEEDS, UnknownPair, exposureToUsd1e8, getPrice} from "@/server/services/price";
import {getLadder, selectLine} from "@/server/services/survey";
import {bad, isBytes32, joinPair, json} from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// Price plus the Line it implies. One call, so the agent does not have to do fixed-point
/// arithmetic it will get wrong, and so the derivation is auditable in the Recipe transcript.
export async function GET(req: Request, {params}: {params: Promise<{pair: string[]}>}) {
  const {pair} = await params;
  const q = new URL(req.url).searchParams;
  const amount = Number(q.get("amount"));
  const subjectId = q.get("subjectId");

  if (!Number.isFinite(amount) || amount <= 0) return bad("amount required");
  if (!subjectId || !isBytes32(subjectId)) return bad("subjectId must be bytes32");

  try {
    const quote = await getPrice(joinPair(pair));
    const exposure = exposureToUsd1e8(amount, quote);
    const ladder = await getLadder(subjectId);
    const line = selectLine(ladder, exposure);

    return json({
      quote,
      exposureUsd1e8: exposure.toString(),
      exposureUsd: Number(exposure) / 1e8,
      // null means the subject has registered no rung covering this exposure. That is a real
      // answer, not an error: the deal is larger than anything the subject consented to be
      // asked about, and the Recipe must decline rather than ask at a lower rung.
      line,
      ladder,
    });
  } catch (e) {
    if (e instanceof UnknownPair) return json({error: e.message, pairs: Object.keys(FEEDS)}, 404);
    throw e;
  }
}
