// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./Base.t.sol";
import {PlimsollRegistry} from "../src/PlimsollRegistry.sol";
import {PlimsollTypes} from "../src/PlimsollTypes.sol";

contract PlimsollRegistryTest is Base {
    uint8 constant ABOVE = PlimsollTypes.VERDICT_ABOVE;
    uint8 constant BELOW = PlimsollTypes.VERDICT_BELOW;
    uint8 constant INDET = PlimsollTypes.VERDICT_INDETERMINATE;
    uint8 constant NET_ASSETS = PlimsollTypes.METRIC_OBSERVED_NET_ASSETS_USD;
    uint8 constant LIQUID = PlimsollTypes.METRIC_OBSERVED_LIQUID_USD;

    // ------------------------------------------------------------------ subjects

    function test_registerSubject_setsOwner() public view {
        assertEq(registry.subjectOwner(SUBJECT), subjectOwner);
    }

    function test_registerSubject_revertsWhenTaken() public {
        vm.prank(counterparty);
        vm.expectRevert(PlimsollRegistry.SubjectTaken.selector);
        registry.registerSubject(SUBJECT);
    }

    function test_registerLine_onlySubjectOwner() public {
        vm.prank(counterparty);
        vm.expectRevert(PlimsollRegistry.NotSubjectOwner.selector);
        registry.registerLine(
            SUBJECT,
            PlimsollTypes.Line({
                metricId: NET_ASSETS, comparator: 0, threshold: 1, publishBelow: true
            })
        );
    }

    function test_registerLine_rejectsUnfrozenGrammar() public {
        vm.prank(subjectOwner);
        vm.expectRevert(PlimsollRegistry.BadComparator.selector);
        registry.registerLine(
            SUBJECT,
            PlimsollTypes.Line({
                metricId: NET_ASSETS, comparator: 1, threshold: 1, publishBelow: true
            })
        );

        vm.prank(subjectOwner);
        vm.expectRevert(PlimsollRegistry.BadMetric.selector);
        registry.registerLine(
            SUBJECT,
            PlimsollTypes.Line({metricId: 7, comparator: 0, threshold: 1, publishBelow: true})
        );

        vm.prank(subjectOwner);
        vm.expectRevert(PlimsollRegistry.BadThreshold.selector);
        registry.registerLine(
            SUBJECT,
            PlimsollTypes.Line({
                metricId: NET_ASSETS, comparator: 0, threshold: 0, publishBelow: true
            })
        );
    }

    function test_ladder_capped() public {
        for (uint256 i = 4; i < registry.MAX_LADDER(); ++i) {
            _addRung((i + 1) * USD, false);
        }
        vm.prank(subjectOwner);
        vm.expectRevert(PlimsollRegistry.LadderFull.selector);
        registry.registerLine(
            SUBJECT,
            PlimsollTypes.Line({
                metricId: NET_ASSETS, comparator: 0, threshold: 1, publishBelow: false
            })
        );
    }

    // ------------------------------------------------------------------ binding

    function _signBind(uint256 pk, bytes32 subjectId, address account, uint64 deadline)
        internal
        view
        returns (bytes memory)
    {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "BindAddress(bytes32 subjectId,address account,uint256 nonce,uint64 deadline)"
                ),
                subjectId,
                account,
                registry.bindNonce(account),
                deadline
            )
        );
        bytes32 digest =
            keccak256(abi.encodePacked("\x19\x01", registry.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_bindAddress_requiresSignatureFromTheAddressItself() public {
        (address agent, uint256 pk) = makeAddrAndKey("agentWallet");
        uint64 deadline = _now() + 1 hours;

        registry.bindAddress(SUBJECT, agent, deadline, _signBind(pk, SUBJECT, agent, deadline));
        assertEq(registry.subjectOf(agent), SUBJECT);
        assertEq(registry.boundAddresses(SUBJECT).length, 1);
    }

    function test_bindAddress_rejectsSubjectOwnerClaimingAnAddressItDoesNotHold() public {
        (address victim,) = makeAddrAndKey("victimWallet");
        (, uint256 attackerPk) = makeAddrAndKey("attacker");
        uint64 deadline = _now() + 1 hours;

        bytes memory forged = _signBind(attackerPk, SUBJECT, victim, deadline);
        vm.expectRevert(PlimsollRegistry.BadSignature.selector);
        registry.bindAddress(SUBJECT, victim, deadline, forged);
    }

    function test_bindAddress_rejectsExpiredAndReplay() public {
        (address agent, uint256 pk) = makeAddrAndKey("agentWallet");
        uint64 deadline = _now() + 1 hours;
        bytes memory sig = _signBind(pk, SUBJECT, agent, deadline);

        registry.bindAddress(SUBJECT, agent, deadline, sig);

        // same signature, second use: blocked by AlreadyBound, and the nonce moved anyway
        vm.expectRevert(PlimsollRegistry.AlreadyBound.selector);
        registry.bindAddress(SUBJECT, agent, deadline, sig);
        assertEq(registry.bindNonce(agent), 1);

        (address other, uint256 pk2) = makeAddrAndKey("otherWallet");
        bytes memory sig2 = _signBind(pk2, SUBJECT, other, deadline);
        vm.warp(deadline + 1);
        vm.expectRevert(PlimsollRegistry.BindExpired.selector);
        registry.bindAddress(SUBJECT, other, deadline, sig2);
    }

    function test_bindAddress_rejectsMalformedSignature() public {
        (address agent,) = makeAddrAndKey("agentWallet");
        vm.expectRevert(PlimsollRegistry.BadSignature.selector);
        registry.bindAddress(SUBJECT, agent, _now() + 1, hex"dead");
    }

    // ------------------------------------------------------------------ surveys

    function test_requestSurvey_emitsAndStores() public {
        vm.prank(counterparty);
        bytes32 id = registry.requestSurvey(SUBJECT, 1);

        PlimsollTypes.Survey memory s = registry.surveyOf(id);
        assertEq(s.subjectId, SUBJECT);
        assertEq(s.requester, counterparty);
        assertEq(s.lineId, 1);
        assertFalse(s.fulfilled);
    }

    function test_requestSurvey_rejectsUnknownSubjectOrLine() public {
        vm.prank(counterparty);
        vm.expectRevert(PlimsollRegistry.SubjectUnknown.selector);
        registry.requestSurvey(keccak256("nobody"), 0);

        vm.prank(counterparty);
        vm.expectRevert(PlimsollRegistry.LineUnknown.selector);
        registry.requestSurvey(SUBJECT, 99);
    }

    /// @dev The binary-search leak. One requester walking the ladder downward is exactly what
    ///      the pair-scoped counter exists to stop.
    function test_rateLimit_isScopedToTheSubjectRequesterPair() public {
        for (uint256 i = 0; i < 5; ++i) {
            vm.prank(counterparty);
            registry.requestSurvey(SUBJECT, 0);
        }
        assertEq(registry.remainingRequests(SUBJECT, counterparty), 0);

        vm.prank(counterparty);
        vm.expectRevert(PlimsollRegistry.RateLimited.selector);
        registry.requestSurvey(SUBJECT, 0);

        // a different counterparty is unaffected - a global limit would let one requester
        // starve everyone else
        assertEq(registry.remainingRequests(SUBJECT, otherCounterparty), 5);
        vm.prank(otherCounterparty);
        registry.requestSurvey(SUBJECT, 0);

        // and the window rolls
        _skip(1 hours);
        vm.prank(counterparty);
        registry.requestSurvey(SUBJECT, 0);
    }

    // ------------------------------------------------------------------ postMark

    function test_postMark_onlyForwarder() public {
        vm.prank(counterparty);
        bytes32 id = registry.requestSurvey(SUBJECT, 1);

        vm.prank(counterparty);
        vm.expectRevert(PlimsollRegistry.NotForwarder.selector);
        registry.postMark(id, ABOVE, _now(), _now() + 300, SOURCE_SET, WORKFLOW);
    }

    function test_postMark_rejectsUnknownAndDoubleFulfilment() public {
        vm.prank(forwarder);
        vm.expectRevert(PlimsollRegistry.SurveyUnknown.selector);
        registry.postMark(keccak256("ghost"), ABOVE, _now(), _now() + 300, SOURCE_SET, WORKFLOW);

        bytes32 id = _survey(counterparty, 1, ABOVE, 300);

        vm.prank(forwarder);
        vm.expectRevert(PlimsollRegistry.SurveyAlreadyFulfilled.selector);
        registry.postMark(id, ABOVE, _now(), _now() + 300, SOURCE_SET, WORKFLOW);
    }

    function test_postMark_validatesPayload() public {
        vm.prank(counterparty);
        bytes32 id = registry.requestSurvey(SUBJECT, 1);
        uint64 nowTs = _now();

        vm.prank(forwarder);
        vm.expectRevert(PlimsollRegistry.BadVerdict.selector);
        registry.postMark(id, 9, nowTs, nowTs + 300, SOURCE_SET, WORKFLOW);

        vm.prank(forwarder);
        vm.expectRevert(PlimsollRegistry.SourceSetNotAllowed.selector);
        registry.postMark(id, ABOVE, nowTs, nowTs + 300, keccak256("fabricated"), WORKFLOW);

        vm.prank(forwarder);
        vm.expectRevert(PlimsollRegistry.ExpiryInPast.selector);
        registry.postMark(id, ABOVE, nowTs, nowTs, SOURCE_SET, WORKFLOW);

        vm.prank(forwarder);
        vm.expectRevert(PlimsollRegistry.AsOfInFuture.selector);
        registry.postMark(id, ABOVE, nowTs + 1, nowTs + 300, SOURCE_SET, WORKFLOW);
    }

    // ------------------------------------------------------------------ onReport

    /// @dev The Forwarder never calls `postMark`. It calls `onReport` on every receiver, so this
    ///      is the path a real Mark actually travels; `postMark` is the hand-drivable twin.
    function test_onReport_landsAMarkThroughTheForwarderEntryPoint() public {
        vm.prank(counterparty);
        bytes32 id = registry.requestSurvey(SUBJECT, 1);
        uint64 nowTs = _now();

        vm.prank(forwarder);
        registry.onReport("", abi.encode(id, ABOVE, nowTs, nowTs + 300, SOURCE_SET, WORKFLOW));

        assertTrue(registry.isAboveLine(SUBJECT, NET_ASSETS, 250_000 * USD));
        assertTrue(registry.surveyOf(id).fulfilled);
    }

    function test_onReport_onlyForwarder() public {
        vm.prank(counterparty);
        bytes32 id = registry.requestSurvey(SUBJECT, 1);

        vm.prank(counterparty);
        vm.expectRevert(PlimsollRegistry.NotForwarder.selector);
        registry.onReport("", abi.encode(id, ABOVE, _now(), _now() + 300, SOURCE_SET, WORKFLOW));
    }

    /// @dev The decoded payload runs the same gauntlet as a hand-posted Mark. A report is
    ///      CRE-signed, not trusted: a fabricated source set is refused either way.
    function test_onReport_appliesTheSameValidationAsPostMark() public {
        vm.prank(counterparty);
        bytes32 id = registry.requestSurvey(SUBJECT, 1);
        uint64 nowTs = _now();

        vm.prank(forwarder);
        vm.expectRevert(PlimsollRegistry.SourceSetNotAllowed.selector);
        registry.onReport(
            "", abi.encode(id, ABOVE, nowTs, nowTs + 300, keccak256("fabricated"), WORKFLOW)
        );

        vm.prank(forwarder);
        vm.expectRevert(PlimsollRegistry.BadVerdict.selector);
        registry.onReport("", abi.encode(id, uint8(9), nowTs, nowTs + 300, SOURCE_SET, WORKFLOW));

        vm.prank(forwarder);
        vm.expectRevert(PlimsollRegistry.ExpiryInPast.selector);
        registry.onReport("", abi.encode(id, ABOVE, nowTs, nowTs, SOURCE_SET, WORKFLOW));
    }

    /// @dev Metadata is ignored by design, so a Forwarder version that changes its layout does
    ///      not change what a Mark means.
    function test_onReport_ignoresMetadata() public {
        vm.prank(counterparty);
        bytes32 id = registry.requestSurvey(SUBJECT, 1);
        uint64 nowTs = _now();

        vm.prank(forwarder);
        registry.onReport(
            abi.encode(keccak256("some other workflow"), uint32(7)),
            abi.encode(id, ABOVE, nowTs, nowTs + 300, SOURCE_SET, WORKFLOW)
        );

        assertEq(registry.markAt(SUBJECT, 0).workflowId, WORKFLOW);
    }

    // ------------------------------------------------------------------ isAboveLine

    /// @dev The reason Line is a struct and not a hash. A Mark cleared at 250k must serve a
    ///      counterparty carrying 180k of exposure; keccak equality could never answer this.
    function test_isAboveLine_isOrderedNotExactMatch() public {
        _survey(counterparty, 1, ABOVE, 300); // the 250k rung

        assertTrue(registry.isAboveLine(SUBJECT, NET_ASSETS, 180_000 * USD));
        assertTrue(registry.isAboveLine(SUBJECT, NET_ASSETS, 250_000 * USD));
        assertFalse(registry.isAboveLine(SUBJECT, NET_ASSETS, 250_001 * USD));
    }

    function test_isAboveLine_ignoresExpiredWrongMetricAndNonAbove() public {
        _survey(counterparty, 1, ABOVE, 300);

        assertFalse(registry.isAboveLine(SUBJECT, LIQUID, 100_000 * USD), "wrong metric");

        _skip(301);
        assertFalse(registry.isAboveLine(SUBJECT, NET_ASSETS, 100_000 * USD), "expired");

        _survey(counterparty, 1, BELOW, 300);
        assertFalse(registry.isAboveLine(SUBJECT, NET_ASSETS, 100_000 * USD), "below");

        _survey(counterparty, 1, INDET, 300);
        assertFalse(registry.isAboveLine(SUBJECT, NET_ASSETS, 100_000 * USD), "indeterminate");
    }

    // ------------------------------------------------------------------ standing

    /// @dev Three Surveys spanning a day. This is what a counterparty actually underwrites
    ///      against, and what a flash loan cannot manufacture.
    function _buildStanding() internal {
        _survey(counterparty, 1, ABOVE, 300);
        _skip(12 hours);
        _survey(counterparty, 1, ABOVE, 300);
        _skip(12 hours);
        _survey(counterparty, 1, ABOVE, 300);
    }

    function test_hasStanding_happyPath() public {
        _buildStanding();
        assertTrue(registry.hasStanding(SUBJECT, NET_ASSETS, 250_000 * USD, 3, 1 days));
        assertTrue(registry.hasStanding(SUBJECT, NET_ASSETS, 180_000 * USD, 3, 1 days));
    }

    /// @dev The flash-funding attack: fund the hold, buy one favourable Mark, borrow, unwind.
    ///      A single Mark is not Standing.
    function test_hasStanding_rejectsFlashFundedSingleMark() public {
        _survey(counterparty, 1, ABOVE, 300);
        assertTrue(registry.isAboveLine(SUBJECT, NET_ASSETS, 250_000 * USD), "one live mark");
        assertFalse(
            registry.hasStanding(SUBJECT, NET_ASSETS, 250_000 * USD, 3, 1 days), "not standing"
        );
    }

    function test_hasStanding_requiresEnoughSurveys() public {
        _buildStanding();
        assertFalse(registry.hasStanding(SUBJECT, NET_ASSETS, 250_000 * USD, 4, 1 days));
        assertFalse(registry.hasStanding(SUBJECT, NET_ASSETS, 250_000 * USD, 0, 1 days), "k=0");
    }

    function test_hasStanding_requiresTheRunToSpanTheWindow() public {
        _buildStanding();
        assertFalse(registry.hasStanding(SUBJECT, NET_ASSETS, 250_000 * USD, 3, 2 days));
    }

    function test_hasStanding_requiresAtLeastOneLiveMark() public {
        _buildStanding();
        assertTrue(registry.hasStanding(SUBJECT, NET_ASSETS, 250_000 * USD, 3, 1 days));

        _skip(301); // newest Mark lapses; history alone is not enough
        assertFalse(registry.hasStanding(SUBJECT, NET_ASSETS, 250_000 * USD, 3, 1 days));
    }

    function test_hasStanding_ignoresRunsBelowTheRequestedThreshold() public {
        _buildStanding();
        assertFalse(registry.hasStanding(SUBJECT, NET_ASSETS, 500_000 * USD, 3, 1 days));
    }

    function test_hasStanding_brokenRunDoesNotCount() public {
        _survey(counterparty, 1, ABOVE, 300);
        _skip(12 hours);
        _survey(counterparty, 1, BELOW, 300); // the run breaks here
        _skip(12 hours);
        _survey(counterparty, 1, ABOVE, 300);

        assertFalse(registry.hasStanding(SUBJECT, NET_ASSETS, 250_000 * USD, 3, 1 days));
    }

    // ------------------------------------------------------------------ admin

    function test_admin_gatedByOwner() public {
        vm.prank(counterparty);
        vm.expectRevert(PlimsollRegistry.NotOwner.selector);
        registry.setSourceSet(keccak256("x"), true);

        vm.prank(counterparty);
        vm.expectRevert(PlimsollRegistry.NotOwner.selector);
        registry.setRateLimit(100, 1);
    }

    function testFuzz_isAboveLine_neverClearsAboveTheRegisteredThreshold(uint256 ask) public {
        ask = bound(ask, 1, 10_000_000 * USD);
        _survey(counterparty, 1, ABOVE, 300);
        assertEq(registry.isAboveLine(SUBJECT, NET_ASSETS, ask), ask <= 250_000 * USD);
    }
}
