/*
CRYPTOWOLF
Web: https://cryptowolf.finance
*/

// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "./Random.sol";

import "hardhat/console.sol";

contract WolfsNFTHelper is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;
    using StringsUpgradeable for uint256;

    /*

    # BREED
    LAND: 0
    WATER: 1
    ICE: 2
    FIRE: 3
    FOREST: 4
    AIR: 5
    ELECTRIC: 6
    LEGENDARY: 7


    # GENDER
    MALE: 0
    FEMALE: 1
    }

    # LEVEL 
    WOOD: 0
    BRONZE: 1
    SILVER: 2
    GOLD: 3
    PLATINUM: 4
    DIAMOND: 5

    */

    bool public isInitialized;
    uint256[] private breedPercentages;
    uint256[] private attackDefensePercentages;
    uint256[] private attackLevels;
    uint256[][] private attackDefenseLevels;

    constructor() initializer {}

    function initialize() public initializer {
        __Ownable_init();

        breedPercentages = [14, 14, 14, 14, 14, 14, 14, 2];
        attackDefensePercentages = [54, 24, 12, 6, 3, 1];

        attackDefenseLevels = [
            [20, 49],
            [50, 75],
            [76, 113],
            [114, 143],
            [144, 184],
            [185, 222]
        ];

        isInitialized = true;
    }

    function generateBreed(bytes32 _seed) internal view returns (uint256) {
        uint256 randomNumber = Random.randomMinMax(
            keccak256(abi.encodePacked(_seed, uint256(10000))),
            1,
            100
        );

        if (randomNumber <= breedPercentages[0]) {
            return 0;
        } else if (
            randomNumber > sumPercentages(1, breedPercentages) &&
            randomNumber <= sumPercentages(2, breedPercentages)
        ) {
            return 1;
        } else if (
            randomNumber > sumPercentages(2, breedPercentages) &&
            randomNumber <= sumPercentages(3, breedPercentages)
        ) {
            return 2;
        } else if (
            randomNumber > sumPercentages(3, breedPercentages) &&
            randomNumber <= sumPercentages(4, breedPercentages)
        ) {
            return 3;
        } else if (
            randomNumber > sumPercentages(4, breedPercentages) &&
            randomNumber <= sumPercentages(5, breedPercentages)
        ) {
            return 4;
        } else if (
            randomNumber > sumPercentages(5, breedPercentages) &&
            randomNumber <= sumPercentages(6, breedPercentages)
        ) {
            return 5;
        } else if (
            randomNumber > sumPercentages(6, breedPercentages) &&
            randomNumber <= sumPercentages(7, breedPercentages)
        ) {
            return 6;
        } else if (
            randomNumber > sumPercentages(7, breedPercentages) &&
            randomNumber <= sumPercentages(8, breedPercentages)
        ) {
            return 7;
        }
        return 0;
    }

    function generateGender(bytes32 _seed) internal pure returns (uint256) {
        uint256 randomNumber = Random.randomMinMax(
            keccak256(abi.encodePacked(_seed, uint256(20000))),
            0,
            1
        );

        if (randomNumber == 0) {
            return 0;
        } else {
            return 1;
        }
    }

    function generateLevels(bytes32 _seed)
        internal
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 randomNumber = Random.randomMinMax(_seed, 1, 100);

        bytes32 seed1 = _seed;
        bytes32 seed2 = keccak256(abi.encode(_seed));

        uint256 attack;
        uint256 defense;
        uint256 level;

        if (randomNumber <= attackDefensePercentages[0]) {
            attack = Random.randomMinMax(
                seed1,
                attackDefenseLevels[0][0],
                attackDefenseLevels[0][1]
            );
            defense = Random.randomMinMax(
                seed2,
                attackDefenseLevels[0][0],
                attackDefenseLevels[0][1]
            );
            level = 0;
        } else if (
            randomNumber > sumPercentages(1, attackDefensePercentages) &&
            randomNumber <= sumPercentages(2, attackDefensePercentages)
        ) {
            attack = Random.randomMinMax(
                seed1,
                attackDefenseLevels[1][0],
                attackDefenseLevels[1][1]
            );
            defense = Random.randomMinMax(
                seed2,
                attackDefenseLevels[1][0],
                attackDefenseLevels[1][1]
            );
            level = 1;
        } else if (
            randomNumber > sumPercentages(2, attackDefensePercentages) &&
            randomNumber <= sumPercentages(3, attackDefensePercentages)
        ) {
            attack = Random.randomMinMax(
                seed1,
                attackDefenseLevels[2][0],
                attackDefenseLevels[2][1]
            );
            defense = Random.randomMinMax(
                seed2,
                attackDefenseLevels[2][0],
                attackDefenseLevels[2][1]
            );
            level = 2;
        } else if (
            randomNumber > sumPercentages(3, attackDefensePercentages) &&
            randomNumber <= sumPercentages(4, attackDefensePercentages)
        ) {
            attack = Random.randomMinMax(
                seed1,
                attackDefenseLevels[3][0],
                attackDefenseLevels[3][1]
            );
            defense = Random.randomMinMax(
                seed2,
                attackDefenseLevels[3][0],
                attackDefenseLevels[3][1]
            );
            level = 3;
        } else if (
            randomNumber > sumPercentages(4, attackDefensePercentages) &&
            randomNumber <= sumPercentages(5, attackDefensePercentages)
        ) {
            attack = Random.randomMinMax(
                seed1,
                attackDefenseLevels[4][0],
                attackDefenseLevels[4][1]
            );
            defense = Random.randomMinMax(
                seed2,
                attackDefenseLevels[4][0],
                attackDefenseLevels[4][1]
            );
            level = 4;
        } else if (
            randomNumber > sumPercentages(5, attackDefensePercentages) &&
            randomNumber <= sumPercentages(6, attackDefensePercentages)
        ) {
            attack = Random.randomMinMax(
                seed1,
                attackDefenseLevels[5][0],
                attackDefenseLevels[5][1]
            );
            defense = Random.randomMinMax(
                seed2,
                attackDefenseLevels[5][0],
                attackDefenseLevels[5][1]
            );
            level = 5;
        }

        return (attack, defense, level);
    }

    function generateWolf(bytes32 _seed)
        external
        view
        returns (
            uint256 breed,
            uint256 gender,
            uint256 level,
            uint256 attack,
            uint256 defense
        )
    {
        uint256 breedGenerated = generateBreed(_seed);
        uint256 genderGenerated = generateGender(_seed);
        (
            uint256 attackGenerated,
            uint256 defenseGenerated,
            uint256 levelGenerated
        ) = generateLevels(_seed);

        return (
            breedGenerated,
            genderGenerated,
            levelGenerated,
            attackGenerated,
            defenseGenerated
        );
    }

    function sumPercentages(uint256 index, uint256[] memory percentages)
        internal
        pure
        returns (uint256)
    {
        uint256 result;
        for (uint256 i = 0; i < index; i++) {
            result = result + percentages[i];
        }
        return result;
    }

    function updateBreedPercentages(uint256[] memory _newPercentages)
        external
        onlyOwner
        returns (bool)
    {
        require(_newPercentages.length == 7, "Array length must have 8 items");

        uint256 sum;
        for (uint256 index = 0; index < _newPercentages.length; index++) {
            sum = sum + _newPercentages[index];
        }
        require(sum == 100, "Array sum must be 100");

        breedPercentages[0] = _newPercentages[0];
        breedPercentages[1] = _newPercentages[1];
        breedPercentages[2] = _newPercentages[2];
        breedPercentages[3] = _newPercentages[3];
        breedPercentages[4] = _newPercentages[4];
        breedPercentages[5] = _newPercentages[5];
        breedPercentages[6] = _newPercentages[6];
        breedPercentages[7] = _newPercentages[7];
        return true;
    }

    function updateAttackDefensePercentages(uint256[] memory _newPercentages)
        external
        onlyOwner
        returns (bool)
    {
        require(_newPercentages.length == 5, "Array length must have 6 items");

        uint256 sum;
        for (uint256 index = 0; index < _newPercentages.length; index++) {
            sum = sum + _newPercentages[index];
        }
        require(sum == 100, "Array sum must be 100");

        attackDefensePercentages[0] = _newPercentages[0];
        attackDefensePercentages[1] = _newPercentages[1];
        attackDefensePercentages[2] = _newPercentages[2];
        attackDefensePercentages[3] = _newPercentages[3];
        attackDefensePercentages[4] = _newPercentages[4];
        attackDefensePercentages[5] = _newPercentages[5];
        return true;
    }

    function updateAttackDefenseLevels(uint256[][] memory _newData)
        external
        onlyOwner
        returns (bool)
    {
        attackDefenseLevels[0] = _newData[0];
        attackDefenseLevels[1] = _newData[1];
        attackDefenseLevels[2] = _newData[2];
        attackDefenseLevels[3] = _newData[3];
        attackDefenseLevels[4] = _newData[4];
        attackDefenseLevels[5] = _newData[5];
        return true;
    }
}
