const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const formatEther = ethers.utils.formatEther;
const keccak256 = require('keccak256')
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const json2csvParser = new Parser({ delimiter: '\t' });

const { BN, constants, expectEvent, expectRevert, time, send, snapshot, restore } = require('@openzeppelin/test-helpers');
const { BigNumber } = require("ethers");
const { parseUnits, parseEther, formatUnits } = require("ethers/lib/utils");

let Claim;
let ClaimDeployed;
let HuntingNFT;
let HuntingDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;
let auxWallet;
let aux2Wallet;

beforeEach(async function () {
    Claim = await hre.deployments.get('Claim');
    ClaimDeployed = await ethers.getContractAt('Claim', Claim.address);
    CWolfToken = await hre.deployments.get('CWolfToken');
    CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);
    HuntingNFT = await hre.deployments.get('HuntingNFT');
    HuntingDeployed = await ethers.getContractAt('HuntingNFT', HuntingNFT.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet] = await ethers.getSigners();
});

describe('Claim contract', function () {

    describe('addReward function', function () {
        it('should fail if caller is not Hunting contract', async function () {
            const snap = await snapshot();
            await ClaimDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            await expect(ClaimDeployed.connect(deployerWallet).addReward(auxWallet.address, 10)).to.revertedWith('Caller is not Hunting Contract');
            await snap.restore();
        });

        it('should calculate amount correctly', async function () {
            const snap = await snapshot();
            await ClaimDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            const existentAmount = await ClaimDeployed.usersAmount(auxWallet.address);
            const amountToAdd = "1000.0";
            await ClaimDeployed.connect(aux2Wallet).addReward(auxWallet.address, ethers.utils.parseUnits(amountToAdd, 18));
            expect(await ClaimDeployed.usersAmount(auxWallet.address)).equal(BigNumber.from(existentAmount).add(ethers.utils.parseUnits(amountToAdd, 18)));
            await snap.restore();
        });

        it('should set user if user not registered', async function () {
            const snap = await snapshot();
            await ClaimDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);

            expect(await ClaimDeployed.usersPenalizationLevel(auxWallet.address)).equal(0);
            expect(await ClaimDeployed.usersTaxAmount(auxWallet.address)).equal(0);
            expect(await ClaimDeployed.usersRegistered(auxWallet.address)).false;
            expect(await ClaimDeployed.dateUsersLastReduction(auxWallet.address)).equal(0);

            const amountToAdd = "1000.0";
            const tx = await ClaimDeployed.connect(aux2Wallet).addReward(auxWallet.address, ethers.utils.parseUnits(amountToAdd, 18));
            const block = await provider.getBlock(tx.blockNumber);
            const penalizationLevel = await ClaimDeployed.usersPenalizationLevel(auxWallet.address);
            expect(penalizationLevel).equal(0);
            expect(await ClaimDeployed.usersTaxAmount(auxWallet.address)).equal(await ClaimDeployed.levelsPercentages(penalizationLevel));
            expect(await ClaimDeployed.usersRegistered(auxWallet.address)).true;
            expect(await ClaimDeployed.dateUsersLastReduction(auxWallet.address)).equal(block.timestamp);

            await snap.restore();
        });
    });

    describe('claimReward function', function () {

        it('should not claim if user is not registered', async function () {
            await expect(ClaimDeployed.connect(auxWallet).claimReward()).to.be.revertedWith('User not registered');
        });

        it('should not claim if user does not have amount', async function () {
            const snap = await snapshot();
            await ClaimDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            const amountToAdd = "0.0";
            const tx = await ClaimDeployed.connect(aux2Wallet).addReward(auxWallet.address, ethers.utils.parseUnits(amountToAdd, 18));
            await expect(ClaimDeployed.connect(auxWallet).claimReward()).to.be.revertedWith('User does not have any amount to claim');
            await snap.restore();

        });

        it('should claim tokens correctly', async function () {
            const snap = await snapshot();
            await CWolfTokenDeployed.connect(deployerWallet).mint(rewardsWallet.address, parseUnits("1000000.0", 18));
            await CWolfTokenDeployed.connect(auxWallet).burn(auxWallet.address, parseUnits("10000000.0"));
            await ClaimDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            await ClaimDeployed.connect(deployerWallet).changeRewardsPoolAddress(rewardsWallet.address);
            const amountToAdd = "100.0";
            await ClaimDeployed.connect(aux2Wallet).addReward(auxWallet.address, ethers.utils.parseUnits(amountToAdd, 18));

            await CWolfTokenDeployed.connect(rewardsWallet).approve(ClaimDeployed.address, parseUnits("1000000000000000000000.0", 18));
            const userTax = await ClaimDeployed.usersTaxAmount(auxWallet.address);
            await ClaimDeployed.connect(auxWallet).claimReward();

            expect(await ClaimDeployed.usersAmount(auxWallet.address)).equal(0);
            const balance = formatUnits(BigNumber.from(await CWolfTokenDeployed.balanceOf(auxWallet.address)).toString(), 18);
            const total = (parseInt(amountToAdd) - (parseInt(amountToAdd) * userTax / 10000)).toString() + '.0';
            expect(parseUnits(balance, 18)).equal(parseUnits(total, 18));
            await snap.restore();
        });

        it('should increment levels of penalization for claim before 0%', async function () {
            const snap = await snapshot();
            await CWolfTokenDeployed.connect(deployerWallet).mint(rewardsWallet.address, parseUnits("1000000.0", 18));
            await CWolfTokenDeployed.connect(auxWallet).burn(auxWallet.address, parseUnits("10000000.0"));
            await ClaimDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            await ClaimDeployed.connect(deployerWallet).changeRewardsPoolAddress(rewardsWallet.address);
            const amountToAdd = "100.0";
            const topLevel = await ClaimDeployed.topLevel();
            for (let i = 0; i < topLevel ; i++) {

                await ClaimDeployed.connect(aux2Wallet).addReward(auxWallet.address, ethers.utils.parseUnits(amountToAdd, 18));
                await CWolfTokenDeployed.connect(rewardsWallet).approve(ClaimDeployed.address, parseUnits("1000000000000000000000.0", 18));
                await ClaimDeployed.connect(auxWallet).claimReward();

            }
            expect(await ClaimDeployed.usersPenalizationLevel(auxWallet.address)).equal(topLevel);
            const penalization = await ClaimDeployed.levelsPercentages(await ClaimDeployed.usersPenalizationLevel(auxWallet.address));
            const userTax = formatUnits(BigNumber.from(await ClaimDeployed.usersTaxAmount(auxWallet.address)),0);
            expect(userTax).equal(penalization);
            await snap.restore();
        });

        it('should increment levels of penalization but not pass the level 5', async function () {
            const snap = await snapshot();
            await CWolfTokenDeployed.connect(deployerWallet).mint(rewardsWallet.address, parseUnits("1000000.0", 18));
            await CWolfTokenDeployed.connect(auxWallet).burn(auxWallet.address, parseUnits("10000000.0"));
            await ClaimDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            await ClaimDeployed.connect(deployerWallet).changeRewardsPoolAddress(rewardsWallet.address);
            const amountToAdd = "100.0";
            const topLevel = await ClaimDeployed.topLevel();
            let index;
            for (index = 0; index < topLevel + 1 ; index++) {

                await ClaimDeployed.connect(aux2Wallet).addReward(auxWallet.address, ethers.utils.parseUnits(amountToAdd, 18));
                await CWolfTokenDeployed.connect(rewardsWallet).approve(ClaimDeployed.address, parseUnits("1000000000000000000000.0", 18));
                await ClaimDeployed.connect(auxWallet).claimReward();
                
            }
            expect(index).equal(topLevel + 1);
            expect(await ClaimDeployed.usersPenalizationLevel(auxWallet.address)).equal(topLevel);
            await snap.restore();
        });

        it('should reduce tax amount by hunting (addreward)', async function () {
            const snap = await snapshot();
            await CWolfTokenDeployed.connect(deployerWallet).mint(rewardsWallet.address, parseUnits("1000000.0", 18));
            await CWolfTokenDeployed.connect(auxWallet).burn(auxWallet.address, parseUnits("10000000.0"));
            await ClaimDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            await ClaimDeployed.connect(deployerWallet).changeRewardsPoolAddress(rewardsWallet.address);
            const amountToAdd = "100.0";
            let data;
            for (let index = 0; index < 16; index++) {
                await ClaimDeployed.connect(aux2Wallet).addReward(auxWallet.address, ethers.utils.parseUnits(amountToAdd, 18));
                await time.increase(86400000);
                data = formatUnits(BigNumber.from(await ClaimDeployed.usersTaxAmount(auxWallet.address)), 0);
            }
            expect(data).equal(formatUnits(0,0));
            await snap.restore();
        });

        it('should reduce tax amount return to level 0 (45 tax amount) when claim', async function () {
            const snap = await snapshot();
            await CWolfTokenDeployed.connect(deployerWallet).mint(rewardsWallet.address, parseUnits("1000000.0", 18));
            await CWolfTokenDeployed.connect(auxWallet).burn(auxWallet.address, parseUnits("10000000.0"));
            await ClaimDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            await ClaimDeployed.connect(deployerWallet).changeRewardsPoolAddress(rewardsWallet.address);
            const amountToAdd = "100.0";
            let data;
            for (let index = 0; index < 16; index++) {
                await ClaimDeployed.connect(aux2Wallet).addReward(auxWallet.address, ethers.utils.parseUnits(amountToAdd, 18));
                await time.increase(86400000);
                data = formatUnits(BigNumber.from(await ClaimDeployed.usersTaxAmount(auxWallet.address)), 0);
            }
            expect(data).equal(formatUnits(0,0));
            await CWolfTokenDeployed.connect(rewardsWallet).approve(ClaimDeployed.address, parseUnits("1000000000000000000000.0", 18));
            await ClaimDeployed.connect(auxWallet).claimReward();
            data = formatUnits(BigNumber.from(await ClaimDeployed.usersTaxAmount(auxWallet.address)), 0);
            expect(data).equal(formatUnits(4500,0));
            await snap.restore();
        });

    });

    describe('set parameters functions', function () {

        it('should change huntingNFTContractAddress', async function () {
            const snap = await snapshot();
            const huntingNFTContractAddress = await ClaimDeployed.huntingNFTContractAddress();
            expect(await ClaimDeployed.huntingNFTContractAddress()).to.equal(huntingNFTContractAddress);
            await ClaimDeployed.changeHuntingNFTContractAddress(auxWallet.address);
            expect(await ClaimDeployed.huntingNFTContractAddress()).to.equal(auxWallet.address);
            await ClaimDeployed.changeHuntingNFTContractAddress(huntingNFTContractAddress);
            await snap.restore();
        });

        it('should change rewardsPoolAddress', async function () {
            const snap = await snapshot();
            const rewardsPoolAddress = await ClaimDeployed.rewardsPoolAddress();
            expect(await ClaimDeployed.rewardsPoolAddress()).to.equal(rewardsPoolAddress);
            await ClaimDeployed.changeRewardsPoolAddress(auxWallet.address);
            expect(await ClaimDeployed.rewardsPoolAddress()).to.equal(auxWallet.address);
            await ClaimDeployed.changeRewardsPoolAddress(rewardsPoolAddress);
            await snap.restore();
        });

        it('should change reductionBasisPoints', async function () {
            const snap = await snapshot();
            const reductionBP = await ClaimDeployed.reductionBasisPoints();
            expect(await ClaimDeployed.reductionBasisPoints()).to.equal(reductionBP);
            await ClaimDeployed.changeReductionBasisPoints(100);
            expect(await ClaimDeployed.reductionBasisPoints()).to.equal(100);
            await ClaimDeployed.changeReductionBasisPoints(reductionBP);
            await snap.restore();
        });

    });

})