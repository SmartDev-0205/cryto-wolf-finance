const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const provider = waffle.provider;
const formatEther = ethers.utils.formatEther;
const keccak256 = require('keccak256')
const { v4: uuidv4 } = require('uuid');
const { Parser } = require('json2csv');
const json2csvParser = new Parser({ delimiter: '\t' });

let MaterialsNFT;
let MaterialsNFTDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;

beforeEach(async function () {
    MaterialsNFT = await hre.deployments.get('MaterialsNFT');
    MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);
    Variables = await hre.deployments.get('Variables');
    VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);
    CWolfToken = await hre.deployments.get('CWolfToken');
    CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet] = await ethers.getSigners();
});

describe("MaterialsNFT_Proxy", function () {

    it("Should be initialized", async function () {
        expect(await MaterialsNFTDeployed.isInitialized()).to.equal(true);
        expect(await MaterialsNFTDeployed.owner()).to.equal(deployerWallet.address);
    });

    it("Should first material minted", async function () {
        const totalSupply = (await MaterialsNFTDeployed.totalSupply()).toNumber();
        expect(await totalSupply).to.greaterThan(0);
    });

    it("Should give allowance from AUX to Contract", async function () {
        const amount = "10000000000000000000000";
        await CWolfTokenDeployed.connect(auxWallet).approve(MaterialsNFTDeployed.address, "0");
        const allowanceBefore = await CWolfTokenDeployed.allowance(auxWallet.address, MaterialsNFTDeployed.address);
        await CWolfTokenDeployed.connect(auxWallet).approve(MaterialsNFTDeployed.address, amount);
        const allowanceAfter = await CWolfTokenDeployed.allowance(auxWallet.address, MaterialsNFTDeployed.address);
        expect(allowanceAfter.sub(allowanceBefore)).to.equal(ethers.BigNumber.from(amount));
    });

    it("Should mint a Material (only NFT, no data)", async function () {
        const totalSupply = (await MaterialsNFTDeployed.totalSupply()).toNumber();
        await expect(MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "1000000000000000000" }))
            .to.emit(MaterialsNFTDeployed, 'MintedNFT')
            .withArgs(auxWallet.address, (totalSupply).toString());
    });

    /*
    it("Should mint a Material and distribute commission", async function () {
        await MaterialsNFTDeployed.mintWithCWOLF(1, { value: "260000000000000000" });
        const balancePost = await provider.getBalance(MaterialsNFTDeployed.commissionWalletAddress());
        const priceBNB = ethers.utils.formatEther(await VariablesDeployed.priceBNB());
        const balanceFinal = ethers.utils.formatEther(balancePost);
        expect((priceBNB * balanceFinal).toFixed(2)).to.equal('0.25');
    });
    */

    it("Should not mint a WOLF with AUX2 (only NFT, no data)", async function () {
        await expect(MaterialsNFTDeployed.connect(aux2Wallet).mintWithCWOLF(1, { value: "10000000000000000" }))
            .to.be.revertedWith("Not enough allowance");
    });

    it("Should mint a WOLF and distribute commission", async function () {
        await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "500000000000000000" });
        const getDollarsInBNB = await VariablesDeployed.getDollarsInBNB('25000000000000000');
        // console.log(getDollarsInBNB.toString())
        const commissionToBuy = await MaterialsNFTDeployed.calculateGasAndCommissions(1);
        // console.log(commissionToBuy[0].toString());
        // console.log(commissionToBuy[1].toString());
        // console.log(commissionToBuy[2].toString());
        expect(commissionToBuy[1]).to.gt(ethers.BigNumber.from(getDollarsInBNB));
    });

    it("Should mint multiple WOLF and distribute commission", async function () {
        const amountToMint = 5;
        const value = 250000000000000000 * amountToMint;
        await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(amountToMint, { value: "500000000000000000" });
        const getDollarsInBNB = await VariablesDeployed.getDollarsInBNB(value.toString());
        const commissionToBuy = await MaterialsNFTDeployed.calculateGasAndCommissions(5);
        expect(commissionToBuy[1]).to.gte(ethers.BigNumber.from(getDollarsInBNB));
    });

    it("Should not generate info for Material 0", async function () {
        const materialSlots = await MaterialsNFTDeployed.getMaterialSlots(0);
        expect(materialSlots).to.equal(0);
    });

    it("Should not generate values Material with tokenId 0", async function () {
        const randomUUID = uuidv4();
        const seed = (keccak256(randomUUID)).toString('hex');
        await expect(MaterialsNFTDeployed.connect(minterWallet)
            .generateValuesMaterials([0], '0x' + seed)).to.be.revertedWith("Not allowed");;
    });

    it("Should not generate values Material info if not owner or minter", async function () {
        const randomUUID = uuidv4();
        const seed = (keccak256(randomUUID)).toString('hex');
        await expect(MaterialsNFTDeployed.connect(auxWallet)
            .generateValuesMaterials([0], '0x' + seed, { from: auxWallet.address})).to.be.revertedWith("Not allowed");;

    });

    it("Should not generate values Material info if token not exists", async function () {
        const randomUUID = uuidv4();
        const seed = (keccak256(randomUUID)).toString('hex');
        await expect(MaterialsNFTDeployed.connect(minterWallet)
            .generateValuesMaterials([10000], '0x' + seed)).to.be.revertedWith("Token does not exist");

    });

    it("Should generate Material info with minterWallet", async function () {
        const randomUUID = uuidv4();
        const seed = (keccak256(randomUUID)).toString('hex');
        await MaterialsNFTDeployed.connect(minterWallet)
            .generateValuesMaterials([1], '0x' + seed);

        const materialSlots = await MaterialsNFTDeployed.getMaterialSlots(1);
        expect(materialSlots).to.be.within(1, 6);
    });

    it("Should not mint if msg.value is less than gasToMinter", async function () {
        await expect(MaterialsNFTDeployed.mintWithCWOLF(1, { value: "1" }))
            .to.be.revertedWith("Not enough gas");
    });

    it("Should not mint if allowance is less than boxPriceCWOLFInDollars", async function () {
        await MaterialsNFTDeployed.changeboxPriceCWOLFInDollars(1);
        await expect(MaterialsNFTDeployed.mintWithCWOLF(1, { value: "100000000000000000" }))
            .to.be.revertedWith("Not enough allowance");
        await MaterialsNFTDeployed.changeboxPriceCWOLFInDollars(0);
    });
    
    /*
    it("Should generate CSV of 1000 WOLF to test stats", async function () {

        const totalSupply = (await MaterialsNFTDeployed.totalSupply()).toNumber();
        const numberToGenerate = 100;

        for (let index = 0; index < numberToGenerate; index++) {
            await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "100000000000000000" });
        }

        let results = [];
        for (let index = 0; index < numberToGenerate - 1; index++) {
            let seed = (keccak256(uuidv4())).toString('hex');

            try {
                await MaterialsNFTDeployed.connect(minterWallet)
                    .generateValuesMaterials([totalSupply - index - 1], '0x' + seed);
            } catch (error) {
                console.log(error)
            }

            const materialsSlots = await MaterialsNFTDeployed.getMaterialSlots(totalSupply - index - 1);

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
        const totalSupplyEnd = (await WolfsNFTDeployed.totalSupply()).toNumber();
        // console.log('totalSupplyEnd: ', totalSupplyEnd);
        const tsv = json2csvParser.parse(results);
        fs.writeFile('test/json/wolfsGenerated.csv', tsv);

    });
    */
    describe('Pause contract tests', function () {
        // Pause contract
        it("Should pause contract", async function () {
            await expect(MaterialsNFTDeployed.pause())
                .to.emit(MaterialsNFTDeployed, 'Paused')
                .withArgs(deployerWallet.address);
        });

        it("Should not mint if contract is paused", async function () {
            await expect(MaterialsNFTDeployed.mintWithCWOLF(1, { value: "100000000000000000" }))
                .to.be.revertedWith("Pausable: paused");
        });

        // Unpause contract
        it("Should unpause contract", async function () {
            await expect(MaterialsNFTDeployed.unpause())
                .to.emit(MaterialsNFTDeployed, 'Unpaused')
                .withArgs(deployerWallet.address);
        });

        it("Should mint if contract is unpaused", async function () {
            expect(await MaterialsNFTDeployed.mintWithCWOLF(1, { value: "100000000000000000" }))
        });

    });

    describe('Test parameter modifications', function () {

        it('Should change rewardsPoolAddress', async function () {
            await MaterialsNFTDeployed.changeRewardsPoolAddress(auxWallet.address);
            expect(await MaterialsNFTDeployed.rewardsPoolAddress()).to.equal(auxWallet.address);
            await MaterialsNFTDeployed.changeRewardsPoolAddress(rewardsWallet.address);
            expect(await MaterialsNFTDeployed.rewardsPoolAddress()).to.equal(rewardsWallet.address);
        });

        it('should change boxPriceCWOLFInDollars', async function () {
            const initialboxPriceCWOLFInDollars = await MaterialsNFTDeployed.boxPriceCWOLFInDollars();
            expect(initialboxPriceCWOLFInDollars).to.equal(0);
            await MaterialsNFTDeployed.changeboxPriceCWOLFInDollars(1);
            expect(await MaterialsNFTDeployed.boxPriceCWOLFInDollars()).to.equal(1);
            await MaterialsNFTDeployed.changeboxPriceCWOLFInDollars(initialboxPriceCWOLFInDollars);
        });

        it('should change gasToMinter', async function () {
            const initialGasToMinter = await MaterialsNFTDeployed.gasToMinter();
            expect(initialGasToMinter).to.equal(1000000000000000);
            await MaterialsNFTDeployed.changeGasToMinter(500);
            expect(await MaterialsNFTDeployed.gasToMinter()).to.equal(500);
            await MaterialsNFTDeployed.changeGasToMinter(initialGasToMinter);
        });

        it('should change changeCommissionInDollars', async function () {
            const initialCommission = await MaterialsNFTDeployed.commissionInDollars();
            await MaterialsNFTDeployed.changeCommissionInDollars(500);
            expect(await MaterialsNFTDeployed.commissionInDollars()).to.equal(500);
            await MaterialsNFTDeployed.changeCommissionInDollars(initialCommission);
        });

        it('should change CWOLFContractAddress', async function () {
            const CWOLFContractAddress = await MaterialsNFTDeployed.CWOLFContractAddress();
            expect(CWOLFContractAddress).to.equal(CWOLFContractAddress);
            await MaterialsNFTDeployed.changeCWOLFContractAddress(auxWallet.address);
            expect(await MaterialsNFTDeployed.CWOLFContractAddress()).to.equal(auxWallet.address);
            await MaterialsNFTDeployed.changeCWOLFContractAddress(CWOLFContractAddress);
        });

        it('should change minterWalletAddress', async function () {
            expect(await MaterialsNFTDeployed.minterWalletAddress()).to.equal(minterWallet.address);
            await MaterialsNFTDeployed.changeAddressMinterWallet(auxWallet.address);
            expect(await MaterialsNFTDeployed.minterWalletAddress()).to.equal(auxWallet.address);
            await MaterialsNFTDeployed.changeAddressMinterWallet(minterWallet.address);
        });

        it('Should change commission wallet address', async function () {
            expect(await MaterialsNFTDeployed.commissionWalletAddress()).to.equal(await MaterialsNFTDeployed.commissionWalletAddress());
            await MaterialsNFTDeployed.changeAddressCommissionWallet(auxWallet.address);
            expect(await MaterialsNFTDeployed.commissionWalletAddress()).to.equal(auxWallet.address);
            await MaterialsNFTDeployed.changeAddressCommissionWallet(MaterialsNFTDeployed.commissionWalletAddress());
        });

    });


    // TODO:  Test de cambiar las probabilidades

});