/*
CRYPTOWOLF
Web: https://
Telegram: https://t.me/
*/

// SPDX-License-Identifier: MIT
pragma solidity =0.6.6;
// pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-core/contracts/interfaces/IERC20.sol";

contract Oracle {
    function getTokenPrice(address pairAddress, uint256 amount)
        public
        view
        returns (uint256)
    {
        IUniswapV2Pair pair = IUniswapV2Pair(pairAddress);
        IERC20 token1 = IERC20(pair.token1());
        (uint256 Res0, uint256 Res1, ) = pair.getReserves();

        console.log("Res0: ", Res0);
        console.log("Res1: ", Res1);

        console.log("PRICE:", ((amount * Res1) / Res0));

        console.log("block.coinbase: ", block.coinbase);

        return ((amount * Res1) / Res0); // return amount of token0 needed to buy token1
    }
}
