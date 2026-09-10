// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PlimsollRegistry} from "../src/PlimsollRegistry.sol";
import {PlimsollTypes} from "../src/PlimsollTypes.sol";

/// @dev Shared fixture: a registry with a forwarder, an allowlisted source set, one subject and
///      a four-rung ladder at 100k / 250k / 500k / 1m.
abstract contract Base is Test {
    PlimsollRegistry internal registry;

    address internal forwarder = makeAddr("creForwarder");
    address internal admin = makeAddr("admin");
    address internal subjectOwner = makeAddr("subjectOwner");
    address internal counterparty = makeAddr("counterparty");
    address internal otherCounterparty = makeAddr("otherCounterparty");

    bytes32 internal constant SUBJECT = keccak256("agent-solv-alpha.eth");
    bytes32 internal constant SOURCE_SET = keccak256("binance-ro+wallet+haircuts-v1");
    bytes32 internal constant WORKFLOW = keccak256("plimsoll-survey-v1");

    uint256 internal constant USD = 1e8;

    function setUp() public virtual {
        vm.warp(1_757_000_000); // a plausible wall clock; asOf/expiry maths needs room below it
        registry = new PlimsollRegistry(forwarder, admin);

        vm.prank(admin);
        registry.setSourceSet(SOURCE_SET, true);

        vm.prank(subjectOwner);
        registry.registerSubject(SUBJECT);

        _addRung(100_000 * USD, true);
        _addRung(250_000 * USD, true);
        _addRung(500_000 * USD, false);
        _addRung(1_000_000 * USD, false);
    }

    /// @dev Always advance time through this. `vm.warp(block.timestamp + n)` is unsafe under
    ///      via_ir: the optimizer treats TIMESTAMP as loop-invariant and reuses a stale read
    ///      across cheatcode calls, silently collapsing two warps into one.
    function _skip(uint256 secs) internal {
        vm.warp(vm.getBlockTimestamp() + secs);
    }

    function _now() internal view returns (uint64) {
        return uint64(vm.getBlockTimestamp());
    }

    function _addRung(uint256 threshold, bool publishBelow) internal returns (uint16) {
        vm.prank(subjectOwner);
        return registry.registerLine(
            SUBJECT,
            PlimsollTypes.Line({
                metricId: PlimsollTypes.METRIC_OBSERVED_NET_ASSETS_USD,
                comparator: PlimsollTypes.COMPARATOR_GTE,
                threshold: threshold,
                publishBelow: publishBelow
            })
        );
    }

    /// @dev Run one full Survey: request as `requester`, post the Mark as the Forwarder.
    function _survey(address requester, uint16 lineId, uint8 verdict, uint64 ttl)
        internal
        returns (bytes32 surveyId)
    {
        vm.prank(requester);
        surveyId = registry.requestSurvey(SUBJECT, lineId);

        uint64 nowTs = uint64(vm.getBlockTimestamp());
        vm.prank(forwarder);
        registry.postMark(surveyId, verdict, nowTs, nowTs + ttl, SOURCE_SET, WORKFLOW);
    }
}
