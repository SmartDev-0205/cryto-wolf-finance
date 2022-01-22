/*
CRYPTOWOLF
Web: https://cryptowolf.finance
*/

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20CappedUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "hardhat/console.sol";

contract CWolfToken is
    Initializable,
    ERC20CappedUpgradeable,
    OwnableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;

    bool public isInitialized;

    constructor() initializer {}

    function initialize() public initializer {
        __ERC20Capped_init(100 * 1e6 * 1e18);
        __Ownable_init();
        __ERC20_init("CWOLF Token", "CWOLF");
        isInitialized = true;
    }

    function burn(address _account, uint256 _amount) external returns (bool) {
        _burn(_account, _amount);
        return true;
    }

    function mint(address _account, uint256 _amount)
        external
        onlyOwner
        returns (bool)
    {
        _mint(_account, _amount);
        return true;
    }
}
