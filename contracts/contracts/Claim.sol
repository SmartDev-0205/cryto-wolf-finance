/*
CRYPTOWOLF
Web: https://cryptowolf.finance
*/

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./DateTimeLibrary.sol";
import "./Variables.sol";
import "./WolfPacksNFT.sol";

contract Claim is
    Initializable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable
{
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;
    using StringsUpgradeable for uint256;

    bool public isInitialized;

    uint8 public topLevel;
    uint256 public reductionBasisPoints;
    address public CWOLFContractAddress;
    address public huntingNFTContractAddress;
    address public rewardsPoolAddress;

    mapping(address => bool) public usersRegistered;
    mapping(address => uint256) public usersAmount;
    mapping(address => uint8) public usersPenalizationLevel;
    mapping(address => uint256) public usersTaxAmount;
    mapping(address => uint256) public dateUsersLastReduction;
    mapping(address => uint256) public dateUsersLastHunt;
    mapping(address => uint256) public usersLastDayHunt;
    mapping(address => uint256) public usersLastMonthHunt;
    mapping(address => uint256) public usersLastYearHunt;

    mapping(uint8 => uint256) public levelsPercentages;

    address public variablesContractAddress;
    address public wolfPacksContractAddress;
    address public minterWalletAddress;
    mapping(address => uint256) public usersReferalAmount;

    event Deposit(address indexed user, uint256 indexed amountDeposited);
    event ClaimReward(
        address indexed user,
        uint256 indexed amountToClaim,
        uint256 indexed penalizationAmount
    );

    event ChangeAmount(address indexed wallet, uint256 indexed amount);
    event BuyEnergyWithClaim(address indexed wallet, uint256 indexed amount);
    event BuyLinkWithClaim(address indexed wallet, uint256 indexed amount);
    event ReferalDeposit(
        address indexed userAddress,
        uint256 indexed rewardAmount
    );
    event ClaimReferalReward(
        address indexed user,
        uint256 indexed amountToClaim
    );

    constructor() initializer {}

    function initialize(
        address CWOLFContractAddress_,
        address huntingNFTContractAddress_,
        address rewardsPoolAddress_,
        address variablesContractAddress_
    ) public initializer {
        __Ownable_init();
        isInitialized = true;

        CWOLFContractAddress = CWOLFContractAddress_;
        huntingNFTContractAddress = huntingNFTContractAddress_;
        rewardsPoolAddress = rewardsPoolAddress_;
        levelsPercentages[0] = 4500;
        levelsPercentages[1] = 5400;
        levelsPercentages[2] = 6300;
        levelsPercentages[3] = 7200;
        levelsPercentages[4] = 8100;
        levelsPercentages[5] = 9000;

        reductionBasisPoints = 300;
        topLevel = 5;
        variablesContractAddress = variablesContractAddress_;
        // Uncomment if we want deploy paused
        // _pause();
    }

    function addReward(address _userAddress, uint256 _rewardAmount) external {
        require(
            msg.sender == huntingNFTContractAddress,
            "Caller is not Hunting Contract"
        );

        usersAmount[_userAddress] = usersAmount[_userAddress] + _rewardAmount;

        // Si el usuario no está registrado, preparamos todos sus datos
        if (!usersRegistered[_userAddress]) {
            _setUser(_userAddress);
        }

        // Comprobamos si se le quita penalización, si ya ha cazado hoy, no se le quita más
        if (checkIfCanDecreasePenalization(_userAddress)) {
            decreasePenalizationAmount(_userAddress, 1);
        }
        // Seteamos los datos de hoy respecto a la caza
        dateUsersLastHunt[_userAddress] = block.timestamp;

        emit Deposit(_userAddress, _rewardAmount);
    }

    function claimReward() external nonReentrant {
        require(usersRegistered[msg.sender], "User not registered");
        require(
            usersAmount[msg.sender] > 0,
            "User does not have any amount to claim"
        );

        uint256 _feeAmount = (usersAmount[msg.sender] *
            usersTaxAmount[msg.sender]) / 10000;

        uint256 _amountToClaim = usersAmount[msg.sender] - _feeAmount;

        IERC20Upgradeable(CWOLFContractAddress).transferFrom(
            rewardsPoolAddress,
            msg.sender,
            _amountToClaim
        );

        usersAmount[msg.sender] = 0;

        if (usersTaxAmount[msg.sender] > 0) {
            usersPenalizationLevel[msg.sender] = usersPenalizationLevel[
                msg.sender
            ] < topLevel
                ? usersPenalizationLevel[msg.sender] + 1
                : topLevel;
        } else {
            usersPenalizationLevel[msg.sender] = 0;
        }
        usersTaxAmount[msg.sender] = levelsPercentages[
            usersPenalizationLevel[msg.sender]
        ];

        emit ClaimReward(
            msg.sender,
            _amountToClaim,
            usersTaxAmount[msg.sender]
        );
    }

    function addReferalReward(
        address _userAddress,
        uint256 _referalRewardAmount
    ) external {
        require(msg.sender == minterWalletAddress, "Caller is not minter");

        usersReferalAmount[_userAddress] =
            usersReferalAmount[_userAddress] +
            _referalRewardAmount;

        emit ReferalDeposit(_userAddress, _referalRewardAmount);
    }

    function claimReferalReward(uint256 _amountToClaim) external nonReentrant {
        require(
            usersReferalAmount[msg.sender] > 0,
            "Not amount to claim"
        );
        require(
            _amountToClaim <= usersReferalAmount[msg.sender],
            "Insufficient amount"
        );

        IERC20Upgradeable(CWOLFContractAddress).transferFrom(
            rewardsPoolAddress,
            msg.sender,
            _amountToClaim
        );

        usersReferalAmount[msg.sender] = 0;

        emit ClaimReferalReward(msg.sender, _amountToClaim);
    }

    function decreasePenalizationAmount(
        address _userAddress,
        uint256 _amountOfDays
    ) internal {
        uint256 totalBasisPointsToReduce = reductionBasisPoints * _amountOfDays;
        if (totalBasisPointsToReduce > usersTaxAmount[_userAddress]) {
            usersTaxAmount[_userAddress] = 0;
        } else {
            usersTaxAmount[_userAddress] =
                usersTaxAmount[_userAddress] -
                totalBasisPointsToReduce;
        }
        //dateUsersLastReduction[_userAddress] = block.timestamp;
    }

    function changeReductionBasisPoints(uint256 _newReductionBasisPoints)
        external
        onlyOwner
    {
        reductionBasisPoints = _newReductionBasisPoints;
    }

    function checkIfCanDecreasePenalization(address _userAddress)
        public
        view
        returns (bool)
    {
        uint256 lastTs = DateTimeLibrary.timestampFromDate(
            DateTimeLibrary.getYear(dateUsersLastHunt[_userAddress]),
            DateTimeLibrary.getMonth(dateUsersLastHunt[_userAddress]),
            DateTimeLibrary.getDay(dateUsersLastHunt[_userAddress])
        );

        uint256 nowTs = DateTimeLibrary.timestampFromDate(
            DateTimeLibrary.getYear(block.timestamp),
            DateTimeLibrary.getMonth(block.timestamp),
            DateTimeLibrary.getDay(block.timestamp)
        );

        return (dateUsersLastHunt[_userAddress] > 0 && (nowTs > lastTs));
    }

    function changeHuntingNFTContractAddress(
        address _newHuntingNFTContractAddress
    ) external onlyOwner {
        huntingNFTContractAddress = _newHuntingNFTContractAddress;
    }

    function changeRewardsPoolAddress(address _newRewardsPoolAddress)
        external
        onlyOwner
    {
        rewardsPoolAddress = _newRewardsPoolAddress;
    }

    function changeVariablesContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        variablesContractAddress = _newAddress;
        return true;
    }

    function _setUser(address _userAddress) internal {
        usersPenalizationLevel[_userAddress] = 0;
        usersTaxAmount[_userAddress] = levelsPercentages[
            usersPenalizationLevel[_userAddress]
        ];
        usersRegistered[_userAddress] = true;
        //dateUsersLastReduction[_userAddress] = block.timestamp;
    }

    function changeWolfpacksContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        wolfPacksContractAddress = _newAddress;
        return true;
    }

    function buyEnergyWithClaim(uint256 _wolfPackId, uint256 _amountCWOLF)
        external
        payable
        nonReentrant
    {
        require(
            usersAmount[msg.sender] >= _amountCWOLF,
            "Not enough amount of CWOLF"
        );
        require(
            WolfPacksNFT(wolfPacksContractAddress).ownerOf(_wolfPackId) ==
                msg.sender,
            "Owner of WolfPack failed"
        );

        uint256 energyCommission = WolfPacksNFT(wolfPacksContractAddress)
            .energyCommission();
        address commissionWalletAddress = WolfPacksNFT(wolfPacksContractAddress)
            .commissionWalletAddress();

        uint256 energyCommissionInBNB = Variables(variablesContractAddress)
            .getDollarsInBNB(energyCommission);
        require(msg.value >= energyCommissionInBNB, "Not enough value");
        payable(commissionWalletAddress).transfer(energyCommissionInBNB);
        payable(msg.sender).transfer(msg.value - energyCommissionInBNB);

        uint256 _amountInDollar = (Variables(variablesContractAddress)
            .priceCWOLF() * _amountCWOLF) / 1e18;

        WolfPacksNFT(wolfPacksContractAddress).increaseEnergy(
            _wolfPackId,
            _amountInDollar
        );

        usersAmount[msg.sender] = usersAmount[msg.sender] - _amountCWOLF;

        emit BuyEnergyWithClaim(msg.sender, _amountCWOLF);
    }

    function buyLinkWithClaim(uint256 _wolfPackId, uint256 _amountOfDays)
        external
        payable
        nonReentrant
    {
        require(
            WolfPacksNFT(wolfPacksContractAddress).ownerOf(_wolfPackId) ==
                msg.sender,
            "Owner of WolfPack failed"
        );
        require(
            WolfPacksNFT(wolfPacksContractAddress).getConfigurationLinkDays(
                _amountOfDays
            ) == true,
            "Error: Amount of days incorrect"
        );

        uint256 linkCommission = WolfPacksNFT(wolfPacksContractAddress)
            .linkCommission();
        address commissionWalletAddress = WolfPacksNFT(wolfPacksContractAddress)
            .commissionWalletAddress();

        uint256 linkCommissionInBNB = Variables(variablesContractAddress)
            .getDollarsInBNB(linkCommission);
        require(msg.value >= linkCommissionInBNB, "Not enough value");
        payable(commissionWalletAddress).transfer(linkCommissionInBNB);
        payable(msg.sender).transfer(msg.value - linkCommissionInBNB);

        uint256 totalDollars = ((_amountOfDays * 10**18) * 5000) / 10000;
        uint256 wolfPackLength = WolfPacksNFT(wolfPacksContractAddress)
            .getWolfPackLength(_wolfPackId);
        uint256 amountInCWOLF = Variables(variablesContractAddress)
            .getDollarsInCWOLF(totalDollars * wolfPackLength);
        require(
            usersAmount[msg.sender] >= amountInCWOLF,
            "Not enough amount of CWOLF"
        );
        WolfPacksNFT(wolfPacksContractAddress).increaseWolfPackLink(
            _wolfPackId,
            _amountOfDays
        );

        usersAmount[msg.sender] = usersAmount[msg.sender] - amountInCWOLF;

        emit BuyLinkWithClaim(msg.sender, amountInCWOLF);
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
