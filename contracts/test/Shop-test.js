const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const formatEther = ethers.utils.formatEther;
const keccak256 = require('keccak256')
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const json2csvParser = new Parser({ delimiter: '\t' });
const { balance, BN, constants, expectEvent } = require('@openzeppelin/test-helpers');
const fs = require('fs').promises;

let ShopNFT;
let ShopNFTDeployed;
let Variables;
let VariablesDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;
let auxWallet;
let aux2Wallet;

const attackDefensePoints = { 0: [20, 50], 1: [50, 76], 2: [76, 114], 3: [114, 144], 4: [144, 185], 5: [185, 222] }

beforeEach(async function () {
    ShopNFT = await hre.deployments.get('ShopNFT');
    ShopNFTDeployed = await ethers.getContractAt('ShopNFT', ShopNFT.address);
    Variables = await hre.deployments.get('Variables');
    VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);
    CWolfToken = await hre.deployments.get('CWolfToken');
    CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet] = await ethers.getSigners();
});

describe("ShopNFT_Proxy", function () {

    it("Should be initialized", async function () {
        expect(await ShopNFTDeployed.isInitialized()).to.equal(true);
        expect(await ShopNFTDeployed.owner()).to.equal(deployerWallet.address);
    });

    it("Should first element minted", async function () {
        const totalSupply = (await ShopNFTDeployed.totalSupply()).toNumber();
        expect(await totalSupply).to.greaterThan(0);
    });

});


