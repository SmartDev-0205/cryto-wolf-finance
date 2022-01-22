/*
CRYPTOWOLF
Web: https://cryptowolf.finance
*/

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./DateTimeLibrary.sol";

import "./WolfsNFT.sol";
import "./WolfPacksNFT.sol";
import "./Variables.sol";
import "./Claim.sol";

contract HuntingNFT is
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
    uint256 public boxPriceCWOLF;
    uint256 public gasToMinter;
    address public rewardsPoolAddress;
    address public CWOLFContractAddress;
    address public WolfPackNFTContractAddress;
    address public minterWalletAddress;
    string public strBaseTokenURI;

    uint256[] public animalsPoints;
    uint256[] public animalsProbability;
    uint256[] public animalsRewards;

    mapping(uint256 => uint256) public wolfPackId;
    mapping(uint256 => uint256) public positionToAttack;
    mapping(uint256 => uint256) public dateOfHunting;
    mapping(uint256 => uint256) public rewards;
    mapping(uint256 => bool) public isGenerated;
    mapping(uint256 => bool) public isClaimed;

    address public ClaimContractAddress;
    address public VariablesContractAddress;
    address public commissionWalletAddress;

    address public minterWalletAddress2;
    address public minterWalletAddress3;
    address public minterWalletAddress4;

    uint256[] public bnbForMint;
    uint256[] public benefit;

    event MintedNFT(address indexed to, uint256 indexed id);
    event GeneratedResultNFT(uint256 indexed tokenId); // Revisar qué parametros son necesarios

    constructor() initializer {}

    function initialize(
        address CWOLFContractAddress_,
        address rewardsPoolAddress_,
        address minterWalletAddress_,
        address WolfPackNFTContractAddress_,
        address commissionWalletAddress_
    ) public initializer {
        __ERC721_init("HuntingNFT", "HuntingNFT");
        __Ownable_init();
        CWOLFContractAddress = CWOLFContractAddress_;
        rewardsPoolAddress = rewardsPoolAddress_;
        gasToMinter = 1000000000000000;
        minterWalletAddress = minterWalletAddress_;
        WolfPackNFTContractAddress = WolfPackNFTContractAddress_;

        // First WOLFPACK must be 0 capacity
        _safeMint(minterWalletAddress_, 0);
        isInitialized = true;
        commissionWalletAddress = commissionWalletAddress_;
        // Uncomment if we want deploy paused
        // _pause();
    }

    function initializeBnbForMint() external onlyOwner returns (bool) {
        bnbForMint = [
            900000000000000,
            1900000000000000,
            2300000000000000,
            3100000000000000,
            3900000000000000,
            4500000000000000,
            5100000000000000,
            5800000000000000,
            6700000000000000,
            7300000000000000,
            8000000000000000,
            8600000000000000,
            9200000000000000,
            9800000000000000,
            10400000000000000,
            10900000000000000,
            11600000000000000,
            12200000000000000,
            12800000000000000,
            13400000000000000,
            14700000000000000,
            16000000000000000,
            17200000000000000,
            18500000000000000,
            19700000000000000,
            21200000000000000,
            22600000000000000,
            24000000000000000,
            25500000000000000,
            27000000000000000
        ];
        return true;
    }

    function initializeBenefits() external onlyOwner returns (bool) {
        benefit = [
            400000000000000000,
            750000000000000000,
            1100000000000000000,
            1450000000000000000,
            1800000000000000000,
            2150000000000000000,
            2500000000000000000,
            2850000000000000000,
            3200000000000000000,
            3550000000000000000,
            3900000000000000000,
            4250000000000000000,
            4600000000000000000,
            4950000000000000000,
            5300000000000000000,
            5650000000000000000,
            6000000000000000000,
            6350000000000000000,
            6700000000000000000,
            7050000000000000000,
            7400000000000000000,
            7750000000000000000,
            8100000000000000000,
            8450000000000000000,
            8800000000000000000,
            9150000000000000000,
            9500000000000000000,
            9850000000000000000,
            10200000000000000000,
            10550000000000000000
        ];
        return true;
    }

    function mintWithCWOLF(uint256 _wolfPackId, uint256 _positionToAttack)
        external
        payable
        whenNotPaused
        nonReentrant
        returns (bool)
    {
        // Comprobar que la manada sea del msg.sender
        require(
            WolfPacksNFT(WolfPackNFTContractAddress).ownerOf(_wolfPackId) ==
                msg.sender,
            "You are not the owner"
        );

        // Revisamos que la manada pueda ir a cazar
        checkWolfPack(_wolfPackId, _positionToAttack);

        uint256 commissionInDollars = _getCommissionForAttack(
            _positionToAttack
        );
        uint256 commissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(commissionInDollars);

        uint256 commissionForGas = _getCommissionForMinter(_positionToAttack);

        require(
            msg.value >= (commissionForGas + commissionInBNB),
            "Not enough gas"
        );

        payable(minterWalletAddress).transfer(commissionForGas);
        payable(commissionWalletAddress).transfer(commissionInBNB);
        payable(msg.sender).transfer(
            msg.value - (commissionForGas + commissionInBNB)
        );

        require(
            IERC20Upgradeable(CWOLFContractAddress).allowance(
                msg.sender,
                address(this)
            ) >= boxPriceCWOLF,
            "Not enough allowance"
        );

        IERC20Upgradeable(CWOLFContractAddress).transferFrom(
            msg.sender,
            rewardsPoolAddress,
            boxPriceCWOLF
        );

        uint256 huntingId = mint(msg.sender);

        wolfPackId[huntingId] = _wolfPackId;
        positionToAttack[huntingId] = _positionToAttack;

        dateOfHunting[huntingId] = block.timestamp;

        WolfPacksNFT(WolfPackNFTContractAddress).setLastHunting(
            _wolfPackId,
            block.timestamp
        );

        uint256 calculateSubEnergy = (animalsRewards[_positionToAttack] * 250) /
            10000;

        WolfPacksNFT(WolfPackNFTContractAddress).decreaseEnergy(
            _wolfPackId,
            calculateSubEnergy
        );

        WolfPacksNFT(WolfPackNFTContractAddress).decreaseWolfPackLink(
            _wolfPackId,
            1
        );

        return true;
    }

    function _getCommissionForAttack(uint256 _positionToAttack)
        internal
        view
        returns (uint256 commission)
    {
        return benefit[_positionToAttack];
    }

    function _getCommissionForMinter(uint256 _positionToAttack)
        internal
        view
        returns (uint256 commission)
    {
        return bnbForMint[_positionToAttack];
    }

    function calculateGasAndCommissions(uint256 _positionToAttack)
        public
        view
        returns (uint256[3] memory)
    {
        uint256 commissionInDollars = _getCommissionForAttack(
            _positionToAttack
        );

        uint256 commissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(commissionInDollars);

        uint256 commissionForGas = _getCommissionForMinter(_positionToAttack);

        uint256[3] memory commissions;
        commissions[0] = commissionForGas;
        commissions[1] = commissionInBNB;
        commissions[2] = commissionForGas + commissionInBNB;
        return commissions;
    }

    function checkWolfPack(uint256 _wolfPackId, uint256 _positionToAttack)
        public
        view
        returns (bool)
    {
        WolfPacksNFT wolfPacksNFT = WolfPacksNFT(WolfPackNFTContractAddress);
        uint256 pointsOfWolfPack = wolfPacksNFT.pointsOfWolfPack(_wolfPackId);

        // Comprobamos que la manada tenga puntos para poder atacar al animal
        uint256 animalsPointsToAttack = animalsPoints[_positionToAttack];
        require(
            pointsOfWolfPack >= animalsPointsToAttack,
            "Not enough points to attack this animal"
        );

        // Comprobamos que la manada pueda ir a cazar
        uint256 lastHunting = WolfPacksNFT(WolfPackNFTContractAddress)
            .lastHunting(_wolfPackId);
        if (lastHunting != 0) {
            uint256 lastTs = DateTimeLibrary.timestampFromDate(
                DateTimeLibrary.getYear(lastHunting),
                DateTimeLibrary.getMonth(lastHunting),
                DateTimeLibrary.getDay(lastHunting)
            );

            uint256 nowTs = DateTimeLibrary.timestampFromDate(
                DateTimeLibrary.getYear(block.timestamp),
                DateTimeLibrary.getMonth(block.timestamp),
                DateTimeLibrary.getDay(block.timestamp)
            );

            require(nowTs > lastTs, "Only one time per day");
        }

        bool statusLife = WolfPacksNFT(WolfPackNFTContractAddress)
            .checkWolfPackStatusDeadOrAlive(_wolfPackId);
        require(statusLife, "Your wolfpack is dead");

        // Mirar que la vida del mapping wolfPackEnergy sea mayor > que 250/10000 recompensa
        uint256 energy = WolfPacksNFT(WolfPackNFTContractAddress)
            .wolfPackEnergy(_wolfPackId);
        uint256 energyCost = (animalsRewards[_positionToAttack] * 250) / 10000;
        require(energy >= energyCost, "Your wolfpack are tired");
        // Comprobar el vínculo.
        bool statusLink = WolfPacksNFT(WolfPackNFTContractAddress)
            .checkWolfPackLink(_wolfPackId);
        require(statusLink, "Your wolfpack haven't got link");
        return true;
    }

    function getWinProbability(uint256 _wolfPackId, uint256 _positionToAttack)
        public
        view
        returns (uint256)
    {
        uint256 pointsOfPosition = animalsPoints[_positionToAttack];
        uint256 probabilityToWin = animalsProbability[_positionToAttack];

        uint256 pointsOfAttack = WolfPacksNFT(WolfPackNFTContractAddress)
            .pointsOfWolfPack(_wolfPackId);
        // Si la probabilidad es >= 90 la devolvemos
        if (probabilityToWin >= 90) {
            return probabilityToWin;
        }

        // Si es menor, la aumentamos en función de 1% por cada 100 puntos de exceso
        // uint256 pointsOfAnimalsToAttack = animalsPoints[_positionToAttack];
        uint256 excessPoints = pointsOfAttack - pointsOfPosition;
        uint256 probabilityToSum = (excessPoints / 100);
        uint256 totalProbability = probabilityToWin + probabilityToSum;

        if (totalProbability >= 90) {
            return 90;
        } else {
            return totalProbability;
        }
    }

    function mint(address _to) internal returns (uint256) {
        uint256 tokenId = totalSupply();
        _safeMint(_to, tokenId);
        emit MintedNFT(_to, tokenId);
        return tokenId;
    }

    function generateResult(uint256[] memory _huntingIds, bytes32 _seed)
        external
        returns (bool)
    {
        for (uint256 index = 0; index < _huntingIds.length; index++) {
            uint256 huntingId = _huntingIds[index];

            require(huntingId != 0, "Not allowed");
            require(
                msg.sender == owner() ||
                    msg.sender == minterWalletAddress ||
                    msg.sender == minterWalletAddress2 ||
                    msg.sender == minterWalletAddress3 ||
                    msg.sender == minterWalletAddress4,
                "Not allowed"
            );
            require(_exists(huntingId), "Token does not exist");
            require(isGenerated[huntingId] == false);

            uint256 positionToAttackAnimals = positionToAttack[huntingId];

            uint256 wolfPackIdLocal = wolfPackId[huntingId];

            address ownerOfWolfPack = ownerOf(huntingId);

            uint256 winProbability = getWinProbability(
                wolfPackIdLocal,
                positionToAttackAnimals
            );

            uint256 rewardsByPosition = animalsRewards[positionToAttackAnimals];
            if (
                WolfPacksNFT(WolfPackNFTContractAddress).wolfPackInPromo(
                    wolfPackIdLocal
                )
            ) {
                uint256 bonus = (animalsRewards[positionToAttackAnimals] *
                    2000) / 10000;
                rewardsByPosition =
                    animalsRewards[positionToAttackAnimals] +
                    bonus;
            } else {
                rewardsByPosition = animalsRewards[positionToAttackAnimals];
            }

            uint256 random = Random.randomMinMax(
                keccak256(abi.encodePacked(_seed, index)),
                0,
                100
            );

            if (random <= winProbability) {
                // Remove life
                uint256 calculateSubLife = (animalsPoints[
                    positionToAttackAnimals
                ] * 400) / 10000;

                WolfPacksNFT(WolfPackNFTContractAddress).decreaseWolfPackLife(
                    wolfPackIdLocal,
                    calculateSubLife
                );

                uint256 amountInCWOLF = Variables(VariablesContractAddress)
                    .getDollarsInCWOLF(rewardsByPosition);

                rewards[huntingId] = amountInCWOLF;

                Claim(ClaimContractAddress).addReward(
                    ownerOfWolfPack,
                    amountInCWOLF
                );
            } else {
                uint256 calculateSubLife = (animalsPoints[
                    positionToAttackAnimals
                ] * 1000) / 10000;

                WolfPacksNFT(WolfPackNFTContractAddress).decreaseWolfPackLife(
                    wolfPackIdLocal,
                    calculateSubLife
                );

                Claim(ClaimContractAddress).addReward(ownerOfWolfPack, 0);
            }

            isGenerated[huntingId] = true;

            emit GeneratedResultNFT(huntingId);
        }

        return true;
    }

    function changeAnimalsPoints(uint256[] memory _newData)
        external
        onlyOwner
        returns (bool)
    {
        animalsPoints = _newData;
        return true;
    }

    function changeAnimalsProbability(uint256[] memory _newData)
        external
        onlyOwner
        returns (bool)
    {
        animalsProbability = _newData;
        return true;
    }

    function changeAnimalsRewards(uint256[] memory _newData)
        external
        onlyOwner
        returns (bool)
    {
        animalsRewards = _newData;
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

    function changeRewardsPool(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        rewardsPoolAddress = _newAddress;
        return true;
    }

    function changeBoxPriceCWolf(uint256 _newPrice)
        external
        onlyOwner
        returns (bool)
    {
        boxPriceCWOLF = _newPrice;
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

    function changeWolfPackNFTContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        WolfPackNFTContractAddress = _newAddress;
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

    function changeClaimContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        ClaimContractAddress = _newAddress;
        return true;
    }

    function changeVariablesContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        VariablesContractAddress = _newAddress;
        return true;
    }

    function changeCommissionWalletAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        commissionWalletAddress = _newAddress;
        return true;
    }
}
