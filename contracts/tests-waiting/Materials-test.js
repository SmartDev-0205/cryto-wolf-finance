const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const formatEther = ethers.utils.formatEther;
const keccak256 = require('keccak256')
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const json2csvParser = new Parser({ delimiter: '\t' });

let WolfsNFTDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;

const test1Wallet = '0xeB87be771498F7244F1bBf8578aeF6405cf3b6fa';

beforeEach(async function () {
    CavesNFT = await hre.deployments.get('CavesNFT');
    CavesNFTDeployed = await ethers.getContractAt('CavesNFT', CavesNFT.address);
    [deployerWallet, minterWallet, rewardsWallet] = await ethers.getSigners();
});

describe("CavesNFT_Proxy", function () {

    it("Should be initialized", async function () {
        expect(await CavesNFTDeployed.isInitialized()).to.equal(true);
        expect(await CavesNFTDeployed.owner()).to.equal(deployerWallet.address);
    });

    it("Should first CAVE minted", async function () {
        const totalSupply = (await CavesNFTDeployed.totalSupply()).toNumber();
        expect(await totalSupply).to.greaterThan(0);
    });

    it("Should mint a CAVE (only NFT, no data)", async function () {
        const totalSupply = (await CavesNFTDeployed.totalSupply()).toNumber();
        await expect(CavesNFTDeployed.mintWithCWOLF(1, { value: "10000000000000000" }))
            .to.emit(CavesNFTDeployed, 'MintedNFT')
            .withArgs(deployerWallet.address, (totalSupply).toString());
    });

    it("Should generate CAVE info with minterWallet", async function () {
        const randomUUID = uuidv4();
        const seed = (keccak256(randomUUID)).toString('hex');
        await WolfsNFTDeployed.connect(minterWallet)
            .generateValuesWolf(1, '0x' + seed);
        const caveGenerated = await WolfsNFTDeployed.WolfProperties(1);
        /*
        console.log('breed: ', wolfGenerated.breed);
        console.log('gender: ', wolfGenerated.gender);
        console.log('level: ', wolfGenerated.level);
        console.log('attack: ', (wolfGenerated.attack).toNumber());
        console.log('defense: ', (wolfGenerated.defense).toNumber());
        */
    });

    /*
    it("Should generate csv of 1000 wolfs to test stats", async function () {

        const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
        const numberToGenerate = 1;

        for (let index = 0; index < numberToGenerate; index++) {
            await WolfsNFTDeployed.mintWithCWOLF(1, { value: "10000000000000000" });
        }

        let results = [];
        for (let index = 0; index < numberToGenerate; index++) {
            let seed = (keccak256(uuidv4())).toString('hex');
            await WolfsNFTDeployed.connect(minterWallet)
                .generateValuesWolf(totalSupply, '0x' + seed);

            const wolfGenerated = await WolfsNFTDeployed.WolfProperties(totalSupply);

            const wolf = {
                breed: wolfGenerated.breed,
                gender: wolfGenerated.gender,
                level: wolfGenerated.level,
                attack: (wolfGenerated.attack).toNumber(),
                defense: (wolfGenerated.defense).toNumber()
            }

            results.push(wolf);

        }

        // console.log(results);
        const totalSupplyEnd = (await WolfsNFTDeployed.totalSupply()).toNumber();
        // console.log('totalSupplyEnd: ', totalSupplyEnd);
        const tsv = json2csvParser.parse(results);
        // EXPORTAR A FICHERO fileWrite
        // console.log(tsv);

    });
    */



    // Pause contract
    it("Should pause contract", async function () {
        await expect(CavesNFTDeployed.pauseContract())
            .to.emit(CavesNFTDeployed, 'Paused')
            .withArgs(deployerWallet.address);
    });

    it("Should not mint", async function () {
        await expect(CavesNFTDeployed.mintWithCWOLF(1, { value: "100000000000000000" }))
            .to.be.revertedWith("Pausable: paused");
    });

    // Unpause contract
    it("Should unpause contract", async function () {
        await expect(CavesNFTDeployed.unpauseContract())
            .to.emit(CavesNFTDeployed, 'Unpaused')
            .withArgs(deployerWallet.address);
    });

    it("Should mint", async function () {
        expect(await CavesNFTDeployed.mintWithCWOLF(1, { value: "100000000000000000" }))
    });

    


    // Test de modificación de parámetros
    /*
    address public rewardsPoolAddress;
    uint256 public boxPriceCWOLF;
    uint256 public gasToMinter;
    address public CWOLFContractAddress;
    address public CavesNFTContractAddress;
    address public wolfsNFTHelperContractAddress;
    address public minterWalletAddress;
    */


});
