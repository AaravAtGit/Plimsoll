import {timingSafeEqual} from "node:crypto";
import {readHold, UnboundSubject} from "@/server/services/hold";
import {bad, isBytes32, json} from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/// C3: the Hold adapter. The one route in this app that is NOT for agents.
///
/// Its only caller is the Survey enclave. It is deliberately absent from both OpenAPI specs
/// and from the Bazantic gateways: the response is the subject's balance sheet, and the whole
/// product is that no counterparty ever sees it. The enclave presents the shared key the Vault
/// DON released to it; nothing else gets an answer.
export async function GET(req: Request, {params}: {params: Promise<{subjectId: string}>}) {
  if (!authorised(req)) return bad("unauthorised", 401);

  const {subjectId} = await params;
  if (!isBytes32(subjectId)) return bad("subjectId must be bytes32");

  try {
    return json(await readHold(subjectId));
  } catch (e) {
    // Same status for "unknown subject" as for "not bound": whether a subject exists here is
    // itself a fact about it.
    if (e instanceof UnboundSubject) return bad("not found", 404);
    throw e;
  }
}

function authorised(req: Request): boolean {
  const expected = process.env.PLIMSOLL_HOLD_KEY;
  if (!expected) return false;
  const presented = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
