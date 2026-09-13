import {listMarks} from "@/server/services/survey";
import {bad, isBytes32, json} from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// Every Mark ever posted about a subject, newest first. Read straight from the registry; the
/// dashboard's history and Standing view are drawn from this and nothing else.
export async function GET(_req: Request, {params}: {params: Promise<{subjectId: string}>}) {
  const {subjectId} = await params;
  if (!isBytes32(subjectId)) return bad("subjectId must be bytes32");
  return json({subjectId, marks: await listMarks(subjectId)});
}
