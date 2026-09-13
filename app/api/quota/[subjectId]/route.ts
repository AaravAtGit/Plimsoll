import {getQuota} from "@/server/services/survey";
import {bad, isBytes32, json} from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// How many Surveys this gateway may still request about a subject in the current window.
///
/// The limit is scoped to the (subject, requester) pair and it is the privacy mechanism - not
/// the fee. Surfacing it is what lets a caller stop before the registry has to stop them.
export async function GET(_req: Request, {params}: {params: Promise<{subjectId: string}>}) {
  const {subjectId} = await params;
  if (!isBytes32(subjectId)) return bad("subjectId must be bytes32");
  return json(await getQuota(subjectId));
}
