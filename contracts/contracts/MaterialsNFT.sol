/*
CRYPTOWOLF
Web: https://cryptowolf.finance
*/

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./Random.sol";
import "./Variables.sol";
import "./WolfPacksNFT.sol";
import "./MarketPlace.sol";

contract MaterialsNFT is
    Initializable,
    ERC721EnumerableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
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
    address public VariablesContractAddress;
    address public minterWalletAddress;
    address public commissionWalletAddress;
    string public strBaseTokenURI;

    uint256[] public materialsProbabilities;

    mapping(uint256 => uint256) public slots;
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
        address CWOLFContractAddress_,
        address VariablesContractAddress_,
        address rewardsPoolAddress_,
        address minterWalletAddress_,
        address commissionWalletAddress_
    ) public initializer {
        __ERC721_init("MaterialsNFT", "MaterialsNFT");
        __Ownable_init();
        isInitialized = true;
        CWOLFContractAddress = CWOLFContractAddress_;
        VariablesContractAddress = VariablesContractAddress_;
        rewardsPoolAddress = rewardsPoolAddress_;
        gasToMinter = 1000000000000000;
        minterWalletAddress = minterWalletAddress_;
        commissionWalletAddress = commissionWalletAddress_;
        commissionInDollars = 250000000000000000;
        boxPriceCWOLFInDollars = 10000000000000000000;
        materialsProbabilities = [54, 78, 90, 96, 99, 100];

        // First CAVE must be 0 capacity
        _safeMint(minterWalletAddress_, 0);

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
        uint256 commissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(commissionInDollars);
        require(_amount <= 10, "Amount must be < 10");
        require(
            msg.value >= ((gasToMinter * _amount) + commissionInBNB),
            "Not enough gas"
        );
        payable(minterWalletAddress).transfer(gasToMinter * _amount);
        payable(commissionWalletAddress).transfer(commissionInBNB);
        payable(msg.sender).transfer(
            msg.value - ((gasToMinter * _amount) + commissionInBNB)
        );

        require(
            IERC20Upgradeable(CWOLFContractAddress).allowance(
                msg.sender,
                address(this)
            ) >= boxPriceCWOLFInDollars,
            "Not enough allowance"
        );

        uint256 amountCWOLF = Variables(VariablesContractAddress)
            .getDollarsInCWOLF(boxPriceCWOLFInDollars) * _amount;

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

    function burnMaterial(uint256 _tokenId) public returns (bool) {
        require(ownerOf(_tokenId) == msg.sender, "Owner of MaterialNFT failed");

        bool isUsed = WolfPacksNFT(WolfPackNFTContractAddress).materialsUsed(
            _tokenId
        );
        require(isUsed == false, "Material cannot be burned during its use");

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

    function burnMultipleMaterials(uint256[] memory _materialsId)
        public
        returns (bool)
    {
        for (uint256 i = 0; i < _materialsId.length; i++) {
            burnMaterial(_materialsId[i]);
        }
        return true;
    }

    function getMaterialSlots(uint256 _tokenId) public view returns (uint256) {
        return slots[_tokenId];
    }

    function generateValuesMaterials(uint256[] memory _tokenIds, bytes32 _seed)
        external
        returns (bool)
    {
        for (uint256 index = 0; index < _tokenIds.length; index++) {
            uint256 tokenId = _tokenIds[index];

            require(generated[tokenId] == false, "NFT yet generated");

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

            uint256 random = Random.randomMinMax(
                keccak256(abi.encodePacked(_seed, index)),
                0,
                100
            );

            uint256 randomSlots;
            if (random < materialsProbabilities[0]) {
                randomSlots = 1;
            } else if (
                random >= materialsProbabilities[0] &&
                random < materialsProbabilities[1]
            ) {
                randomSlots = 2;
            } else if (
                random >= materialsProbabilities[1] &&
                random < materialsProbabilities[2]
            ) {
                randomSlots = 3;
            } else if (
                random >= materialsProbabilities[2] &&
                random < materialsProbabilities[3]
            ) {
                randomSlots = 4;
            } else if (
                random >= materialsProbabilities[3] &&
                random < materialsProbabilities[4]
            ) {
                randomSlots = 5;
            } else if (
                random >= materialsProbabilities[4] &&
                random <= materialsProbabilities[5]
            ) {
                randomSlots = 6;
            }

            slots[tokenId] = randomSlots;
            generated[tokenId] = true;

            emit GeneratedNFT(tokenId);
        }
        return true;
    }

    function changeMaterialsProbabilities(uint256[] memory _newArray)
        external
        onlyOwner
        returns (bool)
    {
        require(_newArray.length == 6, "Array length must be 6");
        materialsProbabilities = _newArray;
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

    function pause() external onlyOwner returns (bool) {
        _pause();
        return true;
    }

    function unpause() external onlyOwner returns (bool) {
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

    function changeboxPriceCWOLFInDollars(uint256 _newPrice)
        external
        onlyOwner
        returns (bool)
    {
        boxPriceCWOLFInDollars = _newPrice;
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
