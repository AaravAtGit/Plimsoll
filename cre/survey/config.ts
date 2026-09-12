import {z} from "zod";

/// The Survey's configuration surface.
///
/// Everything here is public by construction: config travels with the workflow binary, and the
/// binary is revealed to the DON. That is fine - the haircut table and the Line grammar are
/// published anyway, by design. Nothing secret goes in this file; secrets come from the Vault
/// DON at the point of use, inside the enclave.

/// One allowlisted asset. `pair` is resolved against the Chainlink price service, so an asset
/// with no feed simply cannot be valued - and a Survey that cannot value a position returns
/// INDETERMINATE rather than guessing.
export const assetSchema = z.object({
  symbol: z.string(),
  pair: z.string(),
  /// Basis points, 10000 = 1.00. Published in the README's haircut table; changing it changes
  /// `sourceSetId`, which changes `sourceSetHash`, which the registry must re-allowlist.
  haircutBps: z.number().int().min(1).max(10_000),
  /// Carries a 1.00 haircut, and so counts toward `observed_liquid_usd`.
  liquid: z.boolean(),
});

export const configSchema = z.object({
  /// The switch from README section 5.3. `true` registers the Survey with `handlerInTee` and is
  /// what the Chainlink track submission simulates. `false` registers the same handler on the
  /// Workflow DON - a deployment convenience while Confidential Workflows beta access is
  /// pending, and stated as such out loud. The handler is identical either way; only the
  /// transport for the sensitive reads differs.
  confidential: z.boolean(),

  /// Gates every log statement. MUST be false in any submitted config: log output crosses the
  /// enclave boundary, so a log of a balance is a disclosed balance.
  debug: z.boolean(),

  chainSelectorName: z.string(),
  registryAddress: z.string(),

  /// The Plimsoll API. Serves the Line ladder and the Chainlink price quotes. Both are public
  /// data - the ladder is onchain and the prices are oracle mid - so reaching them over HTTP
  /// discloses nothing. It is a necessity rather than a preference: chain reads never execute
  /// inside the enclave, so the TEE cannot read the registry directly.
  apiBaseUrl: z.string(),

  /// The C3 Hold adapter. This one IS sensitive: the response is the subject's balance sheet.
  holdBaseUrl: z.string(),

  /// Vault DON secret ID for the Hold credential. Production templates this per subject
  /// (`CEX_RO_<subjectId>`); staging uses one ID so that `secrets.yaml` can name it.
  holdSecretId: z.string(),

  /// D2, the staleness guard. Testnet feeds go stale constantly, and a Survey that reads a
  /// two-day-old price is worse than one that refuses to answer.
  priceMaxAgeSeconds: z.number().int().positive(),

  /// How long a Mark stays live. Short by design: a Mark is a snapshot, and Standing - an
  /// unbroken run of them - is what a counterparty actually underwrites against.
  markTtlSeconds: z.number().int().positive(),

  /// Preimage of the `sourceSetHash` the registry allowlists. It commits to which sources were
  /// consulted and which haircut table was applied, so a Mark cannot be silently re-based onto
  /// a laxer policy.
  sourceSetId: z.string(),

  /// Which workflow version produced the Mark. You will redeploy mid-build, and old Marks must
  /// stay distinguishable from new ones.
  workflowId: z.string(),

  gasLimit: z.string(),

  assets: z.array(assetSchema).min(1),
});

export type Asset = z.infer<typeof assetSchema>;
export type Config = z.infer<typeof configSchema>;
