import {env} from "@/server/env";
import {json} from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return json({ok: true, registry: env.registry, chainId: 11155111});
}
