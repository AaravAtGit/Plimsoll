import {getLadder} from "@/server/services/survey";
import {bad, isBytes32, json} from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, {params}: {params: Promise<{subjectId: string}>}) {
  const {subjectId} = await params;
  if (!isBytes32(subjectId)) return bad("subjectId must be bytes32");
  return json({subjectId, ladder: await getLadder(subjectId)});
}
