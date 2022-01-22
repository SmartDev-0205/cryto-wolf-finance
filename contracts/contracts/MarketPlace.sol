// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./Variables.sol";
import "./WolfPacksNFT.sol";

import "hardhat/console.sol";

contract MarketPlace is
    Initializable,
    PausableUpgradeable, // TODO:
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;

    bool public isInitialized;

    address public CWOLFContractAddress;
    address public variablesContractAddress;
    address public rewardsPoolAddress;
    address public commissionWalletAddress;

    mapping(address => bool) public nftContractsAllowed;

    mapping(bytes32 => address) public tokenAddress;
    mapping(bytes32 => uint256) public tokenId;
    mapping(bytes32 => address) public sellerAddress;
    mapping(bytes32 => uint256) public askingPriceInDollars;

    uint256 public idCount;
    mapping(uint256 => bytes32) public nftId;

    address public wolfsNFTAddress;
    address public materialsNFTAddress;
    address public wolfPacksNFTAddress;

    event itemAdded(
        bytes32 indexed id,
        address tokenAddress,
        uint256 tokenId,
        address sellerAddress,
        uint256 askingPriceInDollars
    );

    event itemRemoved(bytes32 indexed id);

    event itemSold(
        bytes32 indexed id,
        address tokenAddress,
        uint256 tokenId,
        address sellerAddress,
        uint256 askingPriceInDollars,
        address buyerAddress
    );

    constructor() initializer {}

    function initialize(
        address CWOLFContractAddress_,
        address variablesContractAddress_,
        address rewardsPoolAddress_,
        address commissionWalletAddress_
    ) public initializer {
        __Ownable_init();
        CWOLFContractAddress = CWOLFContractAddress_;
        variablesContractAddress = variablesContractAddress_;
        rewardsPoolAddress = rewardsPoolAddress_;
        commissionWalletAddress = commissionWalletAddress_;
        isInitialized = true;
    }

    function addItemToMarket(
        address _tokenAddress,
        uint256 _tokenId,
        uint256 _askingPriceInDollars
    ) external whenNotPaused returns (bytes32) {
        if (_tokenAddress == wolfsNFTAddress) {
            require(
                !WolfPacksNFT(wolfPacksNFTAddress).wolfsUsed(_tokenId),
                "Wolf used"
            );
        }

        if (_tokenAddress == materialsNFTAddress) {
            require(
                !WolfPacksNFT(wolfPacksNFTAddress).materialsUsed(_tokenId),
                "Material used"
            );
        }

        // Generate id
        bytes32 id = keccak256(abi.encode(_tokenAddress, _tokenId));

        // Save data to mappings
        nftId[idCount] = id;
        idCount = idCount + 1;
        tokenAddress[id] = _tokenAddress;
        tokenId[id] = _tokenId;
        sellerAddress[id] = msg.sender;
        askingPriceInDollars[id] = _askingPriceInDollars;

        emit itemAdded(
            id,
            _tokenAddress,
            _tokenId,
            msg.sender,
            _askingPriceInDollars
        );

        return id;
    }

    function getSellerAddress(address _tokenAddress, uint256 _tokenId)
        public
        view
        returns (address)
    {
        // Generate id
        bytes32 id = keccak256(abi.encode(_tokenAddress, _tokenId));
        return sellerAddress[id];
    }

    function removeItem(bytes32 _id) external whenNotPaused returns (bytes32) {
        if (tokenId[_id] == 0) {
            return bytes32(0);
        }

        require(
            sellerAddress[_id] == msg.sender ||
                nftContractsAllowed[tokenAddress[_id]] == true,
            "Not allowed"
        );

        delete tokenAddress[_id];
        delete tokenId[_id];
        delete sellerAddress[_id];
        delete askingPriceInDollars[_id];

        emit itemRemoved(_id);

        return (_id);
    }

    function changePrice(bytes32 _id, uint256 _amountInDollars)
        external
        whenNotPaused
    {
        require(sellerAddress[_id] == msg.sender, "Not allowed");

        askingPriceInDollars[_id] = _amountInDollars;
    }

    function getTokenInfoByIdCount(uint256 _idCount)
        external
        view
        returns (
            address,
            uint256,
            address,
            uint256
        )
    {
        bytes32 _id = nftId[_idCount];
        address _tokenAddress = tokenAddress[_id];
        uint256 _tokenId = tokenId[_id];
        address _sellerAddress = sellerAddress[_id];
        uint256 _askingPriceInDollars = askingPriceInDollars[_id];

        return (_tokenAddress, _tokenId, _sellerAddress, _askingPriceInDollars);
    }

    function getTokenInfoById(bytes32 _id)
        external
        view
        returns (
            address,
            uint256,
            address,
            uint256
        )
    {
        address _tokenAddress = tokenAddress[_id];
        uint256 _tokenId = tokenId[_id];
        address _sellerAddress = sellerAddress[_id];
        uint256 _askingPriceInDollars = askingPriceInDollars[_id];

        return (_tokenAddress, _tokenId, _sellerAddress, _askingPriceInDollars);
    }

    function buyItem(bytes32 _id) external payable whenNotPaused {
        // require(msg.sender != sellerAddress[_id], "Seller can not buy");

        address _tokenAddress = tokenAddress[_id];
        uint256 _tokenId = tokenId[_id];
        address _sellerAddress = sellerAddress[_id];
        uint256 _askingPriceInDollars = askingPriceInDollars[_id];

        uint256 _sellPriceInCWOLF = Variables(variablesContractAddress)
            .getDollarsInCWOLF(_askingPriceInDollars);

        // Send 85% CWOLF to sellerAddress, 15% to rewardsPool
        IERC20Upgradeable(CWOLFContractAddress).transferFrom(
            msg.sender,
            _sellerAddress,
            (_sellPriceInCWOLF * 8500) / 10000
        );

        IERC20Upgradeable(CWOLFContractAddress).transferFrom(
            msg.sender,
            rewardsPoolAddress,
            (_sellPriceInCWOLF * 1500) / 10000
        );

        // Send 5% commission in BNB
        uint256 commissionInBNB = calculateCommission(_id);
        payable(commissionWalletAddress).transfer(commissionInBNB);

        // Transfer the token
        IERC721Upgradeable(_tokenAddress).safeTransferFrom(
            _sellerAddress,
            msg.sender,
            _tokenId
        );

        delete tokenAddress[_id];
        delete tokenId[_id];
        delete sellerAddress[_id];
        delete askingPriceInDollars[_id];


        emit itemSold(
            _id,
            _tokenAddress,
            _tokenId,
            _sellerAddress,
            _askingPriceInDollars,
            msg.sender
        );
    }

    function calculateCommission(bytes32 _id) public view returns (uint256) {
        uint256 _commissionInDollars = (askingPriceInDollars[_id] * 500) /
            10000;
        uint256 _commissionInBNB = Variables(variablesContractAddress)
            .getDollarsInBNB(_commissionInDollars);

        return _commissionInBNB;
    }

    function changeNftContractAllowance(address _address, bool _allowed)
        external
        onlyOwner
    {
        nftContractsAllowed[_address] = _allowed;
    }

    function changeRewardsPoolAddress(address _newAddress) external onlyOwner {
        rewardsPoolAddress = _newAddress;
    }

    function changeCommissionWalletAddress(address payable _newAddress)
        external
        onlyOwner
    {
        commissionWalletAddress = _newAddress;
    }

    function changeCWOLFContractAddress(address _newAddress)
        external
        onlyOwner
    {
        CWOLFContractAddress = _newAddress;
    }

    function changeVariablesContractAddress(address _newAddress)
        external
        onlyOwner
    {
        variablesContractAddress = _newAddress;
    }

    function setWolfsPacksWolfsMaterialsWolfPacks(
        address _wolfsNFTAddress,
        address _materialsNFTAddress,
        address _wolfPacksNFTAddress
    ) external onlyOwner {
        wolfsNFTAddress = _wolfsNFTAddress;
        materialsNFTAddress = _materialsNFTAddress;
        wolfPacksNFTAddress = _wolfPacksNFTAddress;
    }
}
