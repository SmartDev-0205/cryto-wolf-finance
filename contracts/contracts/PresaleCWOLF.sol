/*
CRYPTOWOLF
Web: https://cryptowolf.finance
*/

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./DateTimeLibrary.sol";

import "hardhat/console.sol";

contract PresaleCWOLF is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;

    bool public isInitialized;

    mapping(address => uint256) public boughtTokens;
    mapping(address => uint256) public claimedTokens;

    address public tokenAddress;
    bool public claimActive;

    uint256 public firstReleaseDateTs;

    event Claim(address indexed addressClaim, uint256 amount);
    event ChangedClaimState(bool newState);

    constructor() initializer {}

    function initialize(address tokenAddress_) public initializer {
        __Ownable_init();
        tokenAddress = tokenAddress_;
        claimActive = false;
        changeFirstReleaseDateTs(uint256(16756675200)); // Year 2500
        isInitialized = true;

        // Uncomment if we want deploy paused
        // _pause();
    }

    function maxAmountToClaim(address _address)
        internal
        view
        returns (uint256)
    {
        // Calculamos los días desde firstReleaseDateTs hasta block.timestamp.
        // Cada día liberamos un 1% más.
        uint256 diffDays = DateTimeLibrary.diffDays(
            firstReleaseDateTs,
            block.timestamp
        );

        if (diffDays >= 100) {
            diffDays = 100;
        }

        uint256 maxAmount = (boughtTokens[_address] * diffDays * 100) / 10000;

        return maxAmount;
    }

    function claim(uint256 _amountToClaim)
        external
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        require(claimActive, "Claim not active");
        uint256 maxTokensAmountToClaim = maxAmountToClaim(msg.sender);

        require(
            _amountToClaim + claimedTokens[msg.sender] <=
                maxTokensAmountToClaim,
            "Amount exceeded"
        );

        claimedTokens[msg.sender] = claimedTokens[msg.sender] + _amountToClaim;

        IERC20Upgradeable(tokenAddress).transfer(msg.sender, _amountToClaim);
        emit Claim(msg.sender, _amountToClaim);
        return true;
    }

    function remainingTokensUser(address _address)
        public
        view
        returns (uint256)
    {
        return boughtTokens[_address] - claimedTokens[_address];
    }

    function toBeClaimedNow(address _address) external view returns (uint256) {
        return maxAmountToClaim(_address) - claimedTokens[_address];
    }

    function changeFirstReleaseDateTs(uint256 _newFirstReleaseDateTs)
        public
        onlyOwner
        returns (bool)
    {
        firstReleaseDateTs = _newFirstReleaseDateTs;
        return true;
    }

    function addAddresses(
        address[] memory _addresses,
        uint256[] memory _amountTokens
    ) external onlyOwner {
        require(
            _addresses.length == _amountTokens.length,
            "Not equal dimensions"
        );

        for (uint256 index = 0; index < _addresses.length; index++) {
            boughtTokens[_addresses[index]] =
                boughtTokens[_addresses[index]] +
                _amountTokens[index] *
                1e18;
        }
    }

    function removeAddresses(address[] memory _addresses) external onlyOwner {
        for (uint256 index = 0; index < _addresses.length; index++) {
            boughtTokens[_addresses[index]] = 0;
        }
    }

    function setTokenAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        tokenAddress = _newAddress;
        return true;
    }

    function changeClaimState(bool _newState)
        external
        onlyOwner
        returns (bool)
    {
        claimActive = _newState;
        emit ChangedClaimState(_newState);
        return true;
    }

    function pause() external onlyOwner returns (bool) {
        _pause();
        return true;
    }

    function unpause() external onlyOwner returns (bool) {
        _unpause();
        return true;
    }

    function withdraw() external onlyOwner returns (bool) {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
        return true;
    }

    function withdrawRemainingTokens(uint256 _amount)
        external
        onlyOwner
        returns (bool)
    {
        IERC20Upgradeable(tokenAddress).transfer(msg.sender, _amount);
        return true;
    }

    function withdrawToken(address _tokenAddress, uint256 _amount)
        external
        onlyOwner
        returns (bool)
    {
        IERC20Upgradeable(_tokenAddress).transfer(msg.sender, _amount);
        return (true);
    }
}
