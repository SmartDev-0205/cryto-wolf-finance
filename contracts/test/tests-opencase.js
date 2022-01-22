const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const formatEther = ethers.utils.formatEther;
const keccak256 = require('keccak256')
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const json2csvParser = new Parser({ delimiter: '\t' });

let WolfsNFT;
let WolfsNFTDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;
let auxWallet;
let aux2Wallet;

const attackDefensePoints = { 0: [20, 50], 1: [50, 76], 2: [76, 114], 3: [114, 144], 4: [144, 185], 5: [185, 222] }

beforeEach(async function () {
    WolfsNFT = await hre.deployments.get('WolfsNFT');
    WolfsNFTDeployed = await ethers.getContractAt('WolfsNFT', WolfsNFT.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet] = await ethers.getSigners();

    MaterialsNFT = await hre.deployments.get('MaterialsNFT');
    MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet] = await ethers.getSigners();
});

describe("WolfsNFT_Proxy", function () {
    it("Should mint a WOLF (only NFT, no data)", async function () {
        const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
        await expect(WolfsNFTDeployed.mintWithCWOLF(1, { value: "10000000000000000" }))
            .to.emit(WolfsNFTDeployed, 'MintedNFT')
            .withArgs(deployerWallet.address, (totalSupply).toString());
    });
    
    it("Should generate WOLF info with minterWallet", async function () {
        const arrayTokens = [];
        const arraySeeds = [];
        for (let i = 2; i <= 2; i += 1) {
            const randomUUID = uuidv4();
            const seed = (keccak256(randomUUID)).toString('hex');

            arraySeeds.push('0x' + seed);
            arrayTokens.push('0x' + i.toString(16));            
        }
        await WolfsNFTDeployed.connect(minterWallet)
                .generateValuesWolf(arrayTokens, arraySeeds);
    });
});
return;
describe("MaterialsNFT_Proxy", function () {
    it("Should generate WOLF info with minterWallet", async function () {
        for (let i = 3; i <= 10; i += 1) {
            const randomUUID = uuidv4();
            const seed = (keccak256(randomUUID)).toString('hex');
            await expect(MaterialsNFTDeployed.connect(minterWallet)
                .generateValuesMaterials('0x' + i.toString(16), '0x' + seed)).to.be.revertedWith("Not allowed");
        }
    });
});

return;
