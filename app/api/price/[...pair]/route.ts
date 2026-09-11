import {FEEDS, UnknownPair, getPrice} from "@/server/services/price";
import {joinPair, json} from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, {params}: {params: Promise<{pair: string[]}>}) {
  const {pair} = await params;
  try {
    return json(await getPrice(joinPair(pair)));
  } catch (e) {
    if (e instanceof UnknownPair) return json({error: e.message, pairs: Object.keys(FEEDS)}, 404);
    throw e;
  }
}
