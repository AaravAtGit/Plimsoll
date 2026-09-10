// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PlimsollTypes} from "./PlimsollTypes.sol";
import {IPlimsollRegistry} from "./interfaces/IPlimsollRegistry.sol";

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}

/// @title CreditDesk
/// @notice A lender that refuses to disburse without valid Standing. The reference consumer of
///         a Mark, and the thing that makes the whole protocol more than an oracle demo.
/// @dev Credit is denominated in USD at 1e8 fixed point, matching the Line thresholds it checks
///      against. The disbursed asset is assumed to be a USD stablecoin at par; a production desk
///      would price it, but pricing the payout asset is not what this contract is demonstrating.
contract CreditDesk {
    error UnboundBorrower();
    error NoStanding();
    error ZeroAmount();
    error ZeroAddress();
    error NotOwner();
    error TransferFailed();
    error RepayExceedsDebt();

    event Borrowed(address indexed borrower, bytes32 indexed subjectId, uint256 amountUsd);
    event Repaid(address indexed borrower, uint256 amountUsd);
    event TermsSet(uint8 k, uint64 window, uint8 metricId);

    IPlimsollRegistry public immutable registry;
    IERC20 public immutable asset;
    uint8 public immutable assetDecimals;

    address public owner;

    /// @notice Distinct Surveys required to underwrite.
    uint8 public k = 3;
    /// @notice Minimum seconds the run of Marks must span. A one-block loan cannot produce one.
    uint64 public window = 1 days;
    uint8 public metricId = PlimsollTypes.METRIC_OBSERVED_NET_ASSETS_USD;

    /// @notice Outstanding principal per borrower, in USD 1e8.
    mapping(address => uint256) public debt;

    constructor(address _registry, address _asset, address _owner) {
        if (_registry == address(0) || _asset == address(0) || _owner == address(0)) {
            revert ZeroAddress();
        }
        registry = IPlimsollRegistry(_registry);
        asset = IERC20(_asset);
        assetDecimals = IERC20(_asset).decimals();
        owner = _owner;
    }

    /// @notice Draw `amountUsd` (1e8) against the borrower's Standing.
    /// @dev The Mark attests about a `subjectId`; the money goes to an `address`. `subjectOf`
    ///      is the only thing connecting them - without it, any address could present someone
    ///      else's good Mark and walk away with the loan.
    ///
    ///      Standing is checked against TOTAL exposure after this draw, not against this draw
    ///      alone. Otherwise a borrower cleared at $250k could take ten $250k loans.
    function borrow(uint256 amountUsd) external {
        if (amountUsd == 0) revert ZeroAmount();

        bytes32 subjectId = registry.subjectOf(msg.sender);
        if (subjectId == bytes32(0)) revert UnboundBorrower();

        uint256 exposure = debt[msg.sender] + amountUsd;
        if (!registry.hasStanding(subjectId, metricId, exposure, k, window)) revert NoStanding();

        debt[msg.sender] = exposure;

        if (!asset.transfer(msg.sender, _toAssetUnits(amountUsd))) revert TransferFailed();
        emit Borrowed(msg.sender, subjectId, amountUsd);
    }

    function repay(uint256 amountUsd) external {
        if (amountUsd == 0) revert ZeroAmount();
        uint256 outstanding = debt[msg.sender];
        if (amountUsd > outstanding) revert RepayExceedsDebt();

        debt[msg.sender] = outstanding - amountUsd;

        if (!asset.transferFrom(msg.sender, address(this), _toAssetUnits(amountUsd))) {
            revert TransferFailed();
        }
        emit Repaid(msg.sender, amountUsd);
    }

    /// @notice What this desk would decide right now, without moving any money.
    /// @dev The counterparty agent calls this before quoting terms.
    function wouldLend(address borrower, uint256 amountUsd) external view returns (bool) {
        bytes32 subjectId = registry.subjectOf(borrower);
        if (subjectId == bytes32(0)) return false;
        return registry.hasStanding(subjectId, metricId, debt[borrower] + amountUsd, k, window);
    }

    function _toAssetUnits(uint256 amountUsd) internal view returns (uint256) {
        if (assetDecimals >= 8) return amountUsd * (10 ** (assetDecimals - 8));
        return amountUsd / (10 ** (8 - assetDecimals));
    }

    function setTerms(uint8 _k, uint64 _window, uint8 _metricId) external {
        if (msg.sender != owner) revert NotOwner();
        k = _k;
        window = _window;
        metricId = _metricId;
        emit TermsSet(_k, _window, _metricId);
    }

    function fund(uint256 amount) external {
        if (!asset.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
    }
}
