import {requestSurvey} from "@/server/services/survey";
import {bad, isBytes32, json} from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {subjectId?: string; lineId?: number};

export async function POST(req: Request) {
  const {subjectId, lineId}: Body = await req.json().catch(() => ({}) as Body);

  if (!subjectId || !isBytes32(subjectId)) return bad("subjectId must be bytes32");
  if (typeof lineId !== "number" || lineId < 0) return bad("lineId required");

  try {
    const {surveyId, txHash} = await requestSurvey(subjectId, lineId);
    return json(
      {
        surveyId,
        txHash,
        explorer: `https://sepolia.etherscan.io/tx/${txHash}`,
        // The Survey runs asynchronously: the EVM log trigger fires, the enclave executes, the
        // DON reaches consensus, and only then does a Mark land. Poll.
        //
        // The path is relative to the API root, not the origin: through the Bazantic gateway
        // an agent sees `{endpointUrl}/mark/...`, and `endpointUrl` already ends in `/api`.
        poll: `/mark/${surveyId}`,
        pollAfterSeconds: 10,
        giveUpAfterSeconds: 120,
      },
      202,
    );
  } catch (e) {
    return bad((e as Error).message, 502);
  }
}
