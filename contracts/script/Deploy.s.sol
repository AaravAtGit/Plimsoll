// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PlimsollRegistry} from "../src/PlimsollRegistry.sol";
import {CreditDesk} from "../src/CreditDesk.sol";
import {DemoUSD} from "../src/demo/DemoUSD.sol";
import {PlimsollTypes} from "../src/PlimsollTypes.sol";

/// @notice Deploys the registry, a demo stablecoin and a CreditDesk, then allowlists the
///         source set the Survey workflow commits to.
///
/// Usage:
///   forge script script/Deploy.s.sol --rpc-url sepolia --broadcast --verify
///
/// Env:
///   PRIVATE_KEY        deployer key
///   CRE_FORWARDER      optional; defaults to the Ethereum Sepolia KeystoneForwarder
///   SOURCE_SET_HASH    optional; defaults to keccak256("plimsoll-sources-v1")
contract Deploy is Script {
    /// @dev Ethereum Sepolia KeystoneForwarder, from the CRE Forwarder Directory.
    ///      For `cre workflow simulate --broadcast`, override with the MockKeystoneForwarder:
    ///      0x15fC6ae953E024d975e77382eEeC56A9101f9F88
    address constant SEPOLIA_FORWARDER = 0xF8344CFd5c43616a4366C34E3EEE75af79a74482;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);
        address forwarder = vm.envOr("CRE_FORWARDER", SEPOLIA_FORWARDER);
        bytes32 sourceSet = vm.envOr("SOURCE_SET_HASH", keccak256("plimsoll-sources-v1"));

        vm.startBroadcast(pk);

        PlimsollRegistry registry = new PlimsollRegistry(forwarder, deployer);
        registry.setSourceSet(sourceSet, true);

        DemoUSD usd = new DemoUSD();
        CreditDesk desk = new CreditDesk(address(registry), address(usd), deployer);
        usd.mint(address(desk), 5_000_000e6);

        vm.stopBroadcast();

        console2.log("PLIMSOLL_REGISTRY   ", address(registry));
        console2.log("CREDIT_DESK         ", address(desk));
        console2.log("DEMO_USD            ", address(usd));
        console2.log("CRE_FORWARDER       ", forwarder);
        console2.log("OWNER               ", deployer);
        console2.logBytes32(sourceSet);
    }
}
