// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PlimsollTypes} from "../PlimsollTypes.sol";

/// @title IPlimsollRegistry
/// @notice The read surface a credit consumer needs. Deliberately small.
interface IPlimsollRegistry {
    /// @notice The subject a borrowing address has been bound to, or bytes32(0) if unbound.
    /// @dev A Mark attests about a `subjectId`. Money moves to an `address`. Nothing connects
    ///      the two unless this mapping does, and without it any address could present someone
    ///      else's good Mark.
    function subjectOf(address account) external view returns (bytes32);

    /// @notice Is there a live ABOVE Mark for `subjectId` clearing `threshold` on `metricId`?
    function isAboveLine(bytes32 subjectId, uint8 metricId, uint256 threshold)
        external
        view
        returns (bool);

    /// @notice Does `subjectId` hold an unbroken run of ABOVE Marks across a window?
    /// @param k Distinct Surveys required, e.g. 3.
    /// @param window Minimum seconds the run must span, e.g. 1 days.
    /// @dev This is the answer to flash-funding. A one-block loan can buy a single favourable
    ///      Mark; it cannot buy a run of them spanning a day.
    function hasStanding(
        bytes32 subjectId,
        uint8 metricId,
        uint256 threshold,
        uint8 k,
        uint64 window
    ) external view returns (bool);

    /// @notice The subject's registered Line ladder.
    function ladderOf(bytes32 subjectId) external view returns (PlimsollTypes.Line[] memory);

    /// @notice Request a Survey. Emits SurveyRequested, which the CRE workflow triggers on.
    function requestSurvey(bytes32 subjectId, uint16 lineId) external returns (bytes32 surveyId);
}
