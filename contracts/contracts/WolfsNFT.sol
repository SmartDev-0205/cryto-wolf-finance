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

import "./WolfsNFTHelper.sol";
import "./Random.sol";
import "./Variables.sol";
import "./MarketPlace.sol";

import "hardhat/console.sol";

import "./WolfPacksNFT.sol";

contract WolfsNFT is
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
    uint256 public boxPriceCWOLFInDollars;
    uint256 public gasToMinter;
    uint256 public commissionInDollars;
    address public rewardsPoolAddress;
    address public CWOLFContractAddress;
    address public wolfsNFTHelperContractAddress;
    address public VariablesContractAddress;
    address public minterWalletAddress;
    address public commissionWalletAddress;
    string public strBaseTokenURI;

    mapping(uint256 => uint256) public breed;
    mapping(uint256 => uint256) public gender;
    mapping(uint256 => uint256) public level;
    mapping(uint256 => uint256) public attack;
    mapping(uint256 => uint256) public defense;
    mapping(uint256 => uint256) public lastHunt;
    mapping(uint256 => bool) public generated;

    address public WolfPackNFTContractAddress;
    address public marketPlaceAddress;

    address public minterWalletAddress2;
    address public minterWalletAddress3;
    address public minterWalletAddress4;

    event MintedNFT(address indexed to, uint256 indexed id);
    event GeneratedNFT(uint256 indexed id);

    constructor() initializer {}

    function initialize(
        address wolfsNFTHelperContractAddress_,
        address CWOLFContractAddress_,
        address VariablesContractAddress_,
        address rewardsPoolAddress_,
        address minterWalletAddress_,
        address commissionWalletAddress_
    ) public initializer {
        __ERC721_init("WolfNFT", "WolfNFT");
        __Ownable_init();
        wolfsNFTHelperContractAddress = wolfsNFTHelperContractAddress_;
        CWOLFContractAddress = CWOLFContractAddress_;
        VariablesContractAddress = VariablesContractAddress_;
        rewardsPoolAddress = rewardsPoolAddress_;

        gasToMinter = 1000000000000000;
        commissionInDollars = 250000000000000000;
        minterWalletAddress = minterWalletAddress_;
        commissionWalletAddress = commissionWalletAddress_;
        boxPriceCWOLFInDollars = 10000000000000000000;

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

    function mintWithCWOLF(uint8 _amount)
        external
        payable
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        require(_amount <= 10, "Amount must be < 10");
        uint256 commissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(commissionInDollars);
        require(
            msg.value >=
                ((gasToMinter * _amount) + (commissionInBNB * _amount)),
            "Not enough gas"
        );
        payable(minterWalletAddress).transfer(gasToMinter * _amount);
        payable(commissionWalletAddress).transfer((commissionInBNB * _amount));
        payable(msg.sender).transfer(
            msg.value - ((gasToMinter * _amount) + (commissionInBNB * _amount))
        );

        uint256 amountCWOLF = Variables(VariablesContractAddress)
            .getDollarsInCWOLF(boxPriceCWOLFInDollars) * _amount;

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

    function burnWolf(uint256 _tokenId) public returns (bool) {
        require(ownerOf(_tokenId) == msg.sender, "Owner of WolfNFT failed");
        bool isUsed = WolfPacksNFT(WolfPackNFTContractAddress).wolfsUsed(
            _tokenId
        );

        require(isUsed == false, "Wolf cannot be burned during its use");

        safeTransferFrom(msg.sender, rewardsPoolAddress, _tokenId);

        uint256 amountCWOLF = Variables(VariablesContractAddress)
            .getDollarsInCWOLF(boxPriceCWOLFInDollars);

        uint256 amountToReturn = (amountCWOLF * 2000) / 10000;

        IERC20Upgradeable(CWOLFContractAddress).transferFrom(
            rewardsPoolAddress,
            msg.sender,
            amountToReturn
        );

        return true;
    }

    function burnMultipleWolfs(uint256[] memory _wolfsId)
        public
        returns (bool)
    {
        for (uint256 i = 0; i < _wolfsId.length; i++) {
            burnWolf(_wolfsId[i]);
        }
        return true;
    }

    function getWolfProperties(uint256 _tokenId)
        public
        view
        returns (uint256[] memory)
    {
        require(_exists(_tokenId), "Token does not exist");
        uint256[] memory properties = new uint256[](6);

        properties[0] = breed[_tokenId];
        properties[1] = gender[_tokenId];
        properties[2] = level[_tokenId];
        properties[3] = attack[_tokenId];
        properties[4] = defense[_tokenId];
        properties[5] = lastHunt[_tokenId];

        return properties;
    }

    function generateValuesWolf(uint256[] memory _tokenIds, bytes32 _seed)
        external
        returns (bool)
    {
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            uint256 tokenId = _tokenIds[index];

            require(generated[tokenId] == false, "Wolf yet generated");
            require(tokenId != 0, "Not allowed");
            require(
                msg.sender == owner() ||
                    msg.sender == minterWalletAddress ||
                    msg.sender == minterWalletAddress2 ||
                    msg.sender == minterWalletAddress3 ||
                    msg.sender == minterWalletAddress4,
                "Not allowed"
            );
            require(_exists(tokenId), "Token does not exist");

            WolfsNFTHelper wolfNFTHelper = WolfsNFTHelper(
                wolfsNFTHelperContractAddress
            );

            (
                uint256 breedGenerated,
                uint256 genderGenerated,
                uint256 levelGenerated,
                uint256 attackGenerated,
                uint256 defenseGenerated
            ) = wolfNFTHelper.generateWolf(
                    keccak256(abi.encodePacked(_seed, index))
                );

            breed[tokenId] = breedGenerated;
            gender[tokenId] = genderGenerated;
            level[tokenId] = levelGenerated;
            attack[tokenId] = attackGenerated;
            defense[tokenId] = defenseGenerated;
            generated[tokenId] = true;

            emit GeneratedNFT(tokenId);
        }

        return true;
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

    function changeGasToMinter(uint256 _newValue)
        external
        onlyOwner
        returns (bool)
    {
        gasToMinter = _newValue;
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

    function changeboxPriceCWOLFInDollars(uint256 _newValue)
        external
        onlyOwner
        returns (bool)
    {
        boxPriceCWOLFInDollars = _newValue;
        return true;
    }

    function changeWolfsNFTHelperContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        wolfsNFTHelperContractAddress = _newAddress;
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

    function changeAddressMinterWallet2(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        minterWalletAddress2 = _newAddress;
        return true;
    }

    function changeAddressMinterWallet3(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        minterWalletAddress3 = _newAddress;
        return true;
    }

    function changeAddressMinterWallet4(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        minterWalletAddress4 = _newAddress;
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

    function changeWolfPackNFTContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        WolfPackNFTContractAddress = _newAddress;
        return true;
    }

    function changeMarketplaceContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        marketPlaceAddress = _newAddress;
        return true;
    }

    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(_from, _to, _tokenId);

        // If the token is used in wolfPack, can not be tranferred
        if (WolfPackNFTContractAddress != address(0)) {
            bool isUsed = WolfPacksNFT(WolfPackNFTContractAddress)
                .materialsUsed(_tokenId);

            require(isUsed == false, "Material in WolfPack");
        }

        if (
            _from != address(0) &&
            _to != address(0) &&
            _to != rewardsPoolAddress &&
            msg.sender != marketPlaceAddress
        ) {
            revert("Only CW MarketPlace allowed");
        }

        MarketPlace(marketPlaceAddress).removeItem(
            keccak256(abi.encode(address(this), _tokenId))
        );
    }
}
