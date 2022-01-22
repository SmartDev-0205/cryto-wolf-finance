/*
CRYPTOWOLF
Web: https://cryptowolf.finance
*/

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./WolfPacksNFT.sol";
import "./ConsumibleNFT.sol";

import "hardhat/console.sol";

contract Inventory is
    Initializable,
    ERC721EnumerableUpgradeable,
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;
    using StringsUpgradeable for uint256;

    bool public isInitialized;

    address wolfPackNFTContractAddress;
    address consumibleNFTContractAddress;

    mapping(address => uint8) public classOneItem;
    mapping(address => uint8) public classTwoItem;
    mapping(address => uint8) public classThreeItem;

    event MintedNFT(address indexed to, uint256 indexed id);
    event GeneratedNFT(uint256 indexed id);

    constructor() initializer {}

    function initialize(address _wolfPackNFTContractAddress, address _consumibleNFTContractAddress) public initializer {
        __Ownable_init();
        wolfPackNFTContractAddress = _wolfPackNFTContractAddress;
        consumibleNFTContractAddress = _consumibleNFTContractAddress;
    }

    function useHealthPotionPercentage(uint256 _wolfPackId, uint256 _tokenId) public {
        uint256 _initialLife = WolfPacksNFT(wolfPackNFTContractAddress).calculateInitialWolfPackLife(_wolfPackId);
        uint256 _life = WolfPacksNFT(wolfPackNFTContractAddress).wolfPackLife(_wolfPackId);
        uint256 _amountToIncrease = _life * ConsumibleFT(consumibleNFTContractAddress).getElementProperties(_tokenId)[3] / 10000;
        increaseLife(_initialLife, _life, _amountToIncrease);
        ConsumibleNFT(consumibleNFTContractAddress).burnConsumible(_tokenId);
    }

    function useHealthPotionPoints(uint256 _wolfPackId, uint256 _tokenId) public {
        uint256 _initialLife = WolfPacksNFT(wolfPackNFTContractAddress).calculateInitialWolfPackLife(_wolfPackId);
        uint256 _life = WolfPacksNFT(wolfPackNFTContractAddress).wolfPackLife(_wolfPackId);
        uint256 _amountToIncrease = ConsumibleNFT(consumibleNFTContractAddress).getElementProperties(_tokenId)[3];
        increaseLife(_initialLife, _life, _amountToIncrease);
        ConsumibleNFT(consumibleNFTContractAddress).burnConsumible(_tokenId);
    }

    function increaseLife(uint256 _initialLife, uint256 _life, uint256 _amountToIncrease) internal {
        if((_life + _amountToIncrease) >= _initialLife) {
            WolfPacksNFT(wolfPackNFTContractAddress).increaseWolfPackLife(_wolfPackId, _initialLife - _life);    
        }else{
            WolfPacksNFT(wolfPackNFTContractAddress).increaseWolfPackLife(_wolfPackId, _amountToIncrease);
        }
    }

    function useShieldPotion(uint256 _wolfPackId, uint256 _tokenId) public {
        uint256 _wolfPackLifeActual = WolfPacksNFT(wolfPackNFTContractAddress).wolfPackLife(_wolfPackId);
        require(
            _wolfPackLifeActual == 
            WolfPacksNFT(wolfPackNFTContractAddress).calculateInitialWolfPackLife(_wolfPackId), "Life must be initial life");
        uint256 percentage = ConsumibleNFT(consumibleNFTContractAddress).getElementProperties(_tokenId)[3];
        uint256 _amountToIncrease = _wolfPackLifeActual * percentage / 10000;
        WolfPacksNFT(wolfPackNFTContractAddress).increaseWolfPackLife(_wolfPackId, _amountToIncrease);
        ConsumibleNFT(consumibleNFTContractAddress).burnConsumible(_tokenId);
    }

}
