const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const formatEther = ethers.utils.formatEther;
const { BigNumber, Contract, Wallet, EventFilter } = require("ethers");

const toEther = ethers.utils.formatEther;
const parseUnits = ethers.utils.parseUnits;
const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert,
    time, // Assertions for transactions that should fail
    send,
    snapshot,
    restore
} = require('@openzeppelin/test-helpers');

let CWOLFTokenDeployed;
let PresaleCWOLFDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;
let auxWallet;
let aux2Wallet;
let initialSnapshot;

beforeEach(async function () {
    CWolfToken = await hre.deployments.get('CWolfToken');
    CWOLFTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);
    PresaleCWOLF = await hre.deployments.get('PresaleCWOLF');
    PresaleCWOLFDeployed = await ethers.getContractAt('PresaleCWOLF', PresaleCWOLF.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet] = await ethers.getSigners();
});

describe("PresaleCWOLF_Proxy", function () {

    it("Should take snapshot", async function () {
        initialSnapshot = await snapshot();
        expect(true);
    });

    it("Should be initialized", async function () {
        expect(await PresaleCWOLFDeployed.isInitialized()).to.equal(true);
    });

    it("Should be ownered", async function () {
        expect(await PresaleCWOLFDeployed.owner()).to.equal(deployerWallet.address);
    });

    it("Should transfer CWOLF to this contract", async function () {
        const CWOLFAmountInContractBefore = await CWOLFTokenDeployed.balanceOf(PresaleCWOLFDeployed.address);
        await CWOLFTokenDeployed.transfer(PresaleCWOLFDeployed.address, "2000000000000000000000000");
        const CWOLFAmountInContractAfter = await CWOLFTokenDeployed.balanceOf(PresaleCWOLFDeployed.address);
        console.log('CWOLFAmountInContractAfter', toEther(CWOLFAmountInContractAfter));
        expect(CWOLFAmountInContractAfter.sub(CWOLFAmountInContractBefore)).to.equal(BigNumber.from("2000000000000000000000000"));
    });

    it("Should not change buyActive from test1", async function () {
        await expect(PresaleCWOLFDeployed.connect(auxWallet).changeClaimState(true))
            .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should change to claimActive from owner", async function () {
        await PresaleCWOLFDeployed.connect(deployerWallet).changeClaimState(true);
        expect(await PresaleCWOLFDeployed.claimActive()).to.equal(true);
        await PresaleCWOLFDeployed.connect(deployerWallet).changeClaimState(false);
        expect(await PresaleCWOLFDeployed.claimActive()).to.equal(false);
    });

    it("Should NOT change to claimActive from auxWallet", async function () {
        await expect(PresaleCWOLFDeployed.connect(auxWallet).changeClaimState(true)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it("Should change firstReleaseDate to now (time.latest()) - Owner", async function () {
        const now = (await time.latest()).toNumber();
        await PresaleCWOLFDeployed.connect(deployerWallet).changeFirstReleaseDateTs(now);
        expect(await PresaleCWOLFDeployed.firstReleaseDateTs()).to.equal(now);
    });

    it("Should check toBeClaimedNow", async function () {
        const toBeClaimedNowAuxWallet = await PresaleCWOLFDeployed.connect(auxWallet).toBeClaimedNow(auxWallet.address);
        console.log('toBeClaimedNowAuxWallet (1)', toEther(toBeClaimedNowAuxWallet));
        expect(toBeClaimedNowAuxWallet).to.equal(0);
    });

    it("Should NOT claim 1CWOLF at this moment (now) - Claim not active", async function () {
        await expect(PresaleCWOLFDeployed.connect(auxWallet).claim('1')).to.be.revertedWith('Claim not active');
    });

    it("Should NOT claim 1CWOLF at this moment (now) - Claim active", async function () {
        await PresaleCWOLFDeployed.connect(deployerWallet).changeClaimState(true);
        await expect(PresaleCWOLFDeployed.connect(auxWallet).claim('1')).to.be.revertedWith('Amount exceeded');
    });

    it("Should addAddress auxWallet to Contract - owner  ", async function () {
        const balanceToClaimAuxWalletBefore = await PresaleCWOLFDeployed.boughtTokens(auxWallet.address);
        await PresaleCWOLFDeployed.connect(deployerWallet).addAddresses([auxWallet.address], ['20000']);
        const balanceToClaimAuxWalletAfter = await PresaleCWOLFDeployed.boughtTokens(auxWallet.address);
        expect(toEther(balanceToClaimAuxWalletAfter) - toEther(balanceToClaimAuxWalletBefore)).to.equal(20000);
    });

    it("Should removeAddresses auxWallet to Contract - owner", async function () {
        await PresaleCWOLFDeployed.connect(deployerWallet).removeAddresses([auxWallet.address]);
        const balanceToClaimAuxWalletAfter = await PresaleCWOLFDeployed.boughtTokens(auxWallet.address);
        expect(toEther(balanceToClaimAuxWalletAfter)).to.equal('0.0');
    });

    it("Should not addAddress auxWallet to Contract - auxWallet  ", async function () {
        await expect(PresaleCWOLFDeployed.connect(auxWallet).addAddresses([auxWallet.address], ['20000'])).to.be.revertedWith('Ownable: caller is not the owner')
    });

    it("Should not removeAddress auxWallet to Contract - auxWallet  ", async function () {
        await expect(PresaleCWOLFDeployed.connect(auxWallet).removeAddresses([auxWallet.address])).to.be.revertedWith('Ownable: caller is not the owner')
    });

    it("Should change to claimActive from owner", async function () {
        await PresaleCWOLFDeployed.connect(deployerWallet).changeClaimState(true);
    });

    it("Should add boughtTokens to auxWallet", async function () {
        await PresaleCWOLFDeployed.connect(deployerWallet).addAddresses([auxWallet.address], ['20000']);
        const balanceToClaimAuxWalletAfter = await PresaleCWOLFDeployed.boughtTokens(auxWallet.address);
        console.log('balanceToClaimAuxWalletAfter: ', balanceToClaimAuxWalletAfter);
    });

    it("Should check toBeClaimedNow = 0", async function () {
        const toBeClaimedNowAuxWallet = await PresaleCWOLFDeployed.connect(auxWallet).toBeClaimedNow(auxWallet.address);
        expect(toBeClaimedNowAuxWallet).to.equal(0);
    });

    // Add 1 day
    it("Should increase time 1 day", async function () {
        await time.increase(time.duration.days(1));
    });

    it("Should check toBeClaimedNow = 1%", async function () {
        const toBeClaimedNowAuxWallet = await PresaleCWOLFDeployed.connect(auxWallet).toBeClaimedNow(auxWallet.address);
        expect(toEther(toBeClaimedNowAuxWallet)).to.equal('200.0');
    });

    it("Should NOT claim 600 CWOLF", async function () {
        await expect(PresaleCWOLFDeployed.connect(auxWallet).claim('600000000000000000000')).to.be.revertedWith('Amount exceeded');
    });

    it("Should claim 400 CWOLF", async function () {
        snapshot1 = await snapshot();

        const balanceContractBefore = await CWOLFTokenDeployed.balanceOf(PresaleCWOLFDeployed.address);
        const balanceAuxWalletBefore = await CWOLFTokenDeployed.balanceOf(auxWallet.address);


        await PresaleCWOLFDeployed.connect(auxWallet).claim('200000000000000000000');

        const balanceContractAfter = await CWOLFTokenDeployed.balanceOf(PresaleCWOLFDeployed.address);
        const balanceAuxWalletAfter = await CWOLFTokenDeployed.balanceOf(auxWallet.address);

        expect(toEther(balanceContractBefore) - toEther(balanceContractAfter)).to.equal(200);
        expect(toEther(balanceAuxWalletAfter) - toEther(balanceAuxWalletBefore)).to.equal(200);
        await snapshot1.restore()

    });

    // Day 2 (SNAPSHOT RESTORED)
    it("Should increase time 1 day", async function () {
        await time.increase(time.duration.days(1));
    });

    it("Should claim 400 CWOLF", async function () {
        const balanceContractBefore = await CWOLFTokenDeployed.balanceOf(PresaleCWOLFDeployed.address);
        const balanceAuxWalletBefore = await CWOLFTokenDeployed.balanceOf(auxWallet.address);
        console.log(toEther(balanceContractBefore));
        console.log(toEther(balanceAuxWalletBefore));
        await PresaleCWOLFDeployed.connect(auxWallet).claim('400000000000000000000');
        const balanceContractAfter = await CWOLFTokenDeployed.balanceOf(PresaleCWOLFDeployed.address);
        const balanceAuxWalletAfter = await CWOLFTokenDeployed.balanceOf(auxWallet.address);
        console.log(toEther(balanceContractAfter));
        console.log(toEther(balanceAuxWalletAfter));
        expect(toEther(balanceContractBefore) - toEther(balanceContractAfter)).to.equal(400);
        expect(toEther(balanceAuxWalletAfter) - toEther(balanceAuxWalletBefore)).to.equal(400);
        expect(toEther(await PresaleCWOLFDeployed.connect(auxWallet).toBeClaimedNow(auxWallet.address))).to.equal('0.0');
    });

    it("Should NOT claim 10 CWOLF", async function () {
        await expect(PresaleCWOLFDeployed.connect(auxWallet).claim('10000000000000000000')).to.be.revertedWith('Amount exceeded');
    });

    // Day 120
    it("Should increase time 120 day", async function () {
        await time.increase(time.duration.days(120));
    });

    it("Should claim 19600 CWOLF", async function () {
        const balanceContractBefore = await CWOLFTokenDeployed.balanceOf(PresaleCWOLFDeployed.address);
        const balanceAuxWalletBefore = await CWOLFTokenDeployed.balanceOf(auxWallet.address);
        const toBeClaimedAuxWalletBefore = await PresaleCWOLFDeployed.connect(auxWallet).toBeClaimedNow(auxWallet.address);

        console.log(toEther(balanceContractBefore));
        console.log(toEther(balanceAuxWalletBefore));
        console.log(toEther(toBeClaimedAuxWalletBefore));

        await PresaleCWOLFDeployed.connect(auxWallet).claim('19600000000000000000000');
        const balanceContractAfter = await CWOLFTokenDeployed.balanceOf(PresaleCWOLFDeployed.address);
        const balanceAuxWalletAfter = await CWOLFTokenDeployed.balanceOf(auxWallet.address);
        const toBeClaimedAuxWalletAfter = await PresaleCWOLFDeployed.connect(auxWallet).toBeClaimedNow(auxWallet.address);

        console.log(toEther(balanceContractAfter));
        console.log(toEther(balanceAuxWalletAfter));
        console.log(toEther(toBeClaimedAuxWalletAfter));

        expect(toEther(balanceContractBefore) - toEther(balanceContractAfter)).to.equal(19600);
        expect(toEther(balanceAuxWalletAfter) - toEther(balanceAuxWalletBefore)).to.equal(19600);
        expect(toEther(await PresaleCWOLFDeployed.connect(auxWallet).toBeClaimedNow(auxWallet.address))).to.equal('0.0');
    });




    /*
    it("Should restore snapshot", async function () {
        await initialSnapshot.restore();
        expect(true);
    });
    */


});

