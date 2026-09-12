import {
  ConsensusAggregationByFields,
  EVMClient,
  HTTPClient,
  TxStatus,
  bytesToHex,
  getNetwork,
  handler,
  handlerInTee,
  identical,
  json as jsonBody,
  logTriggerConfig,
  median,
  ok,
  prepareReportRequest,
  type EVMLog,
  type NodeRuntime,
  type Runtime,
  type TeeRuntime,
} from "@chainlink/cre-sdk";
import {
  decodeEventLog,
  encodeAbiParameters,
  keccak256,
  parseAbiItem,
  parseAbiParameters,
  toEventSelector,
  toHex,
  type Address,
  type Hex,
} from "viem";
import {type Config, configSchema} from "./config";
import {
  Indeterminate,
  VERDICT_INDETERMINATE,
  asOfOrStale,
  evaluate,
  maskUnpublishable,
  valueHold,
} from "./policy";
import {type Fetch, readHold, readLine, readPrices} from "./sources";

/// The Survey. One confidential workflow execution: read a subject's private Hold, value it at
/// Chainlink prices after published haircuts, test it against one Line, and emit a boolean.
///
/// Read README section 5 before changing anything in this file. The confidentiality boundary is
/// narrower than it looks, and two rules in particular are not stylistic:
///
///   - Nothing is logged unless `config.debug` is set, and `debug` is false in every submitted
///     config. Log output crosses the boundary; a logged balance is a disclosed balance.
///   - The payload handed to `usingTheDons()` is the entire privacy claim. It carries a verdict
///     and provenance. No balance, no per-asset amount, no price, no margin, no ratio, no
///     headroom. If you ever want to add `netAssets` so the dashboard can draw a progress bar,
///     that is the product you would be deleting.

const surveyRequested = parseAbiItem(
  "event SurveyRequested(bytes32 indexed surveyId, bytes32 indexed subjectId, uint16 lineId, address indexed requester, uint64 requestedAt)",
);

type SurveyRequest = {surveyId: Hex; subjectId: Hex; lineId: number};

/// What the enclave is allowed to hand back. Two scalars and nothing else - the type is the
/// audit. Widening it is how this protocol would leak.
type Outcome = {verdict: number; asOf: number};

/// The trigger payload arrives as protobuf bytes, not hex strings.
function decodeRequest(event: EVMLog): SurveyRequest {
  const decoded = decodeEventLog({
    abi: [surveyRequested],
    topics: event.topics.map((t) => bytesToHex(t)) as [Hex, ...Hex[]],
    data: bytesToHex(event.data),
  });
  const {surveyId, subjectId, lineId} = decoded.args;
  return {surveyId, subjectId, lineId: Number(lineId)};
}

/// Bind a fetcher to the enclave. Requests issued through this execute from inside the TEE, so
/// the Hold credential and the balance sheet it unlocks never reach a node operator.
const enclaveFetch =
  (runtime: TeeRuntime<Config>): Fetch =>
  (req) => {
    const response = new HTTPClient()
      .sendRequest(runtime, {
        url: req.url,
        method: req.method,
        multiHeaders: req.headers
          ? Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, {values: [v]}]))
          : undefined,
      })
      .result();
    // The status code is not in the message on purpose: an upstream that encodes anything about
    // the Hold in its status line would otherwise have a channel out of the enclave.
    if (!ok(response)) throw new Indeterminate("upstream request failed");
    return jsonBody(response);
  };

const nodeFetch =
  (runtime: NodeRuntime<Config>): Fetch =>
  (req) => {
    const response = new HTTPClient()
      .sendRequest(runtime, {
        url: req.url,
        method: req.method,
        multiHeaders: req.headers
          ? Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, {values: [v]}]))
          : undefined,
      })
      .result();
    if (!ok(response)) throw new Indeterminate("upstream request failed");
    return jsonBody(response);
  };

/// The assessment. Pure policy over injected I/O, so the confidential and DON builds run the
/// same decision and differ only in where the reads happen.
function assess(
  fetch: Fetch,
  config: Config,
  request: SurveyRequest,
  credential: string,
  now: number,
): Outcome {
  const line = readLine(fetch, config.apiBaseUrl, request.subjectId, request.lineId);
  const hold = readHold(fetch, config.holdBaseUrl, request.subjectId, credential);

  const assets = new Map(config.assets.map((a) => [a.symbol, a]));
  const symbols = [...hold.positions, ...hold.liabilities].map((p) => p.symbol);
  const pairs = symbols.map((s) => {
    const asset = assets.get(s);
    if (!asset) throw new Indeterminate("position in a non-allowlisted asset");
    return asset.pair;
  });

  const quotes = readPrices(fetch, config.apiBaseUrl, pairs);
  const asOf = asOfOrStale([...quotes.values()], now, config.priceMaxAgeSeconds);

  // The amounts exist only across these two lines, and only inside this frame.
  const value = valueHold(hold, assets, quotes, line.metricId);
  const verdict = maskUnpublishable(evaluate(value, line), line);

  return {verdict, asOf};
}

