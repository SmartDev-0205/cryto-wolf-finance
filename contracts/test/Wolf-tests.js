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

let WolfsNFT;
let WolfsNFTDeployed;
let Variables;
let VariablesDeployed;
let WolfPacksNFTDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;
let auxWallet;
let aux2Wallet;

const attackDefensePoints = { 0: [20, 50], 1: [50, 76], 2: [76, 114], 3: [114, 144], 4: [144, 185], 5: [185, 222] }

beforeEach(async function () {
    WolfsNFT = await hre.deployments.get('WolfsNFT');
    WolfsNFTDeployed = await ethers.getContractAt('WolfsNFT', WolfsNFT.address);
    Variables = await hre.deployments.get('Variables');
    VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);
    CWolfToken = await hre.deployments.get('CWolfToken');
    CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);
    WolfPacksNFT = await hre.deployments.get('WolfPacksNFT');
    WolfPacksNFTDeployed = await ethers.getContractAt('WolfPacksNFT', WolfPacksNFT.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet] = await ethers.getSigners();
});

describe("WolfsNFT_Proxy", function () {

    it("Should be initialized", async function () {
        expect(await WolfsNFTDeployed.isInitialized()).to.equal(true);
        expect(await WolfsNFTDeployed.owner()).to.equal(deployerWallet.address);
    });

    it("Should first wolf minted", async function () {
        const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
        expect(await totalSupply).to.greaterThan(0);
    });

    it("Should give allowance from AUX to Contract", async function () {
        const amount = "100000000000000000000000000";
        await CWolfTokenDeployed.connect(auxWallet).approve(WolfsNFTDeployed.address, "0");
        const allowanceBefore = await CWolfTokenDeployed.allowance(auxWallet.address, WolfsNFTDeployed.address);
        await CWolfTokenDeployed.connect(auxWallet).approve(WolfsNFTDeployed.address, amount);
        const allowanceAfter = await CWolfTokenDeployed.allowance(auxWallet.address, WolfsNFTDeployed.address);
        expect(allowanceAfter.sub(allowanceBefore)).to.equal(ethers.BigNumber.from(amount));
    });


    it("Should mint a WOLF with AUX (only NFT, no data)", async function () {
        const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
        const balanceCWOLFBefore = await CWolfTokenDeployed.balanceOf(auxWallet.address);
        await expect(WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "10000000000000000" }))
            .to.emit(WolfsNFTDeployed, 'MintedNFT')
            .withArgs(auxWallet.address, (totalSupply).toString());
        const balanceCWOLFAfter = await CWolfTokenDeployed.balanceOf(auxWallet.address);

        // console.log(balanceCWOLFBefore.toString());
        // console.log(balanceCWOLFAfter.toString());

    });

    it("Should not mint a WOLF with AUX2 (only NFT, no data)", async function () {
        await expect(WolfsNFTDeployed.connect(aux2Wallet).mintWithCWOLF(1, { value: "10000000000000000" }))
            .to.be.revertedWith("Not enough allowance");
    });

    it("Should mint a WOLF and distribute commission", async function () {
        await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "500000000000000000" });
        const getDollarsInBNB = await VariablesDeployed.getDollarsInBNB('25000000000000000');
        // console.log(getDollarsInBNB.toString())
        const commissionToBuy = await WolfsNFTDeployed.calculateGasAndCommissions(1);
        // console.log(commissionToBuy[0].toString());
        // console.log(commissionToBuy[1].toString());
        // console.log(commissionToBuy[2].toString());
        expect(commissionToBuy[1]).to.gt(ethers.BigNumber.from(getDollarsInBNB));
    });

    it("Should generate 4 WOLFs more", async function () {
        const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
        await expect(WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(4, { value: "10000000000000000" }))
            .to.emit(WolfsNFTDeployed, 'MintedNFT')
            .withArgs(auxWallet.address, (totalSupply).toString());
    });

    /* TODO
    it("Should mint 4 WOLF and distribute commission", async function () {
        const amount = 4;
        await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(amount, { value: "10000000000000000" });
        const balancePost = await provider.getBalance(WolfsNFTDeployed.commissionWalletAddress());
        const priceBNB = ethers.utils.formatEther(await VariablesDeployed.priceBNB());
        const balanceFinal = ethers.utils.formatEther(balancePost);
        // Debería ser 1 pero se suma el 0.25 del anterior test
        expect(((priceBNB * balanceFinal)).toFixed(2)).to.equal('1.25');
    });
    */

    it("Should not generate info for WOLF 0", async function () {
        // Checkear los mappings del WOLF 0
        let propertiesList = await WolfsNFTDeployed.getWolfProperties(0);
        for (property of propertiesList) {
            expect(property).to.equal(0);
        }
    });

    it("Should generate WOLF info with minterWallet", async function () {
        const randomUUID = uuidv4();
        const seed = (keccak256(randomUUID)).toString('hex');
        await WolfsNFTDeployed.connect(minterWallet)
            .generateValuesWolf([1], '0x' + seed);

        const generatedWolf = await WolfsNFTDeployed.getWolfProperties(1);
        expect(generatedWolf[0]).to.be.within(0, 7);
        expect(generatedWolf[1]).to.be.within(0, 1);
        expect(generatedWolf[2]).to.be.within(0, 5);
        expect(generatedWolf[3]).to.be.within(20, 222);
        expect(generatedWolf[4]).to.be.within(20, 222);
        expect(generatedWolf[5]).to.equal(0);
    });

    it("Should generate attack points according with level", async function () {
        const randomUUID = uuidv4();
        const seed = (keccak256(randomUUID)).toString('hex');
        await WolfsNFTDeployed.connect(minterWallet)
            .generateValuesWolf([2], '0x' + seed);

        const generatedWolf = await WolfsNFTDeployed.getWolfProperties(1);
        const low = attackDefensePoints[generatedWolf[2]][0];
        const high = attackDefensePoints[generatedWolf[2]][1];
        expect(generatedWolf[3]).to.be.within(low, high);
    });

    it("Should generate defense points according with level", async function () {
        const randomUUID = uuidv4();
        const seed = (keccak256(randomUUID)).toString('hex');
        await WolfsNFTDeployed.connect(minterWallet)
            .generateValuesWolf([3], '0x' + seed);

        const generatedWolf = await WolfsNFTDeployed.getWolfProperties(1);
        const low = attackDefensePoints[generatedWolf[2]][0];
        const high = attackDefensePoints[generatedWolf[2]][1];
        expect(generatedWolf[4]).to.be.within(low, high);
    });

    it("Should mint 10 WOLF", async function () {
        const totalSupplyBefore = (await WolfsNFTDeployed.totalSupply()).toNumber();
        await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(10, { value: "1000000000000000000" });
        const totalSupplyAfter = (await WolfsNFTDeployed.totalSupply()).toNumber();
        expect(totalSupplyAfter - totalSupplyBefore).to.equal(10);
    });

    /*
    it("Should generate CSV of 1000 WOLF to test stats", async function () {

        const amount = "1000000000000000000000000";
        await CWolfTokenDeployed.connect(auxWallet).approve(WolfsNFTDeployed.address, amount);

        const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
        const numberToGenerate = 300;

        for (let index = 0; index < numberToGenerate; index++) {
            await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "100000000000000000" });
        }

        let results = [];
        for (let index = 1; index < numberToGenerate - 2; index++) {
            let seed = (keccak256(uuidv4())).toString('hex');

            try {
                await WolfsNFTDeployed.connect(minterWallet)
                    .generateValuesWolf([totalSupply - index - 1], '0x' + seed);
            } catch (error) {
                console.log(error)
            }

            const generatedWolf = await WolfsNFTDeployed.getWolfProperties(totalSupply - index - 1);

            const wolf = {
                breed: (generatedWolf[0]).toNumber(),
                gender: (generatedWolf[1]).toNumber(),
                level: (generatedWolf[2]).toNumber(),
                attack: (generatedWolf[3]).toNumber(),
                defense: (generatedWolf[4]).toNumber(),
            }

            results.push(wolf);

        }

        console.log(results);
        const tsv = json2csvParser.parse(results);
        fs.writeFile('test/json/wolfsGenerated.csv', tsv);

    });
    */


    it("Should generate data for the last 10 wolfs minted", async function () {
        const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
        const arrayTemp = Array.from(Array(10).keys());
        const idsToGenerate = arrayTemp.map(x => totalSupply - x - 1);
        let seed = '0x' + (keccak256(uuidv4())).toString('hex');
        await WolfsNFTDeployed.connect(minterWallet).generateValuesWolf(idsToGenerate, seed);
        for (let index = 0; index < idsToGenerate.length; index++) {
            const id = idsToGenerate[index];
            const generatedWolf = await WolfsNFTDeployed.getWolfProperties(id);
            // console.log('generatedWolf: ', generatedWolf);
        };

    });

    it("Should not mint 11 WOLF", async function () {
        await expect(WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(11, { value: "100000000000000000" }))
            .to.be.revertedWith("Amount must be < 10");
    });

    it("Should not mint if msg.value is less than (gasToMinter * amount) + commission", async function () {
        await expect(WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(10, { value: "1" }))
            .to.be.revertedWith("Not enough gas");
    });

    it("Should not mint if allowance is less than boxPriceCWOLFInDollars * amount", async function () {
        await CWolfTokenDeployed.connect(auxWallet).approve(WolfsNFTDeployed.address, "0");
        await expect(WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(10, { value: "100000000000000000" }))
            .to.be.revertedWith("Not enough allowance");
        await CWolfTokenDeployed.connect(auxWallet).approve(WolfsNFTDeployed.address, "10000000000000000000000");
    });

    
    it("Should set WolfPackNFTContractAddress", async function () {
        await WolfsNFTDeployed.changeWolfPackNFTContractAddress(WolfPacksNFTDeployed.address);
        // WolfPackNFTContractAddress
    });


    it("Should give allowance from REWARDS WALLET to Contract", async function () {
        const amount = "100000000000000000000000000";
        await CWolfTokenDeployed.connect(rewardsWallet).approve(WolfsNFTDeployed.address, "0");
        const allowanceBefore = await CWolfTokenDeployed.allowance(rewardsWallet.address, WolfsNFTDeployed.address);
        await CWolfTokenDeployed.connect(rewardsWallet).approve(WolfsNFTDeployed.address, amount);
        const allowanceAfter = await CWolfTokenDeployed.allowance(rewardsWallet.address, WolfsNFTDeployed.address);
        console.log('allowanceAfter: ', allowanceAfter);
        expect(allowanceAfter.sub(allowanceBefore)).to.equal(ethers.BigNumber.from(amount));
    });


    it("Should burn a Wolf", async function () {
        const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
        const wolfToBurn = (totalSupply - 1).toString();
        console.log('auxWallet: ', auxWallet.address);
        console.log('totalSupply: ', totalSupply);
        console.log('ownerOf: ', await WolfsNFTDeployed.ownerOf(wolfToBurn));
        console.log('wolfToBurn: ', wolfToBurn);

        await WolfsNFTDeployed.connect(auxWallet).burnWolf(wolfToBurn);
    });




});



