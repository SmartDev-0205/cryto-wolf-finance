const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const formatEther = ethers.utils.formatEther;
const keccak256 = require('keccak256')
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const json2csvParser = new Parser({ delimiter: '\t' });

const { BN, constants, expectEvent, expectRevert, time, send, snapshot, restore } = require('@openzeppelin/test-helpers');

let WolfsNFT;
let WolfsNFTDeployed;
let MaterialsNFT;
let MaterialsNFTDeployed;
let WolfPacksNFT;
let WolfPacksNFTDeployed;
let Variables;
let VariablesDeployed;
let Hunting;
let HuntingNFTDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;
let auxWallet;
let aux2Wallet;

beforeEach(async function () {
    WolfsNFT = await hre.deployments.get('WolfsNFT');
    WolfsNFTDeployed = await ethers.getContractAt('WolfsNFT', WolfsNFT.address);
    MaterialsNFT = await hre.deployments.get('MaterialsNFT');
    MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);
    WolfPacksNFT = await hre.deployments.get('WolfPacksNFT');
    WolfPacksNFTDeployed = await ethers.getContractAt('WolfPacksNFT', WolfPacksNFT.address);
    Variables = await hre.deployments.get('Variables');
    VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);
    CWolfToken = await hre.deployments.get('CWolfToken');
    CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);
    HuntingNFT = await hre.deployments.get('HuntingNFT');
    HuntingNFTDeployed = await ethers.getContractAt('HuntingNFT', HuntingNFT.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet] = await ethers.getSigners();
});

describe("WolfPacksNFT_Proxy", function () {

    it("Should take snapshot", async function () {
        initialSnapshot = await snapshot();
        expect(true);
    });

    describe("Main functionality", function () {

        it("Should be initialized", async function () {
            expect(await WolfPacksNFTDeployed.isInitialized()).to.equal(true);
            expect(await WolfPacksNFTDeployed.owner()).to.equal(deployerWallet.address);
        });

        it("Should give allowance from AUX to contracts", async function () {
            await CWolfTokenDeployed.connect(auxWallet).approve(WolfsNFTDeployed.address, '1000000000000000000000000');
            await CWolfTokenDeployed.connect(auxWallet).approve(MaterialsNFTDeployed.address, '1000000000000000000000000');
            await CWolfTokenDeployed.connect(auxWallet).approve(WolfPacksNFTDeployed.address, '1000000000000000000000000');
        });

        it("Should mint 10 WolfsNFT, Mint 10 MaterialsNFT", async function () {
            await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(10, { value: "1000000000000000000" });
            await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(10, { value: "1000000000000000000" });
        });


        it("Should generate values for WolfsNFT and MaterialsNFT", async function () {
            const arrayIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            const randomUUID = uuidv4();
            const seed = (keccak256(randomUUID)).toString('hex');
            await WolfsNFTDeployed.connect(minterWallet)
                .generateValuesWolf(arrayIds, '0x' + seed);
            await MaterialsNFTDeployed.connect(minterWallet)
                .generateValuesMaterials(arrayIds, '0x' + seed);
        });


        it("Should create WolfPack and put all in it", async function () {
            const arrayIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            // await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "1000000000000000000" });
            await WolfPacksNFTDeployed.connect(auxWallet).createWolfPackAndAddWolfsAndMaterials(arrayIds, arrayIds, { value: "1000000000000000000" });
        });


        it("Should hunt first animal", async function () {

            const wolfProperties1 = await WolfsNFTDeployed.connect(auxWallet).getWolfProperties(1);
            console.log('wolfProperties1: ', wolfProperties1);

            const wolfProperties2 = await WolfsNFTDeployed.connect(auxWallet).getWolfProperties(2);
            console.log('wolfProperties2: ', wolfProperties2);

            const wolfProperties3 = await WolfsNFTDeployed.connect(auxWallet).getWolfProperties(3);
            console.log('wolfProperties3: ', wolfProperties3);

            // const wolfsInWolfPack = await WolfPacksNFTDeployed.connect(auxWallet).wolfsInWolfPack(1,0);
            // console.log('wolfsInWolfPack: ', wolfsInWolfPack);


            // Checkear puntos de la manada
            console.log(await WolfPacksNFTDeployed.walletOfOwner(auxWallet.address));
            const pointsOfWolfPack = await WolfPacksNFTDeployed.connect(auxWallet).pointsOfWolfPack(1);
            console.log('pointsOfWolfPack: ', pointsOfWolfPack.toString());

            console.log('animals: ', await HuntingNFTDeployed.animalsPoints(0))

            // Atacar primer animal
            await WolfPacksNFTDeployed.connect(auxWallet).buyWolfPackLink(1, 14);
            await HuntingNFTDeployed.connect(auxWallet).mintWithCWOLF(1, 0, { value: "1000000000000000000" });

        });

        it("Attack", async function () {
            const randomUUID = uuidv4();
            const seed = (keccak256(randomUUID)).toString('hex');
            await HuntingNFTDeployed.generateResult([1], '0x' + seed);
        });

        it.only("Result", async function () {
            console.log('dateOfHunting: ', (await HuntingNFTDeployed.dateOfHunting(1)).toString());
            console.log('rewards: ', (await HuntingNFTDeployed.rewards(1)).toString());
            console.log('isGenerated: ', (await HuntingNFTDeployed.isGenerated(1)).toString());


        });


    });

    it("Should restore snapshot", async function () {
        // await initialSnapshot.restore();
        expect(true);
    });
})