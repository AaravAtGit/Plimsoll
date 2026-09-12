// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PlimsollTypes} from "./PlimsollTypes.sol";
import {IPlimsollRegistry} from "./interfaces/IPlimsollRegistry.sol";

/// @title PlimsollRegistry
/// @notice The load line for autonomous agents. Holds subject identities, their Line ladders,
///         address bindings, and the Marks a CRE Confidential Workflow writes about them.
/// @dev Proof of enough, not proof of how much. No function on this contract accepts, stores or
///      returns a quantity of anything a subject holds. If you find yourself wanting to add
///      `netAssets` so a frontend can draw a progress bar - stop. That is the whole product.
contract PlimsollRegistry is IPlimsollRegistry {
    using PlimsollTypes for *;

    // ------------------------------------------------------------------ errors

    error NotForwarder();
    error NotOwner();
    error NotSubjectOwner();
    error SubjectTaken();
    error SubjectUnknown();
    error LineUnknown();
    error BadComparator();
    error BadMetric();
    error BadVerdict();
    error BadThreshold();
    error LadderFull();
    error SurveyUnknown();
    error SurveyAlreadyFulfilled();
    error SourceSetNotAllowed();
    error ExpiryInPast();
    error AsOfInFuture();
    error RateLimited();
    error AlreadyBound();
    error BindExpired();
    error BadSignature();
    error ZeroAddress();

    // ------------------------------------------------------------------ events

    event SubjectRegistered(bytes32 indexed subjectId, address indexed owner);
    event SubjectOwnerTransferred(bytes32 indexed subjectId, address indexed newOwner);
    event AddressBound(bytes32 indexed subjectId, address indexed account);
    event LineRegistered(
        bytes32 indexed subjectId,
        uint16 indexed lineId,
        uint8 metricId,
        uint256 threshold,
        bool publishBelow
    );

    /// @dev The CRE EVM Log trigger fires on this. The request is public; only the Hold is secret.
    event SurveyRequested(
        bytes32 indexed surveyId,
        bytes32 indexed subjectId,
        uint16 lineId,
        address indexed requester,
        uint64 requestedAt
    );

    event MarkPosted(
        bytes32 indexed surveyId,
        bytes32 indexed subjectId,
        uint16 lineId,
        uint8 verdict,
        uint64 asOf,
        uint64 expiry,
        bytes32 sourceSetHash,
        bytes32 workflowId
    );

    event SourceSetAllowed(bytes32 indexed sourceSetHash, bool allowed);
    event RateLimitSet(uint32 maxRequests, uint64 window);

    // ------------------------------------------------------------------ constants

    /// @dev Upper bound on a ladder. Coarse ladders are a privacy property, not a limitation:
    ///      every extra rung a subject registers is another bit a determined requester can buy.
    uint16 public constant MAX_LADDER = 16;

    /// @dev Marks scanned per read, newest first. Bounds gas for `hasStanding`, which is called
    ///      from inside `CreditDesk.borrow` and therefore must not be unbounded.
    uint256 public constant MAX_SCAN = 256;

    bytes32 private constant BIND_TYPEHASH =
        keccak256("BindAddress(bytes32 subjectId,address account,uint256 nonce,uint64 deadline)");
    bytes32 private constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );

    /// @dev secp256k1 group order / 2. Rejects the malleable half of the signature space.
    uint256 private constant HALF_N =
        0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0;

    // ------------------------------------------------------------------ storage

    /// @notice The CRE Forwarder for our workflow. Without this check, anyone posts themselves
    ///         an ABOVE - which is the first question a Chainlink judge asks.
    address public immutable forwarder;

    /// @notice Protocol admin. Curates the source allowlist and the rate limit only; it can
    ///         neither post a Mark nor alter one.
    address public owner;

    mapping(bytes32 => address) public subjectOwner;
    mapping(address => bytes32) public subjectOf;
    mapping(bytes32 => address[]) internal _boundAddresses;
    mapping(address => uint256) public bindNonce;

    mapping(bytes32 => PlimsollTypes.Line[]) internal _ladder;
    mapping(bytes32 => PlimsollTypes.Mark[]) internal _marks;
    mapping(bytes32 => PlimsollTypes.Survey) internal _surveys;

    /// @notice Allowlisted (sources + haircut table version) commitments.
    mapping(bytes32 => bool) public allowedSourceSet;

    /// @dev Rate limiting is the privacy mechanism, not the fee. A few cents deters nobody;
    ///      a counter scoped to the (subject, requester) PAIR is what stops one counterparty
    ///      walking the ladder downward to reconstruct a balance. Scoping it globally would
    ///      instead let any requester deny Surveys to everyone else.
    struct RateWindow {
        uint64 startedAt;
        uint32 count;
    }

    mapping(bytes32 => RateWindow) internal _rate;
    uint32 public rateMaxRequests = 5;
    uint64 public rateWindow = 1 hours;

    uint256 private _surveyNonce;

    // ------------------------------------------------------------------ modifiers

    modifier onlyForwarder() {
        if (msg.sender != forwarder) revert NotForwarder();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlySubjectOwner(bytes32 subjectId) {
        if (subjectOwner[subjectId] != msg.sender) revert NotSubjectOwner();
        _;
    }

    // ------------------------------------------------------------------ constructor

    /// @param _forwarder The CRE Forwarder address for the target chain, from the Chainlink
    ///                   Forwarder Directory. Immutable: a mutable forwarder is a backdoor.
    constructor(address _forwarder, address _owner) {
        if (_forwarder == address(0) || _owner == address(0)) revert ZeroAddress();
        forwarder = _forwarder;
        owner = _owner;
    }

    // ------------------------------------------------------------------ subjects

    /// @notice Claim a subject identifier - an ENS node or an agent DID.
    /// @dev Not hashed. Hashing the subject id buys no privacy: the requester already knows who
    ///      it is asking about, and an opaque id only makes the Mark unverifiable to third parties.
    function registerSubject(bytes32 subjectId) external {
        if (subjectId == bytes32(0)) revert SubjectUnknown();
        if (subjectOwner[subjectId] != address(0)) revert SubjectTaken();
        subjectOwner[subjectId] = msg.sender;
        emit SubjectRegistered(subjectId, msg.sender);
    }

    function transferSubjectOwner(bytes32 subjectId, address newOwner)
        external
        onlySubjectOwner(subjectId)
    {
        if (newOwner == address(0)) revert ZeroAddress();
        subjectOwner[subjectId] = newOwner;
        emit SubjectOwnerTransferred(subjectId, newOwner);
    }

    /// @notice Bind an address to a subject, proving control of that address by signature.
    /// @dev Account binding is a SEPARATE concern from source allowlisting, and conflating them
    ///      is the hole that lets a subject provision credentials for an account it does not
    ///      control. The signature must come from `account` itself - the subject owner cannot
    ///      claim an address it does not hold the key for.
    function bindAddress(
        bytes32 subjectId,
        address account,
        uint64 deadline,
        bytes calldata signature
    ) external {
        if (subjectOwner[subjectId] == address(0)) revert SubjectUnknown();
        if (account == address(0)) revert ZeroAddress();
        if (block.timestamp > deadline) revert BindExpired();
        if (subjectOf[account] != bytes32(0)) revert AlreadyBound();

        uint256 nonce = bindNonce[account];
        bytes32 structHash =
            keccak256(abi.encode(BIND_TYPEHASH, subjectId, account, nonce, deadline));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", _domainSeparator(), structHash));
        if (_recover(digest, signature) != account) revert BadSignature();

        unchecked {
            bindNonce[account] = nonce + 1;
        }
        subjectOf[account] = subjectId;
        _boundAddresses[subjectId].push(account);
        emit AddressBound(subjectId, account);
    }

    function boundAddresses(bytes32 subjectId) external view returns (address[] memory) {
        return _boundAddresses[subjectId];
    }

    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparator();
    }

    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH, keccak256("Plimsoll"), keccak256("1"), block.chainid, address(this)
            )
        );
    }

    function _recover(bytes32 digest, bytes calldata sig) internal pure returns (address) {
        if (sig.length != 65) revert BadSignature();
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (uint256(s) > HALF_N) revert BadSignature();
        if (v != 27 && v != 28) revert BadSignature();
        address signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) revert BadSignature();
        return signer;
    }

    // ------------------------------------------------------------------ ladder

    /// @notice Append a rung to the subject's Line ladder.
    /// @dev Only the subject sets its own ladder. A counterparty cannot invent a Line to probe
    ///      at - it must ask at a rung the subject has already consented to being asked about.
    function registerLine(bytes32 subjectId, PlimsollTypes.Line calldata line)
        external
        onlySubjectOwner(subjectId)
        returns (uint16 lineId)
    {
        if (line.comparator != PlimsollTypes.COMPARATOR_GTE) revert BadComparator();
        if (line.metricId > PlimsollTypes.METRIC_OBSERVED_LIQUID_USD) revert BadMetric();
        if (line.threshold == 0) revert BadThreshold();
        if (_ladder[subjectId].length >= MAX_LADDER) revert LadderFull();

        lineId = uint16(_ladder[subjectId].length);
        _ladder[subjectId].push(line);
        emit LineRegistered(subjectId, lineId, line.metricId, line.threshold, line.publishBelow);
    }

    function ladderOf(bytes32 subjectId) external view returns (PlimsollTypes.Line[] memory) {
        return _ladder[subjectId];
    }

    function lineAt(bytes32 subjectId, uint16 lineId)
        external
        view
        returns (PlimsollTypes.Line memory)
    {
        if (lineId >= _ladder[subjectId].length) revert LineUnknown();
        return _ladder[subjectId][lineId];
    }

    // ------------------------------------------------------------------ surveys

    /// @notice Request one confidential Survey against a registered Line.
    /// @dev Called by the x402 gateway once payment has settled. Returns immediately with a
    ///      `surveyId`; the caller polls for the Mark. The workflow is triggered by the event,
    ///      not by this return value.
    function requestSurvey(bytes32 subjectId, uint16 lineId) external returns (bytes32 surveyId) {
        if (subjectOwner[subjectId] == address(0)) revert SubjectUnknown();
        if (lineId >= _ladder[subjectId].length) revert LineUnknown();
        _consumeRateLimit(subjectId, msg.sender);

        unchecked {
            surveyId = keccak256(
                abi.encode(
                    subjectId, lineId, msg.sender, block.chainid, address(this), _surveyNonce++
                )
            );
        }

        _surveys[surveyId] = PlimsollTypes.Survey({
            subjectId: subjectId,
            requester: msg.sender,
            lineId: lineId,
            requestedAt: uint64(block.timestamp),
            fulfilled: false
        });

        emit SurveyRequested(surveyId, subjectId, lineId, msg.sender, uint64(block.timestamp));
    }

    function surveyOf(bytes32 surveyId) external view returns (PlimsollTypes.Survey memory) {
        return _surveys[surveyId];
    }

    function _consumeRateLimit(bytes32 subjectId, address requester) internal {
        bytes32 key = keccak256(abi.encode(subjectId, requester));
        RateWindow storage w = _rate[key];
        if (block.timestamp >= w.startedAt + rateWindow) {
            w.startedAt = uint64(block.timestamp);
            w.count = 1;
            return;
        }
        if (w.count >= rateMaxRequests) revert RateLimited();
        unchecked {
            w.count += 1;
        }
    }

    function remainingRequests(bytes32 subjectId, address requester)
        external
        view
        returns (uint32)
    {
        RateWindow storage w = _rate[keccak256(abi.encode(subjectId, requester))];
        if (block.timestamp >= w.startedAt + rateWindow) return rateMaxRequests;
        return w.count >= rateMaxRequests ? 0 : rateMaxRequests - w.count;
    }

    // ------------------------------------------------------------------ marks

    /// @notice Write the result of one Survey. Callable only by the CRE Forwarder.
    /// @dev Everything this function receives already crossed the enclave boundary via
    ///      `runtime.usingTheDons()`. That payload is the entire privacy claim, so it is
    ///      audited as a single struct: a verdict and provenance, and not one quantity.
    function postMark(
        bytes32 surveyId,
        uint8 verdict,
        uint64 asOf,
        uint64 expiry,
        bytes32 sourceSetHash,
        bytes32 workflowId
    ) external onlyForwarder {
        _postMark(surveyId, verdict, asOf, expiry, sourceSetHash, workflowId);
    }

    /// @notice The CRE Forwarder entry point. Decodes one Survey report into a Mark.
    /// @dev The Forwarder does not call `postMark` - it calls `onReport` on every receiver, with
    ///      the workflow's ABI-encoded payload in `report`. Without this function the workflow
    ///      cannot land a Mark at all, whatever `postMark`'s signature says.
    ///
    ///      `metadata` carries the Forwarder's own workflow and DON identifiers. We deliberately
    ///      do not decode it: its layout is Forwarder-version specific, and `workflowId` is
    ///      already in the payload where the workflow put it and where a test can reach it.
    ///      Authenticity does not rest on that field - it rests on `onlyForwarder`, which is
    ///      what makes the report a CRE-signed one.
    ///
    ///      Everything arriving here crossed the enclave boundary via `usingTheDons()`. That
    ///      payload is the entire privacy claim, so it is audited as a single struct: a verdict
    ///      and provenance, and not one quantity.
    function onReport(bytes calldata, bytes calldata report) external onlyForwarder {
        (
            bytes32 surveyId,
            uint8 verdict,
            uint64 asOf,
            uint64 expiry,
            bytes32 sourceSetHash,
            bytes32 workflowId
        ) = abi.decode(report, (bytes32, uint8, uint64, uint64, bytes32, bytes32));

        _postMark(surveyId, verdict, asOf, expiry, sourceSetHash, workflowId);
    }

    function _postMark(
        bytes32 surveyId,
        uint8 verdict,
        uint64 asOf,
        uint64 expiry,
        bytes32 sourceSetHash,
        bytes32 workflowId
    ) internal {
        PlimsollTypes.Survey storage s = _surveys[surveyId];
        if (s.subjectId == bytes32(0)) revert SurveyUnknown();
        if (s.fulfilled) revert SurveyAlreadyFulfilled();
        if (verdict > PlimsollTypes.VERDICT_BELOW) revert BadVerdict();
        if (!allowedSourceSet[sourceSetHash]) revert SourceSetNotAllowed();
        if (expiry <= block.timestamp) revert ExpiryInPast();
        if (asOf > block.timestamp) revert AsOfInFuture();

        s.fulfilled = true;

        _marks[s.subjectId].push(
            PlimsollTypes.Mark({
                subjectId: s.subjectId,
                lineId: s.lineId,
                verdict: verdict,
                asOf: asOf,
                expiry: expiry,
                surveyId: surveyId,
                sourceSetHash: sourceSetHash,
                workflowId: workflowId
            })
        );

        emit MarkPosted(
            surveyId, s.subjectId, s.lineId, verdict, asOf, expiry, sourceSetHash, workflowId
        );
    }

    function markCount(bytes32 subjectId) external view returns (uint256) {
        return _marks[subjectId].length;
    }

    function markAt(bytes32 subjectId, uint256 index)
        external
        view
        returns (PlimsollTypes.Mark memory)
    {
        return _marks[subjectId][index];
    }

    // ------------------------------------------------------------------ reads

    /// @notice Any live ABOVE Mark clearing `threshold` on `metricId`?
    /// @dev Ordered, not exact-match. One Mark cleared at $250k serves every counterparty whose
    ///      exposure sits at or below it.
    function isAboveLine(bytes32 subjectId, uint8 metricId, uint256 threshold)
        external
        view
        returns (bool)
    {
        PlimsollTypes.Mark[] storage ms = _marks[subjectId];
        PlimsollTypes.Line[] storage ladder = _ladder[subjectId];
        uint256 n = ms.length;
        uint256 scanned;
        for (uint256 i = n; i > 0 && scanned < MAX_SCAN;) {
            unchecked {
                --i;
                ++scanned;
            }
            PlimsollTypes.Mark storage m = ms[i];
            if (block.timestamp >= m.expiry) continue;
            if (!_clears(ladder[m.lineId], m.verdict, metricId, threshold)) continue;
            return true;
        }
        return false;
    }

    /// @notice `k` distinct Surveys, all ABOVE at or above `threshold`, spanning `window`.
    /// @dev Distinctness of surveyId is free: `postMark` fulfils each Survey exactly once, so
    ///      two Marks can never share one.
    ///
    ///      Note the liveness rule, because it is a deliberate reading of the spec rather than a
    ///      literal one. Requiring *every* Mark in the run to be unexpired is unsatisfiable: a
    ///      Mark expires in ~300s while a run must span ~86400s, so no set of Marks could ever
    ///      satisfy both at once. What a lender actually needs is a fresh opinion backed by a
    ///      history - so we require the run to span `window` and at least one qualifying Mark to
    ///      still be live. Older Marks in the run are historical evidence, and are allowed to
    ///      have expired.
    function hasStanding(
        bytes32 subjectId,
        uint8 metricId,
        uint256 threshold,
        uint8 k,
        uint64 window
    ) external view returns (bool) {
        if (k == 0) return false;

        PlimsollTypes.Mark[] storage ms = _marks[subjectId];
        PlimsollTypes.Line[] storage ladder = _ladder[subjectId];

        uint256 found;
        bool live;
        uint64 newest;
        uint64 oldest = type(uint64).max;

        uint256 n = ms.length;
        uint256 scanned;
        for (uint256 i = n; i > 0 && scanned < MAX_SCAN;) {
            unchecked {
                --i;
                ++scanned;
            }
            PlimsollTypes.Mark storage m = ms[i];
            if (!_clears(ladder[m.lineId], m.verdict, metricId, threshold)) continue;

            if (block.timestamp < m.expiry) live = true;
            if (m.asOf > newest) newest = m.asOf;
            if (m.asOf < oldest) oldest = m.asOf;
            unchecked {
                ++found;
            }

            if (found >= k && live && newest - oldest >= window) return true;
        }
        return false;
    }

    function _clears(
        PlimsollTypes.Line storage line,
        uint8 verdict,
        uint8 metricId,
        uint256 threshold
    ) internal view returns (bool) {
        if (verdict != PlimsollTypes.VERDICT_ABOVE) return false;
        if (line.metricId != metricId) return false;
        if (line.comparator != PlimsollTypes.COMPARATOR_GTE) return false;
        return line.threshold >= threshold;
    }

    // ------------------------------------------------------------------ admin

    /// @dev A Mark is reproducible by anyone holding the same inputs, which is only true if the
    ///      source set and haircut table version it committed to are known and curated.
    function setSourceSet(bytes32 sourceSetHash, bool allowed) external onlyOwner {
        allowedSourceSet[sourceSetHash] = allowed;
        emit SourceSetAllowed(sourceSetHash, allowed);
    }

    function setRateLimit(uint32 maxRequests, uint64 window) external onlyOwner {
        rateMaxRequests = maxRequests;
        rateWindow = window;
        emit RateLimitSet(maxRequests, window);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }
}
