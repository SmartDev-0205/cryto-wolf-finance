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

contract ConsumibleNFTHelper is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using AddressUpgradeable for address;
    using StringsUpgradeable for uint256;

    enum Type {
        Potion,
        Accessory
    }

    enum Potion {
        Health,
        Shield,
        Revive,
        DobleAttack
    }

    enum Health {
        HP2K,
        HP1K,
        HP500,
        HP200,
        P50,
        P20,
        P10,
        P5
    }

    enum Shield {
        SH2P,
        SH5P,
        SH15P
    }

    enum Revive {
        RV20P
    }

    enum DobleAttack {
        DBATTCK
    }

    enum Accessories {
        MISC,
        ATTACK,
        DEFENSE
    }

    enum Misc {
        GUARDIAN,
        ELF
    }

    enum Attack {
        CLAW100P,
        CLAW300POINTS,
        CLAW100POINTS
    }

    enum Defense {
        ARMOR30P,
        ARMOR10P,
        ARMOR4P
    }
    /*

    # TYPE OBJECT: POTION OR ACCESORY
    POTION: 0
    ACCESSORY: 1

    # HEALTH POTION CLASS
    Health:      0
    Shield:      1
    Revive:      2
    DobleAttack: 3 

    # HEALTH POTION OBJECT
    2000 HP: 0
    1000 HP: 1
     500 HP: 2
     200 HP: 3
        50%: 4
        20%: 5
        10%: 6
         5%: 7

    # SHIELD POTION OBJECT
         2%: 0
         5%: 1
        15%: 2
    
    # REVIVE POTION
        20%: 0

    # DOUBLE ATTACK POTION
        2 HUNTS: 0
    

    # ACCESORIES CLASS
        MISC: 0
        ATTACK: 1
        DEFENSE: 2

    # ACCESSORY MISC
        GUARDIAN ANGEL: 0
        LUCKY ELF: 1

    # ACCESORY ATTACK
        CLAW ATTACK 15%: 0
        CLAW ATTACK +300: 1
        CLAW ATTACK +100: 2

    # ACCESSORY DEFENSE
        DEFENSE ARMOR 30%: 0
        DEFENSE ARMOR 10%: 1
        DEFENSE ARMOR  4%: 2
    

    */

    bool public isInitialized;

    uint256[] private elementsPercentages;

    constructor() initializer {}

    function initialize() public initializer {
        __Ownable_init();
        isInitialized = true;
        elementsPercentages = [
            10,
            60,
            70,
            501,
            505,
            515,
            535,
            575,
            600,
            650,
            750,
            1000,
            1200,
            2000,
            4000,
            4200,
            5000,
            7000,
            7200,
            8000,
            10000
        ];
    }

    function generateElement(bytes32 _seed)
        external
        view
        returns (
            uint256 typeGenerated,
            uint256 classGenerated,
            uint256 objectGenerated,
            uint256 valueGenerated
        )
    {
        uint256 randomNumber = Random.randomMinMax(
            keccak256(abi.encodePacked(_seed, uint256(20000))),
            1,
            10000
        );
        if (randomNumber <= elementsPercentages[0]) {
            return (Type.Potion, Potion.Revive, Revive.RV20P, 2000);
        } else if (
            randomNumber > elementsPercentages[0] &&
            randomNumber <= elementsPercentages[1]
        ) {
            return (Type.Potion, Potion.DobleAttack, DobleAttack.DBATTCK, 2);
        } else if (
            randomNumber > elementsPercentages[1] &&
            randomNumber <= elementsPercentages[2]
        ) {
            return (Type.Accessory, Accessories.MISC, Misc.GUARDIAN, 2000);
        } else if (
            randomNumber > elementsPercentages[2] &&
            randomNumber <= elementsPercentages[3]
        ) {
            return (Type.Accessory, Accessories.MISC, Misc.ELF, 500);
        } else if (
            randomNumber > elementsPercentages[3] &&
            randomNumber <= elementsPercentages[4]
        ) {
            return (Type.Potion, Potion.Health, Health.P50, 5000);
        } else if (
            randomNumber > elementsPercentages[4] &&
            randomNumber <= elementsPercentages[5]
        ) {
            return (Type.Potion, Potion.Health, Health.P20, 2000);
        } else if (
            randomNumber > elementsPercentages[5] &&
            randomNumber <= elementsPercentages[6]
        ) {
            return (Type.Potion, Potion.Health, Health.P10, 1000);
        } else if (
            randomNumber > elementsPercentages[6] &&
            randomNumber <= elementsPercentages[7]
        ) {
            return (Type.Potion, Potion.Health, Health.P5, 500);
        } else if (
            randomNumber > elementsPercentages[7] &&
            randomNumber <= elementsPercentages[8]
        ) {
            return (Type.Potion, Potion.Health, Health.HP2K, 2000);
        } else if (
            randomNumber > elementsPercentages[8] &&
            randomNumber <= elementsPercentages[9]
        ) {
            return (Type.Potion, Potion.Health, Health.HP1K, 1000);
        } else if (
            randomNumber > elementsPercentages[9] &&
            randomNumber <= elementsPercentages[10]
        ) {
            return (Type.Potion, Potion.Health, Health.HP500, 500);
        } else if (
            randomNumber > elementsPercentages[10] &&
            randomNumber <= elementsPercentages[11]
        ) {
            return (Type.Potion, Potion.Health, Health.HP200, 200);
        } else if (
            randomNumber > elementsPercentages[11] &&
            randomNumber <= elementsPercentages[12]
        ) {
            return (Type.Potion, Potion.Shield, Shield.SH2P, 200);
        } else if (
            randomNumber > elementsPercentages[12] &&
            randomNumber <= elementsPercentages[13]
        ) {
            return (Type.Potion, Potion.Shield, Shield.SH5P, 500);
        } else if (
            randomNumber > elementsPercentages[13] &&
            randomNumber <= elementsPercentages[14]
        ) {
            return (Type.Potion, Potion.Shield, Shield.SH15P, 1500);
        } else if (
            randomNumber > elementsPercentages[14] &&
            randomNumber <= elementsPercentages[15]
        ) {
            return (Type.Accessory, Accessories.ATTACK, Attack.CLAW100P, 1500);
        } else if (
            randomNumber > elementsPercentages[15] &&
            randomNumber <= elementsPercentages[16]
        ) {
            return (
                Type.Accessory,
                Accessories.ATTACK,
                Attack.CLAW300POINTS,
                300
            );
        } else if (
            randomNumber > elementsPercentages[16] &&
            randomNumber <= elementsPercentages[17]
        ) {
            return (
                Type.Accessory,
                Accessories.ATTACK,
                Attack.CLAW100POINTS,
                100
            );
        } else if (
            randomNumber > elementsPercentages[17] &&
            randomNumber <= elementsPercentages[18]
        ) {
            return (
                Type.Accessory,
                Accessories.DEFENSE,
                Defense.ARMOR30P,
                3000
            );
        } else if (
            randomNumber > elementsPercentages[18] &&
            randomNumber <= elementsPercentages[19]
        ) {
            return (
                Type.Accessory,
                Accessories.DEFENSE,
                Defense.ARMOR10P,
                1000
            );
        } else if (
            randomNumber > elementsPercentages[19] &&
            randomNumber <= elementsPercentages[20]
        ) {
            return (Type.Accessory, Accessories.DEFENSE, Defense.ARMOR4P, 400);
        }
    }

    function generateHealthPotion(uint256 _object)
        public
        view
        returns (
            uint256 typeGenerated,
            uint256 classGenerated,
            uint256 objectGenerated,
            uint256 valueGenerated
        )
    {
        if (_object == Health.HP2K) {
            return (Type.Potion, Potion.Health, Health.HP2K, 2000);
        } else if (_object == Health.HP1K) {
            return (Type.Potion, Potion.Health, Health.HP1K, 1000);
        } else if (_object == Health.HP500) {
            return (Type.Potion, Potion.Health, Health.HP500, 500);
        } else if (_object == Health.HP200) {
            return (Type.Potion, Potion.Health, Health.HP200, 200);
        } else if (_object == Health.P50) {
            return (Type.Potion, Potion.Health, Health.P50, 5000);
        } else if (_object == Health.P20) {
            return (Type.Potion, Potion.Health, Health.P20, 2000);
        } else if (_object == Health.P10) {
            return (Type.Potion, Potion.Health, Health.P10, 1000);
        } else if (_object == Health.P5) {
            return (Type.Potion, Potion.Health, Health.P5, 500);
        }
    }
}
