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

import "./WolfsNFT.sol";
import "./MaterialsNFT.sol";
import "./HuntingNFT.sol";
import "./Variables.sol";
import "./DateTimeLibrary.sol";

contract WolfPacksNFT is
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
    uint256 public addWolfOrMaterialCWOLFInDollar;
    uint256 public gasToMinter;
    uint256 public energyPointPriceInCWOLF;
    uint256 public commissionInDollar;
    address public rewardsPoolAddress;
    address public commissionWalletAddress;
    address public CWOLFContractAddress;
    address public HuntingNFTContractAddress;
    address public WolfsNFTContractAddress;
    address public MaterialsNFTContractAddress;
    address public VariablesContractAddress;
    address public minterWalletAddress;
    string public strBaseTokenURI;

    mapping(uint256 => uint256[]) public wolfsInWolfPack;
    mapping(uint256 => uint256[]) public materialsInWolfPack;

    mapping(uint256 => bool) public wolfsUsed;
    mapping(uint256 => bool) public materialsUsed;
    mapping(uint256 => uint256) public wolfPackLife;
    mapping(uint256 => uint256) public wolfPackEnergy;
    mapping(uint256 => uint256) public wolfPackLinkDays;
    mapping(uint256 => uint256) public wolfPackLinkDate;
    mapping(uint256 => uint256) public lastHunting;
    mapping(uint256 => bool) configurationLinkDays;

    bool public isPromoActive;
    mapping(uint256 => bool) public wolfPackInPromo;
    uint256 public dateLastPromoActivation;
    uint256 public daysOfPromo;
    uint256 public linkCommission;
    uint256 public energyCommission;
    address public marketPlaceAddress;
    address public claimContractAddress;
    address public inventoryContractAddress;

    event MintedNFT(address indexed _to, uint256 indexed _id);
    event IncreasedEnergy(uint256 indexed _wolfPackId, uint256 indexed _amount);
    event DecreasedEnergy(uint256 indexed _wolfPackId, uint256 indexed _amount);
    event IncreasedLink(uint256 indexed _wolfPackId, uint256 indexed _amount);
    event DecreasedLink(uint256 indexed _wolfPackId, uint256 indexed _amount);
    event IncreasedLife(uint256 indexed _wolfPackId, uint256 indexed _amount);
    event DecreasedLife(uint256 indexed _wolfPackId, uint256 indexed _amount);

    constructor() initializer {}

    function initialize(
        address CWOLFContractAddress_,
        address rewardsPoolAddress_,
        address minterWalletAddress_,
        address WolfsNFTContractAddress_,
        address MaterialsNFTContractAddress_,
        address VariablesContractAddress_,
        address commissionWalletAddress_
    ) public initializer {
        __ERC721_init("WolfPacksNFT", "WolfPacksNFT");
        __Ownable_init();
        isInitialized = true;
        CWOLFContractAddress = CWOLFContractAddress_;
        rewardsPoolAddress = rewardsPoolAddress_;
        gasToMinter = 1000000000000000;
        commissionInDollar = 250000000000000000;
        energyPointPriceInCWOLF = 1000000000000000000;
        minterWalletAddress = minterWalletAddress_;
        commissionWalletAddress = commissionWalletAddress_;
        WolfsNFTContractAddress = WolfsNFTContractAddress_;
        MaterialsNFTContractAddress = MaterialsNFTContractAddress_;
        VariablesContractAddress = VariablesContractAddress_;
        addWolfOrMaterialCWOLFInDollar = 250000000000000000;
        configurationLinkDays[1] = true;
        configurationLinkDays[3] = true;
        configurationLinkDays[14] = true;
        configurationLinkDays[30] = true;

        // First WOLFPACK must be 0 capacity
        _safeMint(minterWalletAddress_, 0);

        // Uncomment if we want deploy paused
        //_pause();
    }

    function mintOwner(address _to) external onlyOwner returns (uint256) {
        return mint(_to);
    }

    function mintWithCWOLF()
        public
        payable
        whenNotPaused
        nonReentrant
        returns (uint256)
    {
        uint256 commissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(commissionInDollar);
        require(msg.value >= (gasToMinter + commissionInBNB), "Not enough gas");
        payable(minterWalletAddress).transfer(gasToMinter);
        payable(commissionWalletAddress).transfer(commissionInBNB);
        payable(msg.sender).transfer(
            msg.value - (gasToMinter + commissionInBNB)
        );

        uint256 id = mint(msg.sender);

        uint256 _days = DateTimeLibrary.diffDays(
            dateLastPromoActivation,
            block.timestamp
        );
        if (isPromoActive && _days <= daysOfPromo) {
            wolfPackInPromo[id] = true;
        }

        return id;
    }

    function mint(address _to) internal returns (uint256) {
        uint256 tokenId = totalSupply();
        _safeMint(_to, tokenId);
        emit MintedNFT(_to, tokenId);
        return tokenId;
    }

    function createWolfPackAndAddWolfsAndMaterials(
        uint256[] memory _materialsIds,
        uint256[] memory _wolfsIds
    ) external payable returns (bool) {
        uint256 idWolfPack = mintWithCWOLF();
        addMultipleMaterialsToWolfPack(idWolfPack, _materialsIds);
        addMultipleWolfsToWolfPack(idWolfPack, _wolfsIds);
        return true;
    }

    function calculateInitialWolfPackLife(uint256 _wolfPackId)
        public
        view
        returns (uint256)
    {
        uint256 initialLife;
        for (uint256 i = 0; i < wolfsInWolfPack[_wolfPackId].length; i++) {
            initialLife =
                initialLife +
                WolfsNFT(WolfsNFTContractAddress).getWolfProperties(
                    wolfsInWolfPack[_wolfPackId][i]
                )[3] +
                WolfsNFT(WolfsNFTContractAddress).getWolfProperties(
                    wolfsInWolfPack[_wolfPackId][i]
                )[4];
        }
        return initialLife;
    }

    function addWolfToWolfPack(uint256 _wolfPackId, uint256 _wolfId)
        public
        returns (bool)
    {
        require(ownerOf(_wolfPackId) == msg.sender, "WolfPack property failed"); // WolfPack must be property of msg.sender

        uint256 limitTimestamp = DateTimeLibrary.addDays(
            wolfPackLinkDate[_wolfPackId],
            wolfPackLinkDays[_wolfPackId]
        );
        require(
            block.timestamp >= limitTimestamp ||
                wolfPackLinkDays[_wolfPackId] == 0,
            "Bond is greater than 0"
        );

        require(
            WolfsNFT(WolfsNFTContractAddress).ownerOf(_wolfId) == msg.sender,
            "Wolf property failed"
        );
        require(
            getTotalSlotsAvailableInWolfPack(_wolfPackId) > 0,
            "Max capacity reached"
        );
        require(wolfsUsed[_wolfId] == false, "Wolf is used in other wolf pack");

        wolfsUsed[_wolfId] = true;
        wolfsInWolfPack[_wolfPackId].push(_wolfId);
        wolfPackLife[_wolfPackId] =
            wolfPackLife[_wolfPackId] +
            WolfsNFT(WolfsNFTContractAddress).getWolfProperties(_wolfId)[3] +
            WolfsNFT(WolfsNFTContractAddress).getWolfProperties(_wolfId)[4];

        uint256 amountCWOLF = Variables(VariablesContractAddress)
            .getDollarsInCWOLF(addWolfOrMaterialCWOLFInDollar);

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
        return true;
    }

    function addMultipleWolfsToWolfPack(
        uint256 _wolfPackId,
        uint256[] memory _wolfsIds
    ) public returns (bool) {
        uint256 initialLife = calculateInitialWolfPackLife(_wolfPackId);
        require(
            wolfPackLife[_wolfPackId] >= initialLife,
            "Life is less than initial"
        );

        for (uint256 index = 0; index < _wolfsIds.length; index++) {
            addWolfToWolfPack(_wolfPackId, _wolfsIds[index]);
        }
        return true;
    }

    function addMaterialToWolfPack(uint256 _wolfPackId, uint256 _materialId)
        public
        returns (bool)
    {
        require(ownerOf(_wolfPackId) == msg.sender, "WolfPack property failed"); // WolfPack must be property of msg.sender
        require(
            MaterialsNFT(MaterialsNFTContractAddress).ownerOf(_materialId) ==
                msg.sender,
            "Material property failed"
        );
        require(
            getTotalMaterialsInWolfPack(_wolfPackId) < 20,
            "Limit 20 reached"
        );
        require(
            materialsUsed[_materialId] == false,
            "Material is used in other wolf pack"
        );

        materialsInWolfPack[_wolfPackId].push(_materialId);
        materialsUsed[_materialId] = true;

        uint256 amountCWOLF = Variables(VariablesContractAddress)
            .getDollarsInCWOLF(addWolfOrMaterialCWOLFInDollar);

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
        return true;
    }

    function addMultipleMaterialsToWolfPack(
        uint256 _wolfPackId,
        uint256[] memory _materialsIds
    ) public returns (bool) {
        for (uint256 index = 0; index < _materialsIds.length; index++) {
            addMaterialToWolfPack(_wolfPackId, _materialsIds[index]);
        }
        return true;
    }

    function addMultipleMaterialsAndWolfsToWolfPack(
        uint256 _wolfPackId,
        uint256[] memory _materialsIds,
        uint256[] memory _wolfsIds
    ) external returns (bool) {
        for (uint256 index = 0; index < _materialsIds.length; index++) {
            addMaterialToWolfPack(_wolfPackId, _materialsIds[index]);
        }

        for (uint256 index = 0; index < _wolfsIds.length; index++) {
            addWolfToWolfPack(_wolfPackId, _wolfsIds[index]);
        }

        return true;
    }

    function destroyWolfPack(uint256 _wolfPackId) external returns (bool) {
        require(ownerOf(_wolfPackId) == msg.sender, "WolfPack property failed"); // WolfPack must be property of msg.sender

        uint256 initialLife = calculateInitialWolfPackLife(_wolfPackId);
        require(
            wolfPackLife[_wolfPackId] >= initialLife,
            "Life is less than initial"
        );

        uint256 diffTs = DateTimeLibrary.diffHours(
            lastHunting[_wolfPackId],
            block.timestamp
        );
        require(diffTs >= 24, "Less than 24 hours from last hunting");

        // Delete used Wolfs from mapping
        uint256[] memory wolfsIdsInWolfPack = wolfsInWolfPack[_wolfPackId];
        for (uint256 index = 0; index < wolfsIdsInWolfPack.length; index++) {
            wolfsUsed[wolfsIdsInWolfPack[index]] = false;
        }

        // Delete array of WOLFs from mapping
        delete wolfsInWolfPack[_wolfPackId];

        // Delete used Materials from mapping
        uint256[] memory materialsIdsInWolfPack = materialsInWolfPack[
            _wolfPackId
        ];
        for (
            uint256 index = 0;
            index < materialsIdsInWolfPack.length;
            index++
        ) {
            materialsUsed[materialsIdsInWolfPack[index]] = false;
        }

        // Delete array of Materials from mapping
        delete materialsInWolfPack[_wolfPackId];

        wolfPackInPromo[_wolfPackId] = false;
        safeTransferFrom(msg.sender, rewardsPoolAddress, _wolfPackId);

        return true;
    }

    function buyEnergy(uint256 _wolfPackId, uint256 _amountCWOLF)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(ownerOf(_wolfPackId) == msg.sender, "Owner of WolfPack failed");

        uint256 energyCommissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(energyCommission);
        require(msg.value >= energyCommissionInBNB, "Not enough value");
        payable(commissionWalletAddress).transfer(energyCommissionInBNB);
        payable(msg.sender).transfer(msg.value - energyCommissionInBNB);

        require(
            IERC20Upgradeable(CWOLFContractAddress).allowance(
                msg.sender,
                address(this)
            ) >= _amountCWOLF,
            "Not enough allowance"
        );

        uint256 _amountInDollar = (Variables(VariablesContractAddress)
            .priceCWOLF() * _amountCWOLF) / 1e18;

        IERC20Upgradeable(CWOLFContractAddress).transferFrom(
            msg.sender,
            rewardsPoolAddress,
            _amountCWOLF
        );

        wolfPackEnergy[_wolfPackId] =
            wolfPackEnergy[_wolfPackId] +
            _amountInDollar;
        emit IncreasedEnergy(_wolfPackId, _amountInDollar);
    }

    function increaseEnergy(uint256 _wolfPackId, uint256 _amountToIncrease)
        external
    {
        require(
            msg.sender == claimContractAddress,
            "Caller is not Claim contract"
        );
        wolfPackEnergy[_wolfPackId] =
            wolfPackEnergy[_wolfPackId] +
            _amountToIncrease;
        emit IncreasedEnergy(_wolfPackId, _amountToIncrease);
    }

    function decreaseEnergy(uint256 _wolfPackId, uint256 _amountToDecrease)
        external
    {
        require(
            msg.sender == HuntingNFTContractAddress,
            "Caller is not Hunting contract"
        );
        require(
            wolfPackEnergy[_wolfPackId] >= _amountToDecrease,
            "Amount to decrease greater than energy"
        );
        wolfPackEnergy[_wolfPackId] =
            wolfPackEnergy[_wolfPackId] -
            _amountToDecrease;
        emit DecreasedEnergy(_wolfPackId, _amountToDecrease);
    }

    function decreaseWolfPackLife(
        uint256 _wolfPackId,
        uint256 _amountToDecrease
    ) external {
        require(
            msg.sender == HuntingNFTContractAddress,
            "Caller is not Hunting contract"
        );
        if (wolfPackLife[_wolfPackId] > _amountToDecrease) {
            wolfPackLife[_wolfPackId] =
                wolfPackLife[_wolfPackId] -
                _amountToDecrease;
            emit DecreasedLife(_wolfPackId, _amountToDecrease);
        } else {
            wolfPackLife[_wolfPackId] = 0;
            emit DecreasedLife(_wolfPackId, 0);
        }
    }

    function increaseWolfPackLife(
        uint256 _wolfPackId,
        uint256 _amountToIncrease
    ) external {
        require(
            msg.sender == inventoryContractAddress,
            "Caller is not Inventory contract"
        );
        wolfPackLife[_wolfPackId] =
            wolfPackLife[_wolfPackId] +
            _amountToIncrease;
        emit IncreasedLife(_wolfPackId, _amountToIncrease);
    }

    function setDaysOfPromo(uint256 _newDaysOfPromo)
        external
        onlyOwner
        returns (bool)
    {
        daysOfPromo = _newDaysOfPromo;
        return true;
    }

    function activateDeactivatePromo() external onlyOwner returns (bool) {
        isPromoActive = !isPromoActive;
        dateLastPromoActivation = dateLastPromoActivation == 0
            ? block.timestamp
            : 0;
        return true;
    }

    function setPromoStatusForWolfPack(uint256 _wolfPackId, bool _status)
        external
        returns (bool)
    {
        require(
            msg.sender == owner() || msg.sender == HuntingNFTContractAddress
        );
        wolfPackInPromo[_wolfPackId] = _status;
        return true;
    }

    function checkWolfPackStatusPromo(uint256 _wolfPackId)
        external
        view
        returns (bool)
    {
        return wolfPackInPromo[_wolfPackId];
    }

    // Checks the status of the wolfpack life: > 0 is alive and true, otherwise dead and false
    function checkWolfPackStatusDeadOrAlive(uint256 _wolfPackId)
        external
        view
        returns (bool)
    {
        return wolfPackLife[_wolfPackId] > 0;
    }

    function buyWolfPackLink(uint256 _wolfPackId, uint256 _amountOfDays)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        require(ownerOf(_wolfPackId) == msg.sender, "Owner of WolfPack failed");
        require(
            configurationLinkDays[_amountOfDays] == true,
            "Error: Amount of days incorrect"
        );

        uint256 linkCommissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(linkCommission);
        require(msg.value >= linkCommissionInBNB, "Not enough value");
        payable(commissionWalletAddress).transfer(linkCommissionInBNB);
        payable(msg.sender).transfer(msg.value - linkCommissionInBNB);

        uint256 totalDollars = ((_amountOfDays * 10**18) * 5000) / 10000;
        uint256 amountInCWOLF = Variables(VariablesContractAddress)
            .getDollarsInCWOLF(
                totalDollars * wolfsInWolfPack[_wolfPackId].length
            );

        require(
            IERC20Upgradeable(CWOLFContractAddress).allowance(
                msg.sender,
                address(this)
            ) >= amountInCWOLF,
            "Not enough allowance"
        );

        IERC20Upgradeable(CWOLFContractAddress).transferFrom(
            msg.sender,
            rewardsPoolAddress,
            amountInCWOLF
        );

        wolfPackLinkDays[_wolfPackId] =
            wolfPackLinkDays[_wolfPackId] +
            _amountOfDays;

        emit IncreasedLink(_wolfPackId, wolfPackLinkDays[_wolfPackId]);
    }

    function decreaseWolfPackLink(
        uint256 _wolfPackId,
        uint256 _amountToDecrease
    ) public {
        require(
            msg.sender == HuntingNFTContractAddress,
            "Caller is not Hunting contract"
        );
        wolfPackLinkDays[_wolfPackId] =
            wolfPackLinkDays[_wolfPackId] -
            _amountToDecrease;
        emit DecreasedLink(_wolfPackId, _amountToDecrease);
    }

    function increaseWolfPackLink(
        uint256 _wolfPackId,
        uint256 _amountToIncrease
    ) public {
        require(
            msg.sender == claimContractAddress,
            "Caller is not Claim contract"
        );
        wolfPackLinkDays[_wolfPackId] =
            wolfPackLinkDays[_wolfPackId] +
            _amountToIncrease;
        emit IncreasedLink(_wolfPackId, _amountToIncrease);
    }

    function getWolfPackLength(uint256 _wolfPackId)
        public
        view
        returns (uint256)
    {
        return wolfsInWolfPack[_wolfPackId].length;
    }

    function checkWolfPackLink(uint256 _wolfPackId) public view returns (bool) {
        return wolfPackLinkDays[_wolfPackId] > 0;
    }

    function calculateGasAndCommissions()
        public
        view
        returns (uint256[3] memory)
    {
        uint256 commissionInBNB = Variables(VariablesContractAddress)
            .getDollarsInBNB(commissionInDollar);

        uint256[3] memory commissions;
        commissions[0] = gasToMinter;
        commissions[1] = commissionInBNB;
        commissions[2] = gasToMinter + commissionInBNB;
        return commissions;
    }

    function getTotalMaterialsInWolfPack(uint256 _wolfPackId)
        public
        view
        returns (uint256)
    {
        return materialsInWolfPack[_wolfPackId].length;
    }

    function getTotalSlotsAvailableInWolfPack(uint256 _wolfPackId)
        public
        view
        returns (uint256)
    {
        uint256[] memory wolfPack = materialsInWolfPack[_wolfPackId];

        // Capacity of WolfPack
        uint256 totalCapacity;
        for (uint256 index = 0; index < wolfPack.length; index++) {
            uint256 wolfTokenId = wolfPack[index];
            uint256 materialCapacity = MaterialsNFT(MaterialsNFTContractAddress)
                .slots(wolfTokenId);
            totalCapacity = totalCapacity + materialCapacity;
        }

        return totalCapacity - wolfsInWolfPack[_wolfPackId].length;
    }

    function getTotalSlotsInWolfPack(uint256 _wolfPackId)
        public
        view
        returns (uint256)
    {
        uint256[] memory wolfPack = materialsInWolfPack[_wolfPackId];

        // Capacity of WolfPack
        uint256 totalCapacity;
        for (uint256 index = 0; index < wolfPack.length; index++) {
            uint256 wolfTokenId = wolfPack[index];
            uint256 materialCapacity = MaterialsNFT(MaterialsNFTContractAddress)
                .slots(wolfTokenId);
            totalCapacity = totalCapacity + materialCapacity;
        }

        return totalCapacity;
    }

    function pointsOfWolfPack(uint256 _wolfPackId)
        external
        view
        returns (uint256)
    {
        require(_exists(_wolfPackId), "WolfPack not exist"); // WolfPack must exist

        uint256[] memory wolfsIdsInWolfPack = wolfsInWolfPack[_wolfPackId];

        uint256 totalPoints;
        for (uint256 index = 0; index < wolfsIdsInWolfPack.length; index++) {
            totalPoints =
                totalPoints +
                WolfsNFT(WolfsNFTContractAddress).getWolfProperties(
                    wolfsIdsInWolfPack[index]
                )[3];
        }

        return totalPoints;
    }

    function setLastHunting(uint256 _wolfPackId, uint256 _lastHunting)
        external
        returns (bool)
    {
        // Restricted access only for Hunting Contract
        require(msg.sender == HuntingNFTContractAddress);
        lastHunting[_wolfPackId] = _lastHunting;
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

    /*
    function changeRewardsPoolAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        rewardsPoolAddress = _newAddress;
        return true;
    }

    function changeAddWolfOrMaterialCWOLFInDollar(uint256 _newPrice)
        external
        onlyOwner
        returns (bool)
    {
        addWolfOrMaterialCWOLFInDollar = _newPrice;
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

    function changeWolfsNFTContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        WolfsNFTContractAddress = _newAddress;
        return true;
    }

    function changeMaterialsNFTContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        MaterialsNFTContractAddress = _newAddress;
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

    function changeCommissionInDollar(uint256 _newValue)
        external
        onlyOwner
        returns (bool)
    {
        commissionInDollar = _newValue;
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

    function changeHuntingNFTContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        HuntingNFTContractAddress = _newAddress;
        return true;
    }

    function changeLinkAndEnergyCommission(
        uint256 _newLinkCommission,
        uint256 _newEnergyCommission
    ) external onlyOwner returns (bool) {
        linkCommission = _newLinkCommission;
        energyCommission = _newEnergyCommission;
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

    function changeInventoryContractAddress(address _newAddress)
        external
        onlyOwner
        returns (bool)
    {
        inventoryContractAddress = _newAddress;
        return true;
    }
    */

    function getConfigurationLinkDays(uint256 _amountOfDays)
        external
        view
        returns (bool)
    {
        return configurationLinkDays[_amountOfDays];
    }

    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(_from, _to, _tokenId);

        if (
            _from != address(0) &&
            _to != address(0) &&
            _to != rewardsPoolAddress &&
            msg.sender != marketPlaceAddress
        ) {
            revert("Only CW MarketPlace allowed");
        }
    }
}
