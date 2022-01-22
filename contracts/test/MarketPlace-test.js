const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const formatEther = ethers.utils.formatEther;
const keccak256 = require('keccak256')
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const json2csvParser = new Parser({ delimiter: '\t' });

let MarketPlace;
let MarketPlaceDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;
let auxWallet;
let aux2Wallet;
let aux3Wallet;

let id;

beforeEach(async function () {
    MarketPlace = await hre.deployments.get('MarketPlace');
    MarketPlaceDeployed = await ethers.getContractAt('MarketPlace', MarketPlace.address);
    Variables = await hre.deployments.get('Variables');
    VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);
    CWolfToken = await hre.deployments.get('CWolfToken');
    CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);
    MaterialsNFT = await hre.deployments.get('MaterialsNFT');
    MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet, aux3Wallet] = await ethers.getSigners();
});

describe("MarketPlace_Proxy", function () {

    it("Should be initialized", async function () {
        expect(await MarketPlaceDeployed.isInitialized()).to.equal(true);
        expect(await MarketPlaceDeployed.owner()).to.equal(deployerWallet.address);
    });

    it("Should give allowance from AUX to NFTContract to mint", async function () {
        const amount = "10000000000000000000000";
        await CWolfTokenDeployed.connect(auxWallet).approve(MaterialsNFTDeployed.address, "0");
        const allowanceBefore = await CWolfTokenDeployed.allowance(auxWallet.address, MaterialsNFTDeployed.address);
        await CWolfTokenDeployed.connect(auxWallet).approve(MaterialsNFTDeployed.address, amount);
        const allowanceAfter = await CWolfTokenDeployed.allowance(auxWallet.address, MaterialsNFTDeployed.address);
        expect(allowanceAfter.sub(allowanceBefore)).to.equal(ethers.BigNumber.from(amount));
    });

    it("Should give allowance from deployerWallet to MarketplaceContract to buy", async function () {
        const amount = "10000000000000000000000";
        await CWolfTokenDeployed.connect(deployerWallet).approve(MarketPlaceDeployed.address, "0");
        const allowanceBefore = await CWolfTokenDeployed.allowance(deployerWallet.address, MarketPlaceDeployed.address);
        await CWolfTokenDeployed.connect(deployerWallet).approve(MarketPlaceDeployed.address, amount);
        const allowanceAfter = await CWolfTokenDeployed.allowance(deployerWallet.address, MarketPlaceDeployed.address);
        expect(allowanceAfter.sub(allowanceBefore)).to.equal(ethers.BigNumber.from(amount));
    });

    it("Should mint 1 Material with auxWallet(only NFT, no data)", async function () {
        await expect(MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "1000000000000000000" }))
            .to.emit(MaterialsNFTDeployed, 'MintedNFT')

        const totalSupply = await MaterialsNFTDeployed.connect(auxWallet).totalSupply();
        console.log(totalSupply - 1);

    });

    it("Should give allowance from AUX1 to Marketplace with auxWallet to the NFT", async function () {
        const totalSupply = await MaterialsNFTDeployed.connect(auxWallet).totalSupply();

        await MaterialsNFTDeployed.connect(auxWallet).approve(MarketPlaceDeployed.address, totalSupply - 1);

    });

    it("Should add item to MarketPlace", async function () {
        const totalSupply = await MaterialsNFTDeployed.connect(auxWallet).totalSupply();

        const tx = await MarketPlaceDeployed.connect(auxWallet).addItemToMarket(MaterialsNFTDeployed.address, totalSupply - 1, '2000000000');
        let receipt = await tx.wait();
        const eventresult = receipt.events?.filter((x) => { return x.event == "itemAdded" });
        const newId = eventresult[0].args.id;
        console.log(newId);
        id = newId;
    });

    it("Should buy NFT  with deployerWallet(only NFT, no data)", async function () {

        console.log('id: ', id);

        const amountBurgBefore = await CWolfTokenDeployed.connect(deployerWallet).balanceOf(deployerWallet.address);
        console.log('amountBurgBefore:', amountBurgBefore.toString());

        const tx = await MarketPlaceDeployed.connect(deployerWallet).buyItem(id, { value: "1000000000000000000" });
        let receipt = await tx.wait();
        const eventresult = receipt.events?.filter((x) => { return x.event == "itemSold" });
        console.log(eventresult);

        await CWolfTokenDeployed.connect(deployerWallet).approve(MarketPlaceDeployed.address, "0");

        const amountBurgAfter = await CWolfTokenDeployed.connect(deployerWallet).balanceOf(deployerWallet.address);
        console.log('amountBurgAfter:', amountBurgAfter.toString());

    });


    /*


    it("Should buy NFT  with deployerWallet(only NFT, no data)", async function () {
        let materialNFTs = [];
        let totalsupply = await MarketPlaceDeployed.totalItemsForSale()
        totalsupply = totalsupply.toString()
        for (let count = 1; count < totalsupply; count++) {
            const nfts = await MarketPlaceDeployed.itemsForSale(count)
            const active = nfts.isSold;
            if (!active && nfts.tokenAddress == MaterialsNFTDeployed.address) {
                materialNFTs.push(nfts)
            }
        }
        await expect(MarketPlaceDeployed.connect(deployerWallet).buyItem(materialNFTs[0].id.toString(), { value: "1000000000000000000" }))
            .to.emit(MarketPlaceDeployed, 'itemSold')
    });
    it("Should remove a Material from marketplace with auxWallet(only NFT, no data)", async function () {
        let materialNFTs = [];
        let totalsupply = await MarketPlaceDeployed.totalItemsForSale()
        totalsupply = totalsupply.toString()
        for (let count = 1; count < totalsupply; count++) {
            const nfts = await MarketPlaceDeployed.itemsForSale(count)
            const active = nfts.isSold;
            if (!active && nfts.tokenAddress == MaterialsNFTDeployed.address) {
                materialNFTs.push(nfts)
            }
        }
        await expect(MarketPlaceDeployed.connect(auxWallet).removeItem(materialNFTs[0].id.toString()))
            .to.emit(MarketPlaceDeployed, 'itemRemoved')
    });

    */

});

describe('Test parameter modifications', function () {

    it('should change CWOLFContractAddress', async function () {
        const CWOLFContractAddress = await MarketPlaceDeployed.CWOLFContractAddress();
        expect(CWOLFContractAddress).to.equal(CWOLFContractAddress);
        await MarketPlaceDeployed.changeCWOLFContractAddress(auxWallet.address);
        expect(await MarketPlaceDeployed.CWOLFContractAddress()).to.equal(auxWallet.address);
        await MarketPlaceDeployed.changeCWOLFContractAddress(CWOLFContractAddress);
    });

    it('Should change rewardsPoolAddress', async function () {
        await MarketPlaceDeployed.changeRewardsPoolAddress(auxWallet.address);
        expect(await MarketPlaceDeployed.rewardsPoolAddress()).to.equal(auxWallet.address);
    });

});