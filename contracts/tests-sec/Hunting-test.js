const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const formatEther = ethers.utils.formatEther;
const keccak256 = require('keccak256')
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const json2csvParser = new Parser({ delimiter: '\t' });

let Hunting;
let HuntingDeployed;
let WolfPacksNFT;
let WolfPacksNFTDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;
let auxWallet;
let aux2Wallet;

beforeEach(async function () {
    Hunting = await hre.deployments.get('HuntingNFT');
    HuntingDeployed = await ethers.getContractAt('HuntingNFT', WolfPacksNFT.address);
    WolfPacksNFT = await hre.deployments.get('WolfPacksNFT');
    WolfPacksNFTDeployed = await ethers.getContractAt('WolfPacksNFT', WolfPacksNFT.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet] = await ethers.getSigners();
});

describe('Hunting_Proxy', function () {

    describe('Test parameter modifications', function () {

        it('should change rewardsPoolAddress', async function () {
            expect(await HuntingDeployed.rewardsPoolAddress()).to.equal(rewardsWallet.address);
            await HuntingDeployed.changeRewardsPoolAddress(auxWallet.address);
            expect(await HuntingDeployed.rewardsPoolAddress()).to.equal(auxWallet.address);
            await HuntingDeployed.changeRewardsPoolAddress(rewardsWallet.address);
        });

        it('should change boxPriceCWOLF', async function () {
            const initialBoxPriceCWOLF = await HuntingDeployed.boxPriceCWOLF();
            expect(initialBoxPriceCWOLF).to.equal(0);
            await HuntingDeployed.changeBoxPriceCWOLF(1);
            expect(await HuntingDeployed.boxPriceCWOLF()).to.equal(1);
            await HuntingDeployed.changeBoxPriceCWOLF(initialBoxPriceCWOLF);
        });

        it('should change gasToMinter', async function () {
            const initialGasToMinter = await HuntingDeployed.gasToMinter();
            expect(initialGasToMinter).to.equal(1000000000000000);
            await HuntingDeployed.changeGasToMinter(500);
            expect(await HuntingDeployed.gasToMinter()).to.equal(500);
            await HuntingDeployed.changeGasToMinter(initialGasToMinter);
        });

        it('should change CWOLFContractAddress', async function () {
            const CWOLFContractAddress = await HuntingDeployed.CWOLFContractAddress();
            expect(CWOLFContractAddress).to.equal(CWOLFContractAddress);
            await HuntingDeployed.changeCWOLFContractAddress(auxWallet.address);
            expect(await HuntingDeployed.CWOLFContractAddress()).to.equal(auxWallet.address);
            await HuntingDeployed.changeCWOLFContractAddress(CWOLFContractAddress);
        });

        it('should change wolfsNFTContractAddress', async function () {
            const WolfsNFTContractAddress = await HuntingDeployed.WolfsNFTContractAddress();
            expect(WolfsNFTContractAddress).to.equal(WolfsNFTContractAddress);
            await HuntingDeployed.changeWolfsNFTContractAddress(auxWallet.address);
            expect(await HuntingDeployed.WolfsNFTContractAddress()).to.equal(auxWallet.address);
            await HuntingDeployed.changeWolfsNFTContractAddress(WolfsNFTContractAddress);
        });

        it('should change materialsNFTContractAddress', async function () {
            const MaterialsNFTContractAddress = await HuntingDeployed.MaterialsNFTContractAddress();
            expect(MaterialsNFTContractAddress).to.equal(MaterialsNFTContractAddress);
            await HuntingDeployed.changeMaterialsNFTContractAddress(auxWallet.address);
            expect(await HuntingDeployed.MaterialsNFTContractAddress()).to.equal(auxWallet.address);
            await HuntingDeployed.changeMaterialsNFTContractAddress(MaterialsNFTContractAddress);
        });

        it('should change minterWalletAddress', async function () {
            expect(await HuntingDeployed.minterWalletAddress()).to.equal(minterWallet.address);
            await HuntingDeployed.changeAddressMinterWallet(auxWallet.address);
            expect(await HuntingDeployed.minterWalletAddress()).to.equal(auxWallet.address);
            await HuntingDeployed.changeAddressMinterWallet(minterWallet.address);
        });
    });

});