describe('Pause contract tests', function () {
    // Pause contract
    it("Should pause contract", async function () {
        await expect(WolfsNFTDeployed.pauseContract())
            .to.emit(WolfsNFTDeployed, 'Paused')
            .withArgs(deployerWallet.address);
    });

    it("Should not mint if contract is paused", async function () {
        await expect(WolfsNFTDeployed.mintWithCWOLF(1, { value: "100000000000000000" }))
            .to.be.revertedWith("Pausable: paused");
    });

    // Unpause contract
    it("Should unpause contract", async function () {
        await expect(WolfsNFTDeployed.unpauseContract())
            .to.emit(WolfsNFTDeployed, 'Unpaused')
            .withArgs(deployerWallet.address);
    });

    it("Should mint if contract is unpaused", async function () {
        expect(await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "100000000000000000" }))
    });

});

describe('Test parameter modifications', function () {

    it('Should change rewardsPoolAddress', async function () {
        await WolfsNFTDeployed.changeRewardsPoolAddress(auxWallet.address);
        expect(await WolfsNFTDeployed.rewardsPoolAddress()).to.equal(auxWallet.address);
        await WolfsNFTDeployed.changeRewardsPoolAddress(rewardsWallet.address);
        expect(await WolfsNFTDeployed.rewardsPoolAddress()).to.equal(rewardsWallet.address);
    });

    it('Should change boxPriceCWOLFInDollars', async function () {
        const initialboxPriceCWOLFInDollars = await WolfsNFTDeployed.boxPriceCWOLFInDollars();
        // expect(initialboxPriceCWOLFInDollars).to.equal(0);
        await WolfsNFTDeployed.changeboxPriceCWOLFInDollars(1);
        expect(await WolfsNFTDeployed.boxPriceCWOLFInDollars()).to.equal(1);
        await WolfsNFTDeployed.changeboxPriceCWOLFInDollars(initialboxPriceCWOLFInDollars);
    });

    it('Should change gasToMinter', async function () {
        const initialGasToMinter = await WolfsNFTDeployed.gasToMinter();
        expect(initialGasToMinter).to.equal(1000000000000000);
        await WolfsNFTDeployed.changeGasToMinter(500);
        expect(await WolfsNFTDeployed.gasToMinter()).to.equal(500);
        await WolfsNFTDeployed.changeGasToMinter(initialGasToMinter);
    });

    it('Should change commission', async function () {
        const initialCommission = await WolfsNFTDeployed.commissionInDollars();
        expect(initialCommission).to.equal('250000000000000000');
        await WolfsNFTDeployed.changeCommissionInDollars('2500');
        expect(await WolfsNFTDeployed.commissionInDollars()).to.equal('2500');
        await WolfsNFTDeployed.changeCommissionInDollars(initialCommission);
    });

    it('should change CWOLFContractAddress', async function () {
        const CWOLFContractAddress = await WolfsNFTDeployed.CWOLFContractAddress();
        expect(CWOLFContractAddress).to.equal(CWOLFContractAddress);
        await WolfsNFTDeployed.changeCWOLFContractAddress(auxWallet.address);
        expect(await WolfsNFTDeployed.CWOLFContractAddress()).to.equal(auxWallet.address);
        await WolfsNFTDeployed.changeCWOLFContractAddress(CWOLFContractAddress);
    });

    it('Should change wolfsNFTHelperContractAddress', async function () {
        const WolfsNFTHelperContractAddress = await WolfsNFTDeployed.wolfsNFTHelperContractAddress();
        expect(WolfsNFTHelperContractAddress).to.equal(WolfsNFTHelperContractAddress);
        await WolfsNFTDeployed.changeWolfsNFTHelperContractAddress(auxWallet.address);
        expect(await WolfsNFTDeployed.wolfsNFTHelperContractAddress()).to.equal(auxWallet.address);
        await WolfsNFTDeployed.changeWolfsNFTHelperContractAddress(WolfsNFTHelperContractAddress);
    });

    it('Should change minterWalletAddress', async function () {
        expect(await WolfsNFTDeployed.minterWalletAddress()).to.equal(minterWallet.address);
        await WolfsNFTDeployed.changeAddressMinterWallet(auxWallet.address);
        expect(await WolfsNFTDeployed.minterWalletAddress()).to.equal(auxWallet.address);
        await WolfsNFTDeployed.changeAddressMinterWallet(minterWallet.address);
    });

    it('Should change commission wallet address', async function () {
        expect(await WolfsNFTDeployed.commissionWalletAddress()).to.equal(await WolfsNFTDeployed.commissionWalletAddress());
        await WolfsNFTDeployed.changeAddressCommissionWallet(auxWallet.address);
        expect(await WolfsNFTDeployed.commissionWalletAddress()).to.equal(auxWallet.address);
        await WolfsNFTDeployed.changeAddressCommissionWallet(WolfsNFTDeployed.commissionWalletAddress());
    });


});


