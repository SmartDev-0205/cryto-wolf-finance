/*
CRYPTOWOLF
Web: https://cryptowolf.finance
*/

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

library Random {
    function randomMinMax(
        bytes32 _seed,
        uint256 _min,
        uint256 _max
    ) internal pure returns (uint256) {
        uint256 diff = _max - _min + 1;

        uint256 seed = uint256(keccak256(abi.encode(_seed))) % diff;

        return seed + _min;
    }
}
