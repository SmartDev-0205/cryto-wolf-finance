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

import "./ConsumibleNFTHelper.sol";
import "./Variables.sol";

import "hardhat/console.sol";


contract ConsumibleNFT is
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
    uint256 public consumiblePriceCWOLFInDollars;
    uint256 public gasToMinter;
    uint256 public commissionInDollars;
    address public rewardsPoolAddress;
    address public CWOLFContractAddress;
    address public consumibleNFTHelperContractAddress;
    address public VariablesContractAddress;
    address public minterWalletAddress;
    address public commissionWalletAddress;
    string public strBaseTokenURI;

    mapping(uint256 => uint256) public elementType;
    mapping(uint256 => uint256) public class;
    mapping(uint256 => uint256) public object;
    mapping(uint256 => uint256) public value;

    event MintedNFT(address indexed to, uint256 indexed id);
    event GeneratedNFT(uint256 indexed id);

    constructor() initializer {}

    function initialize(
        address consumbileNFTHelperContractAddress_,
        address CWOLFContractAddress_,
        address VariablesContractAddress_,
        address rewardsPoolAddress_,
        address minterWalletAddress_,
        address commissionWalletAddress_
    ) public initializer {
        __ERC721_init("ConsumibleNFT", "ConsumibleNFT");
        __Ownable_init();
        consumibleNFTHelperContractAddress = consumbileNFTHelperContractAddress_;
        CWOLFContractAddress = CWOLFContractAddress_;
        VariablesContractAddress = VariablesContractAddress_;
        rewardsPoolAddress = rewardsPoolAddress_;

        gasToMinter = 1000000000000000;
        commissionInDollars = 250000000000000000;
        minterWalletAddress = minterWalletAddress_;
        commissionWalletAddress = commissionWalletAddress_;
        consumiblePriceCWOLFInDollars = 10000000000000000000;

        // First wolf minted with all to 0
        // If another contract points to it must be 0
        _safeMint(minterWalletAddress_, 0);
        isInitialized = true;

        // Uncomment if we want deploy paused
        // _pause();
    }

    function mintOwner(address _to) external onlyOwner returns (uint256) {
        return mint(_to);
    }

    function mintWithCWOLF(uint8 _healthPotionType, uint8 _amount)
        external
        payable
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        // TODO: Controlar la emision de pociones require(_amount <= 10, "Amount must be < 10");
        uint256 commissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(commissionInDollars);
        require(
            msg.value >= (commissionInBNB * _amount),
            "Not enough gas"
        );
        
        payable(commissionWalletAddress).transfer((commissionInBNB * _amount));
        payable(msg.sender).transfer(msg.value - (commissionInBNB * _amount));

        uint256 amountCWOLF = Variables(VariablesContractAddress)
            .getDollarsInCWOLF(consumiblePriceCWOLFInDollars) * _amount;

        require(
            IERC20Upgradeable(CWOLFContractAddress).allowance(
                msg.sender,
                address(this)
            ) >= amountCWOLF,
            "Not enough allowance"
        );

        IERC20Upgradeable(CWOLFContractAddress).transferFrom(
            msg.sender,
            rewardsPoolAddress,
            amountCWOLF
        );

        for (uint256 index = 0; index < _amount; index++) {
            mint(msg.sender);
        }

        return true;
    }

    function buyHealtPotions(uint256 _healthPotionType, uint8 _amount)
        external
        payable
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        // TODO: Controlar la emision de pociones require(_amount <= 10, "Amount must be < 10");
        uint256 commissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(commissionInDollars);
        require(
            msg.value >= (commissionInBNB * _amount),
            "Not enough gas"
        );
        
        payable(commissionWalletAddress).transfer((commissionInBNB * _amount));
        payable(msg.sender).transfer(msg.value - (commissionInBNB * _amount));

        uint256 amountCWOLF = Variables(VariablesContractAddress)
            .getDollarsInCWOLF(consumiblePriceCWOLFInDollars) * _amount;

        require(
            IERC20Upgradeable(CWOLFContractAddress).allowance(
                msg.sender,
                address(this)
            ) >= amountCWOLF,
            "Not enough allowance"
        );

        IERC20Upgradeable(CWOLFContractAddress).transferFrom(
            msg.sender,
            rewardsPoolAddress,
            amountCWOLF
        );

        for (uint256 index = 0; index < _amount; index++) {
            uint256 id = mint(msg.sender);
            
        }

        return true;
    }

    function mint(address _to) internal returns (uint256) {
        uint256 tokenId = totalSupply();
        _safeMint(_to, tokenId);
        emit MintedNFT(_to, tokenId);
        return tokenId;
    }

    function calculateGasAndCommissions(uint8 _amount)
        public
        view
        returns (uint256[3] memory)
    {
        uint256 commissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(commissionInDollars);

        uint256[3] memory commissions;
        commissions[0] = gasToMinter * _amount;
        commissions[1] = commissionInBNB * _amount;
        commissions[2] = ((gasToMinter * _amount) +
            (commissionInBNB * _amount));
        return commissions;
    }

    function burnConsumible(uint256 _tokenId) public returns (bool) {
        require(ownerOf(_tokenId) == msg.sender, "Owner of WolfNFT failed");
        safeTransferFrom(msg.sender, rewardsPoolAddress, _tokenId);
        return true;
    }

    function getConsumibleProperties(uint256 _tokenId)
        public
        view
        returns (uint256[] memory)
    {
        require(_exists(_tokenId), "Token does not exist");
        uint256[] memory properties = new uint256[](6);

        properties[0] = elementType[_tokenId];
        properties[1] = class[_tokenId];
        properties[2] = object[_tokenId];
        properties[3] = value[_tokenId];

        return properties;
    }

    function generateValuesConsumible(uint256[] memory _tokenIds, bytes32 _seed)
        external
    {
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            uint256 tokenId = _tokenIds[index];

            require(generated[tokenId] == false, "Wolf yet generated");
            require(tokenId != 0, "Not allowed");
            require(msg.sender == owner() || msg.sender == minterWalletAddress, "Not allowed");
            require(_exists(tokenId), "Token does not exist");

            ConsumibleNFTHelper consumibleNFTHelper = ConsumibleNFTHelper(
                consumibleNFTHelperContractAddress
            );
            (
                uint256 _elementType,
                uint256 _class,
                uint256 _object,
                uint256 _value,
            ) = consumibleNFTHelper.generateElement(
                    keccak256(abi.encodePacked(_seed, index))
                );

            elementType[tokenId] = _elementType;
            class[tokenId] = _class;
            object[tokenId] = _object;
            value[tokenId] = _value;
            generated[tokenId] = true;

            emit GeneratedNFT(tokenId);
        }
    }

    function walletOfOwner(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(_owner);
        uint256[] memory tokensId = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokensId[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokensId;
    }

    function changeBaseTokenURI(string memory newBaseTokenURI)
        external
        onlyOwner
    {
        strBaseTokenURI = newBaseTokenURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return strBaseTokenURI;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_exists(_tokenId), "Token does not exist");
        return string(abi.encodePacked(_baseURI(), _tokenId.toString()));
    }

    function pauseContract() external onlyOwner returns (bool) {
        _pause();
        return true;
    }

    function unpauseContract() external onlyOwner returns (bool) {
        _unpause();
        return true;
    }

    function changeCWOLFContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        CWOLFContractAddress = _newAddress;
        return true;
    }

    function changeRewardsPoolAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        rewardsPoolAddress = _newAddress;
        return true;
    }

    function changeCommissionInDollars(uint256 _newValue)
        external
        onlyOwner
        returns (bool)
    {
        commissionInDollars = _newValue;
        return true;
    }

    function changeConsumiblePriceCWOLFInDollars(uint256 _newValue)
        external
        onlyOwner
        returns (bool)
    {
        consumiblePriceCWOLFInDollars = _newValue;
        return true;
    }

    function changeConsumibleNFTHelperContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        consumibleNFTHelperContractAddress = _newAddress;
        return true;
    }

    function changeAddressMinterWallet(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        minterWalletAddress = _newAddress;
        return true;
    }

    function changeAddressCommissionWallet(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        commissionWalletAddress = _newAddress;
        return true;
    }
    
}
