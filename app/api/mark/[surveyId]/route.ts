import {UnknownSurvey, getMark} from "@/server/services/survey";
import {bad, isBytes32, json} from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, {params}: {params: Promise<{surveyId: string}>}) {
  const {surveyId} = await params;
  if (!isBytes32(surveyId)) return bad("surveyId must be bytes32");

  try {
    const mark = await getMark(surveyId);
    if (!mark) return json({surveyId, status: "pending"}, 202);
    return json({status: "settled", mark});
  } catch (e) {
    if (e instanceof UnknownSurvey) return bad(e.message, 404);
    throw e;
  }
}
