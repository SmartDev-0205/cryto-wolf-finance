const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const formatEther = ethers.utils.formatEther;
const keccak256 = require('keccak256')
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const json2csvParser = new Parser({ delimiter: '\t' });
const { balance, BN, constants, expectEvent } = require('@openzeppelin/test-helpers');

/*
let NFT;
let WolfsNFTDeployed;
let Variables;
let VariablesDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;
let auxWallet;^
let aux2Wallet;
*/

beforeEach(async function () {

    /*
    WolfsNFT = await hre.deployments.get('WolfsNFT');
    WolfsNFTDeployed = await ethers.getContractAt('WolfsNFT', WolfsNFT.address);
    Variables = await hre.deployments.get('Variables');
    VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);
    CWolfToken = await hre.deployments.get('CWolfToken');
    CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);
    */
    Variables = await hre.deployments.get('Variables');
    VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet] = await ethers.getSigners();
});

describe("Variables", function () {

    it("Should be initialized", async function () {
        expect(await VariablesDeployed.isInitialized()).to.equal(true);
        expect(await VariablesDeployed.owner()).to.equal(deployerWallet.address);
    });

    it("Should get priceCWOLF", async function () {
        const call = await VariablesDeployed.priceCWOLF();
        expect(call).to.gt(0);
        console.log('priceCWOLF: ', call.toString());
    });

    it("Should get priceBNB", async function () {
        const call = await VariablesDeployed.priceBNB();
        expect(call).to.gt(0);
        console.log('priceBNB: ', call.toString());
    });



    it("Should get getDollarsInCWOLF", async function () {
        const call = await VariablesDeployed.getDollarsInCWOLF("500000000000000000")
        expect(call).to.gt(0);
        console.log('getDollarsInCWOLF: ', call.toString());
    });

    it("Should get getDollarsInBNB", async function () {
        const call = await VariablesDeployed.getDollarsInBNB("500000000000000000")
        expect(call).to.gt(0);
        console.log('getDollarsInBNB: ', call.toString());
    });

    it("Should setCWolfPriceInDollars", async function () {
        const priceBefore = await VariablesDeployed.priceCWOLF();
        await VariablesDeployed.setCWolfPriceInDollars(9);
        expect(await VariablesDeployed.priceCWOLF()).to.equal(9);
        await VariablesDeployed.setCWolfPriceInDollars(priceBefore);
        expect(await VariablesDeployed.priceCWOLF()).to.equal(priceBefore);
    });

    it("Should setBNBPriceInDollars", async function () {
        const priceBefore = await VariablesDeployed.priceCWOLF();
        await VariablesDeployed.setBNBPriceInDollars("700000000000000000000");
        expect(await VariablesDeployed.priceBNB()).to.equal("700000000000000000000");
        await VariablesDeployed.setBNBPriceInDollars(priceBefore);
        expect(await VariablesDeployed.priceBNB()).to.equal(priceBefore);
    });

    it("Should setCWOLFAndBNBPriceInDollars", async function () {
        const priceCWOLFBefore = await await VariablesDeployed.priceCWOLF();
        const priceBNBBefore = await await VariablesDeployed.priceBNB();
        await VariablesDeployed.setCWOLFAndBNBPriceInDollars(7, 8);
        expect(await VariablesDeployed.priceCWOLF()).to.equal(7);
        expect(await VariablesDeployed.priceBNB()).to.equal(8);
        await VariablesDeployed.setCWOLFAndBNBPriceInDollars(priceCWOLFBefore, priceBNBBefore);
        expect(await VariablesDeployed.priceCWOLF()).to.equal(priceCWOLFBefore);
        expect(await VariablesDeployed.priceBNB()).to.equal(priceBNBBefore);
    });

    it('Should change minterWalletAddress', async function () {
        expect(await VariablesDeployed.minterWalletAddress()).to.equal(minterWallet.address);
        await VariablesDeployed.changeAddressMinterWallet(auxWallet.address);
        expect(await VariablesDeployed.minterWalletAddress()).to.equal(auxWallet.address);
        await VariablesDeployed.changeAddressMinterWallet(minterWallet.address);
    });

});


