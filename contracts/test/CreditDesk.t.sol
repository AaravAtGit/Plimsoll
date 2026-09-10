// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Base} from "./Base.t.sol";
import {CreditDesk} from "../src/CreditDesk.sol";
import {PlimsollRegistry} from "../src/PlimsollRegistry.sol";
import {PlimsollTypes} from "../src/PlimsollTypes.sol";
import {MockERC20} from "./mocks/MockERC20.sol";

contract CreditDeskTest is Base {
    CreditDesk internal desk;
    MockERC20 internal usdc;

    address internal borrower;
    uint256 internal borrowerPk;
    address internal stranger = makeAddr("stranger");

    uint8 constant ABOVE = PlimsollTypes.VERDICT_ABOVE;
    uint8 constant NET_ASSETS = PlimsollTypes.METRIC_OBSERVED_NET_ASSETS_USD;

    function setUp() public override {
        super.setUp();
        (borrower, borrowerPk) = makeAddrAndKey("borrowerAgent");

        usdc = new MockERC20(6);
        desk = new CreditDesk(address(registry), address(usdc), admin);
        usdc.mint(address(desk), 5_000_000e6);

        _bind(borrower, borrowerPk);
    }

    function _bind(address account, uint256 pk) internal {
        uint64 deadline = _now() + 1 hours;
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "BindAddress(bytes32 subjectId,address account,uint256 nonce,uint64 deadline)"
                ),
                SUBJECT,
                account,
                registry.bindNonce(account),
                deadline
            )
        );
        bytes32 digest =
            keccak256(abi.encodePacked("\x19\x01", registry.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, digest);
        registry.bindAddress(SUBJECT, account, deadline, abi.encodePacked(r, s, v));
    }

    /// @dev Three ABOVE Marks on the 250k rung, spanning a day.
    function _buildStanding() internal {
        _survey(counterparty, 1, ABOVE, 300);
        _skip(12 hours);
        _survey(counterparty, 1, ABOVE, 300);
        _skip(12 hours);
        _survey(counterparty, 1, ABOVE, 300);
    }

    function test_borrow_requiresBinding() public {
        _buildStanding();
        vm.prank(stranger);
        vm.expectRevert(CreditDesk.UnboundBorrower.selector);
        desk.borrow(100_000 * USD);
    }

    function test_borrow_refusesWithoutStanding() public {
        vm.prank(borrower);
        vm.expectRevert(CreditDesk.NoStanding.selector);
        desk.borrow(100_000 * USD);
    }

    /// @dev A single live Mark passes `isAboveLine` but is not Standing. This is the flash-funding
    ///      defence seen from the lender's side.
    function test_borrow_refusesOnOneFlashFundedMark() public {
        _survey(counterparty, 1, ABOVE, 300);
        assertTrue(registry.isAboveLine(SUBJECT, NET_ASSETS, 200_000 * USD));

        vm.prank(borrower);
        vm.expectRevert(CreditDesk.NoStanding.selector);
        desk.borrow(200_000 * USD);
    }

    function test_borrow_disbursesOnStanding() public {
        _buildStanding();
        assertTrue(desk.wouldLend(borrower, 200_000 * USD));

        vm.prank(borrower);
        desk.borrow(200_000 * USD);

        assertEq(usdc.balanceOf(borrower), 200_000e6, "1e8 USD converted to 6dp asset units");
        assertEq(desk.debt(borrower), 200_000 * USD);
    }

    function test_borrow_refusesAboveTheClearedLine() public {
        _buildStanding();
        assertFalse(desk.wouldLend(borrower, 300_000 * USD));

        vm.prank(borrower);
        vm.expectRevert(CreditDesk.NoStanding.selector);
        desk.borrow(300_000 * USD);
    }

    /// @dev Standing is checked against TOTAL exposure. Otherwise one Mark cleared at 250k funds
    ///      an unbounded number of 250k draws.
    function test_borrow_underwritesCumulativeExposure() public {
        _buildStanding();

        vm.prank(borrower);
        desk.borrow(200_000 * USD);

        vm.prank(borrower);
        vm.expectRevert(CreditDesk.NoStanding.selector);
        desk.borrow(100_000 * USD);

        vm.prank(borrower);
        desk.borrow(50_000 * USD); // 200k + 50k == the 250k rung, still clears
        assertEq(desk.debt(borrower), 250_000 * USD);
    }

    function test_borrow_refusesOnceStandingGoesStale() public {
        _buildStanding();
        _skip(301); // the newest Mark lapses

        assertFalse(desk.wouldLend(borrower, 200_000 * USD));
        vm.prank(borrower);
        vm.expectRevert(CreditDesk.NoStanding.selector);
        desk.borrow(200_000 * USD);
    }

    function test_repay_reducesDebtAndRestoresHeadroom() public {
        _buildStanding();

        vm.prank(borrower);
        desk.borrow(250_000 * USD);

        vm.startPrank(borrower);
        usdc.approve(address(desk), type(uint256).max);
        desk.repay(100_000 * USD);
        vm.stopPrank();

        assertEq(desk.debt(borrower), 150_000 * USD);
        assertTrue(desk.wouldLend(borrower, 100_000 * USD));
    }

    function test_repay_cannotExceedDebt() public {
        _buildStanding();
        vm.prank(borrower);
        desk.borrow(100_000 * USD);

        vm.prank(borrower);
        vm.expectRevert(CreditDesk.RepayExceedsDebt.selector);
        desk.repay(100_001 * USD);
    }

    function test_setTerms_onlyOwner() public {
        vm.prank(stranger);
        vm.expectRevert(CreditDesk.NotOwner.selector);
        desk.setTerms(1, 0, NET_ASSETS);

        vm.prank(admin);
        desk.setTerms(1, 0, NET_ASSETS);
        assertEq(desk.k(), 1);
    }

    /// @dev A desk that relaxes to k=1 accepts the flash-funded Mark. Included so the tradeoff
    ///      is visible in the test output rather than buried in a comment: Standing is a lender
    ///      policy, and a lender is free to choose a bad one.
    function test_relaxedTerms_acceptWhatStrictTermsRefuse() public {
        _survey(counterparty, 1, ABOVE, 300);

        assertFalse(desk.wouldLend(borrower, 200_000 * USD));
        vm.prank(admin);
        desk.setTerms(1, 0, NET_ASSETS);
        assertTrue(desk.wouldLend(borrower, 200_000 * USD));
    }

    function testFuzz_borrow_neverExceedsTheClearedRung(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000 * USD);
        _buildStanding();
        assertEq(desk.wouldLend(borrower, amount), amount <= 250_000 * USD);
    }
}
