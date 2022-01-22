/*
CRYPTOWOLF
Web: https://cryptowolf.finance
*/

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract Variables is OwnableUpgradeable {
    bool public isInitialized;
    uint256 public priceCWOLF;
    uint256 public priceBNB;
    address public minterWalletAddress;

    event PriceCWOLFChanged(uint256 newPrice);
    event PriceBNBChanged(uint256 newPrice);
    event PriceCWOLFAndBNBChanged(uint256 _newPriceCWOLF, uint256 _newPriceBNB);

    constructor() initializer {}

    function initialize(address minterWalletAddress_) public initializer {
        __Ownable_init();
        priceCWOLF = 8 * 1e17;
        priceBNB = 500000000000000000000;
        minterWalletAddress = minterWalletAddress_;
        isInitialized = true;
    }

    function setCWolfPriceInDollars(uint256 _newPrice) external {
        require(
            msg.sender == owner() || msg.sender == minterWalletAddress,
            "Not allowed"
        );
        priceCWOLF = _newPrice;
        emit PriceCWOLFChanged(_newPrice);
    }

    function getDollarsInCWOLF(uint256 _amount) // INPUT in DOLLARS
        external
        view
        returns (uint256)
    {
        return (_amount * 1e18) / priceCWOLF;
    }

    function setBNBPriceInDollars(uint256 _newPrice) external {
        require(
            msg.sender == owner() || msg.sender == minterWalletAddress,
            "Not allowed"
        );
        priceBNB = _newPrice;
        emit PriceBNBChanged(_newPrice);
    }

    function getDollarsInBNB(uint256 _amount) external view returns (uint256) { // INPUT in BNB
        return (_amount * 1e18) / priceBNB;
    }

    function setCWOLFAndBNBPriceInDollars(
        uint256 _newPriceCWOLF,
        uint256 _newPriceBNB
    ) external {
        require(
            msg.sender == owner() || msg.sender == minterWalletAddress,
            "Not allowed"
        );
        priceCWOLF = _newPriceCWOLF;
        priceBNB = _newPriceBNB;
        emit PriceCWOLFAndBNBChanged(_newPriceCWOLF, _newPriceBNB);
    }

    function changeAddressMinterWallet(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        minterWalletAddress = _newAddress;
        return true;
    }
}
