import {serve} from "@hono/node-server";
import {Hono} from "hono";
import type {Hex} from "viem";
import {env} from "./env.js";
import {FEEDS, UnknownPair, exposureToUsd1e8, getPrice} from "./services/price.js";
import {
  UnknownSurvey,
  getLadder,
  getMark,
  hasStanding,
  requestSurvey,
  selectLine,
} from "./services/survey.js";

/// The Plimsoll HTTP surface.
///
/// Payment is NOT handled here. Bazantic wraps this API in the x402/MPP gateway, serves the MCP
/// server, and enforces the paywall - so this service stays a plain, testable HTTP API and there
/// is exactly one place where payment logic lives. Do not add an x402 middleware here without a
/// reason; two paywalls is one more than the number of paywalls that can be correct.

const app = new Hono();

const isBytes32 = (s: string): s is Hex => /^0x[0-9a-fA-F]{64}$/.test(s);

app.get("/health", (c) => c.json({ok: true, registry: env.registry, chainId: 11155111}));

// ---------------------------------------------------------------- service 1: chainlink-price

app.get("/price/:pair{.+}", async (c) => {
  try {
    return c.json(await getPrice(c.req.param("pair")));
  } catch (e) {
    if (e instanceof UnknownPair) return c.json({error: e.message, pairs: Object.keys(FEEDS)}, 404);
    throw e;
  }
});

/// Price plus the Line it implies. One call, so the agent does not have to do fixed-point
/// arithmetic it will get wrong, and so the derivation is auditable in the Recipe transcript.
app.get("/line-for/:pair{.+}", async (c) => {
  const amount = Number(c.req.query("amount"));
  const subjectId = c.req.query("subjectId");
  if (!Number.isFinite(amount) || amount <= 0) return c.json({error: "amount required"}, 400);
  if (!subjectId || !isBytes32(subjectId)) return c.json({error: "subjectId must be bytes32"}, 400);

  try {
    const quote = await getPrice(c.req.param("pair"));
    const exposure = exposureToUsd1e8(amount, quote);
    const ladder = await getLadder(subjectId);
    const line = selectLine(ladder, exposure);

    return c.json({
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
    if (e instanceof UnknownPair) return c.json({error: e.message, pairs: Object.keys(FEEDS)}, 404);
    throw e;
  }
});

// ---------------------------------------------------------------- service 2: plimsoll-survey

app.get("/ladder/:subjectId", async (c) => {
  const subjectId = c.req.param("subjectId");
  if (!isBytes32(subjectId)) return c.json({error: "subjectId must be bytes32"}, 400);
  return c.json({subjectId, ladder: await getLadder(subjectId)});
});

app.post("/survey", async (c) => {
  type Body = {subjectId?: string; lineId?: number};
  const body: Body = await c.req.json<Body>().catch(() => ({}) as Body);
  const {subjectId, lineId} = body;

  if (!subjectId || !isBytes32(subjectId)) return c.json({error: "subjectId must be bytes32"}, 400);
  if (typeof lineId !== "number" || lineId < 0) return c.json({error: "lineId required"}, 400);

  try {
    const {surveyId, txHash} = await requestSurvey(subjectId, lineId);
    return c.json({
      surveyId,
      txHash,
      explorer: `https://sepolia.etherscan.io/tx/${txHash}`,
      // The Survey runs asynchronously: the EVM log trigger fires, the enclave executes, the
      // DON reaches consensus, and only then does a Mark land. Poll.
      poll: `/mark/${surveyId}`,
      pollAfterSeconds: 15,
    }, 202);
  } catch (e) {
    return c.json({error: (e as Error).message}, 502);
  }
});

app.get("/mark/:surveyId", async (c) => {
  const surveyId = c.req.param("surveyId");
  if (!isBytes32(surveyId)) return c.json({error: "surveyId must be bytes32"}, 400);

  try {
    const mark = await getMark(surveyId);
    if (!mark) return c.json({surveyId, status: "pending"}, 202);
    return c.json({status: "settled", mark});
  } catch (e) {
    if (e instanceof UnknownSurvey) return c.json({error: e.message}, 404);
    throw e;
  }
});

app.get("/standing/:subjectId", async (c) => {
  const subjectId = c.req.param("subjectId");
  if (!isBytes32(subjectId)) return c.json({error: "subjectId must be bytes32"}, 400);

  const thresholdUsd = Number(c.req.query("thresholdUsd") ?? 0);
  const k = Number(c.req.query("k") ?? 3);
  const window = Number(c.req.query("window") ?? 86400);
  if (!Number.isFinite(thresholdUsd) || thresholdUsd <= 0) {
    return c.json({error: "thresholdUsd required"}, 400);
  }

  const threshold = BigInt(Math.round(thresholdUsd * 1e8));
  return c.json({
    subjectId,
    thresholdUsd,
    k,
    window,
    standing: await hasStanding(subjectId, threshold, k, window),
  });
});

serve({fetch: app.fetch, port: env.port}, (info) => {
  console.log(`plimsoll gateway  :${info.port}  registry=${env.registry}`);
});

export default app;
