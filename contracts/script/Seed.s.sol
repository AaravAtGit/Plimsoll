// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PlimsollRegistry} from "../src/PlimsollRegistry.sol";
import {PlimsollTypes} from "../src/PlimsollTypes.sol";

/// @notice Registers one subject and its Line ladder on a deployed registry.
///
/// Usage:
///   PLIMSOLL_REGISTRY=0x... forge script script/Seed.s.sol \
///     --rpc-url $SEPOLIA_RPC_URL --account deployer --broadcast
///
/// Env:
///   PLIMSOLL_REGISTRY  required; the deployed registry
///   SUBJECT_LABEL      optional; subjectId = keccak256(label). Default agent-solv-alpha.eth
///   LADDER_USD         optional; comma-free, four whole-dollar rungs via LADDER_0..3.
///                      Defaults to 50 / 100 / 250 / 500 - sized so a faucet-funded subject
///                      wallet (0.04 ETH at ~$2.5k, ~$91 after the 0.90 haircut) clears the
///                      first rung and fails the second: both verdicts from one wallet.
///
/// The ladder IS the subject's disclosure surface: BELOW is publishable on the two lowest
/// rungs only, because a BELOW leaks an upper bound and that is the more sensitive direction.
contract Seed is Script {
    function run() external {
        PlimsollRegistry registry = PlimsollRegistry(vm.envAddress("PLIMSOLL_REGISTRY"));
        string memory label = vm.envOr("SUBJECT_LABEL", string("agent-solv-alpha.eth"));
        bytes32 subjectId = keccak256(bytes(label));

        uint256[4] memory rungs = [
            vm.envOr("LADDER_0", uint256(50)),
            vm.envOr("LADDER_1", uint256(100)),
            vm.envOr("LADDER_2", uint256(250)),
            vm.envOr("LADDER_3", uint256(500))
        ];

        vm.startBroadcast();

        registry.registerSubject(subjectId);
        for (uint256 i = 0; i < rungs.length; i++) {
            registry.registerLine(
                subjectId,
                PlimsollTypes.Line({
                    metricId: PlimsollTypes.METRIC_OBSERVED_NET_ASSETS_USD,
                    comparator: PlimsollTypes.COMPARATOR_GTE,
                    threshold: rungs[i] * PlimsollTypes.USD_SCALE,
                    publishBelow: i < 2
                })
            );
        }

        vm.stopBroadcast();

        console2.log("SUBJECT_LABEL ", label);
        console2.log("SUBJECT_ID    ");
        console2.logBytes32(subjectId);
        console2.log("LADDER_USD    ", rungs[0], rungs[1], rungs[2]);
        console2.log("              ", rungs[3]);
    }
}
