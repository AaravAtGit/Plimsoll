// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PlimsollTypes
/// @notice Shared structs and enumerations for the Plimsoll protocol.
/// @dev Nothing in this file is a quantity of anything the subject holds. A Mark carries a
///      verdict and provenance; it never carries a balance, a price, a ratio or a headroom.
library PlimsollTypes {
    // ---------------------------------------------------------------- verdicts

    /// @dev The Survey could not reach a defensible answer: a source was down, a price was
    ///      stale, or the subject withheld consent for a BELOW result on this Line. It is not
    ///      a soft yes. Consumers MUST treat it as no.
    uint8 internal constant VERDICT_INDETERMINATE = 0;
    /// @dev Observed holdings satisfied the Line at `asOf`, after published haircuts.
    uint8 internal constant VERDICT_ABOVE = 1;
    /// @dev Observed holdings did not satisfy the Line at `asOf`.
    uint8 internal constant VERDICT_BELOW = 2;

    // ---------------------------------------------------------------- metrics

    /// @dev Assets observed at the named sources, minus liabilities visible at those same
    ///      sources, after haircuts. Deliberately NOT called "net equity" - a read-only
    ///      exchange key cannot see off-balance-sheet obligations and we do not pretend it can.
    uint8 internal constant METRIC_OBSERVED_NET_ASSETS_USD = 0;
    /// @dev The subset of the above held in assets carrying a 1.00 haircut.
    uint8 internal constant METRIC_OBSERVED_LIQUID_USD = 1;

    // ---------------------------------------------------------------- comparators

    /// @dev The only comparator in v1. The grammar is frozen: two metrics, one comparator,
    ///      no boolean operators. A general expression language is a two-day sinkhole.
    uint8 internal constant COMPARATOR_GTE = 0;

    // ---------------------------------------------------------------- scale

    /// @dev All USD thresholds are 1e8 fixed point, matching Chainlink USD feed decimals.
    uint256 internal constant USD_SCALE = 1e8;

    // ---------------------------------------------------------------- structs

    /// @notice One rung of a subject's pre-registered Line ladder.
    /// @dev The ladder IS the disclosure surface. A subject registering [100k, 250k, 500k, 1m]
    ///      has consented to publishing roughly two bits about itself. Structured rather than
    ///      hashed so that `threshold` is *ordered*: a counterparty with $180k of exposure can
    ///      be served by a Mark cleared at $250k. A bare hash gives equality, not ordering, and
    ///      would force one Survey per distinct counterparty - multiplying cost and worsening
    ///      the binary-search leak.
    struct Line {
        uint8 metricId;
        uint8 comparator;
        uint256 threshold;
        /// @dev Subject consent for this rung's BELOW verdicts to be published at all. A BELOW
        ///      leaks an *upper* bound, which is the more sensitive direction, so it is opt-in
        ///      per rung. Read by the Survey workflow, which masks to INDETERMINATE before the
        ///      result ever crosses the enclave boundary. Enforced offchain by construction:
        ///      by the time a Mark reaches this contract the masking has already happened.
        bool publishBelow;
    }

    /// @notice A signed attestation produced by one Survey execution.
    struct Mark {
        bytes32 subjectId;
        uint16 lineId;
        uint8 verdict;
        uint64 asOf;
        uint64 expiry;
        bytes32 surveyId;
        bytes32 sourceSetHash;
        /// @dev Which workflow version produced this. You WILL redeploy the workflow mid-build,
        ///      and old Marks must stay distinguishable from new ones.
        bytes32 workflowId;
    }

    /// @notice A Survey request awaiting a Mark.
    struct Survey {
        bytes32 subjectId;
        address requester;
        uint16 lineId;
        uint64 requestedAt;
        bool fulfilled;
    }
}