/// Run the assessment on the Workflow DON instead of in an enclave.
///
/// This is the `confidential: false` branch, and it is a deployment convenience while beta
/// access is pending - not the product. Note what it costs: node mode has no access to secrets,
/// so the Hold credential must be read in DON mode and passed in, which puts it in node memory.
/// That is precisely the exposure `handlerInTee` exists to remove.
///
/// Consensus is taken over the conclusion rather than the inputs - nodes agree on the verdict,
/// and the median settles the small clock spread in `asOf`. Reporting a value here and
/// aggregating that instead would put the amounts in front of every node operator.
function assessOnTheDon(runtime: Runtime<Config>, request: SurveyRequest): Outcome {
  const credential = runtime.getSecret({id: runtime.config.holdSecretId}).result().value;
  const now = Math.floor(runtime.now().getTime() / 1000);

  const perNode = (nodeRuntime: NodeRuntime<Config>, cred: string): Outcome =>
    assess(nodeFetch(nodeRuntime), nodeRuntime.config, request, cred, now);

  return runtime
    .runInNodeMode(
      perNode,
      ConsensusAggregationByFields<Outcome>({verdict: identical, asOf: median}),
    )(credential)
    .result();
}

function assessInEnclave(runtime: TeeRuntime<Config>, request: SurveyRequest): Outcome {
  const credential = runtime.getSecret({id: runtime.config.holdSecretId}).result().value;
  const now = Math.floor(runtime.now().getTime() / 1000);
  return assess(enclaveFetch(runtime), runtime.config, request, credential, now);
}

const inEnclave = (runtime: Runtime<Config> | TeeRuntime<Config>): runtime is TeeRuntime<Config> =>
  typeof (runtime as TeeRuntime<Config>).usingTheDons === "function";

export const survey = (
  runtime: Runtime<Config> | TeeRuntime<Config>,
  event: EVMLog,
): string => {
  const config = runtime.config;
  const request = decodeRequest(event);

  if (config.debug) runtime.log(`survey ${request.surveyId} line ${request.lineId}`);

  let outcome: Outcome;
  try {
    outcome = inEnclave(runtime) ? assessInEnclave(runtime, request) : assessOnTheDon(runtime, request);
  } catch (e) {
    // Every failure lands here as INDETERMINATE, and the reason is deliberately not carried
    // onward. A source was down, a price was stale, an asset was not allowlisted - all of it is
    // information about the Hold, and none of it is the counterparty's to have. INDETERMINATE
    // is not a soft yes; the registry's consumers are required to treat it as no.
    if (!(e instanceof Indeterminate)) throw e;
    if (config.debug) runtime.log(`indeterminate: ${e.message}`);
    outcome = {verdict: VERDICT_INDETERMINATE, asOf: Math.floor(runtime.now().getTime() / 1000)};
  }

  // ---- the one-way door ----------------------------------------------------------------
  // Everything below this line executes on Workflow DON nodes.
  const donRuntime = inEnclave(runtime) ? runtime.usingTheDons() : runtime;

  const expiry = Math.floor(donRuntime.now().getTime() / 1000) + config.markTtlSeconds;

  // Audited as a single struct, once. Six fields, all of them verdict or provenance.
  //
  // `subjectId` and `lineId` are absent because the registry already holds them against the
  // surveyId it minted. Re-crossing them would add nothing and widen the payload.
  const encodedPayload = encodeAbiParameters(
    parseAbiParameters(
      "bytes32 surveyId, uint8 verdict, uint64 asOf, uint64 expiry, bytes32 sourceSetHash, bytes32 workflowId",
    ),
    [
      request.surveyId,
      outcome.verdict,
      BigInt(outcome.asOf),
      BigInt(expiry),
      keccak256(toHex(config.sourceSetId)),
      keccak256(toHex(config.workflowId)),
    ],
  );

  const signedReport = donRuntime.report(prepareReportRequest(encodedPayload)).result();

  const network = getNetwork({chainFamily: "evm", chainSelectorName: config.chainSelectorName});
  if (!network) throw new Error(`unknown chain selector name: ${config.chainSelectorName}`);

  const txResult = new EVMClient(network.chainSelector.selector)
    .writeReport(donRuntime, {
      receiver: config.registryAddress as Address,
      report: signedReport,
      gasConfig: {gasLimit: config.gasLimit},
    })
    .result();

  if (txResult.txStatus !== TxStatus.SUCCESS) {
    throw new Error(`postMark failed: ${txResult.errorMessage || txResult.txStatus}`);
  }

  return bytesToHex(txResult.txHash ?? new Uint8Array(32));
};

export {configSchema};

export const initWorkflow = (config: Config) => {
  const network = getNetwork({chainFamily: "evm", chainSelectorName: config.chainSelectorName});
  if (!network) throw new Error(`unknown chain selector name: ${config.chainSelectorName}`);

  // Filter on the registry address and the SurveyRequested topic. FINALIZED so that a reorg
  // cannot make the workflow post a Mark against a Survey that no longer exists.
  const trigger = new EVMClient(network.chainSelector.selector).logTrigger(
    logTriggerConfig({
      addresses: [config.registryAddress as Hex],
      topics: [[toEventSelector(surveyRequested)]],
      confidence: "FINALIZED",
    }),
  );

  // One implementation, two registration modes. The handler above does not branch on this -
  // it discovers where it is running from the runtime it was handed.
  return config.confidential
    ? [handlerInTee(trigger, survey, [{tee: "nitro", regions: ["us-west-2"]}])]
    : [handler(trigger, survey)];
};
