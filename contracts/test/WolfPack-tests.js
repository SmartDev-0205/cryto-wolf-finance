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
let MaterialsNFT;
let MaterialsNFTDeployed;
let WolfPacksNFT;
let WolfPacksNFTDeployed;
let Variables;
let VariablesDeployed;
let Hunting;
let HuntingDeployed;
let deployerWallet;
let minterWallet;
let rewardsWallet;
let auxWallet;
let aux2Wallet;

beforeEach(async function () {
    WolfsNFT = await hre.deployments.get('WolfsNFT');
    WolfsNFTDeployed = await ethers.getContractAt('WolfsNFT', WolfsNFT.address);
    MaterialsNFT = await hre.deployments.get('MaterialsNFT');
    MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);
    WolfPacksNFT = await hre.deployments.get('WolfPacksNFT');
    WolfPacksNFTDeployed = await ethers.getContractAt('WolfPacksNFT', WolfPacksNFT.address);
    Variables = await hre.deployments.get('Variables');
    VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);
    CWolfToken = await hre.deployments.get('CWolfToken');
    CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);
    // Hunting = await hre.deployments.get('Hunting');
    // HuntingDeployed = await ethers.getContractAt('Hunting', Hunting.address);
    [deployerWallet, minterWallet, rewardsWallet, auxWallet, aux2Wallet] = await ethers.getSigners();
});

describe("WolfPacksNFT_Proxy", function () {

    describe("Main functionality", function () {

        it("Should be initialized", async function () {
            expect(await WolfPacksNFTDeployed.isInitialized()).to.equal(true);
            expect(await WolfPacksNFTDeployed.owner()).to.equal(deployerWallet.address);
        });

        it("Should first wolf pack minted", async function () {
            const totalSupply = (await WolfPacksNFTDeployed.totalSupply()).toNumber();
            expect(await totalSupply).to.greaterThan(0);
        });

        it("Should give allowance from AUX to Contract", async function () {
            const amount = "100000000000000000000000000000000000";
            await CWolfTokenDeployed.connect(auxWallet).approve(WolfPacksNFTDeployed.address, "0");
            const allowanceBefore = await CWolfTokenDeployed.allowance(auxWallet.address, WolfPacksNFTDeployed.address);
            await CWolfTokenDeployed.connect(auxWallet).approve(WolfPacksNFTDeployed.address, amount);
            const allowanceAfter = await CWolfTokenDeployed.allowance(auxWallet.address, WolfPacksNFTDeployed.address);
            expect(allowanceAfter.sub(allowanceBefore)).to.equal(ethers.BigNumber.from(amount));

            // Allowance para el resto de contratos
            await CWolfTokenDeployed.connect(auxWallet).approve(WolfsNFTDeployed.address, amount);
            await CWolfTokenDeployed.connect(auxWallet).approve(MaterialsNFTDeployed.address, amount);

        });


        describe('mintWithCWOLF function', function () {

            it("Should mint a WOLFPACK (only NFT, no data)", async function () {
                const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
                await expect(WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "10000000000000000" }))
                    .to.emit(WolfPacksNFTDeployed, 'MintedNFT');
            });

            it("Should mint a WOLFPACK in PROMO", async function () {
                const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
                await WolfPacksNFTDeployed.activatePromo();
                const tx = await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "10000000000000000" });
                const res = await tx.wait();
                const wolfPackID = res["events"][1]["args"]._id;
                expect(await WolfPacksNFTDeployed.checkWolfPackStatusPromo(wolfPackID)).true;
            });

            it("Should mint a WOLFPACK in NOT PROMO", async function () {
                const totalSupply = (await WolfsNFTDeployed.totalSupply()).toNumber();
                await WolfPacksNFTDeployed.deactivatePromo();
                const tx = await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "10000000000000000" });
                const res = await tx.wait();
                const wolfPackID = res["events"][1]["args"]._id;
                expect(await WolfPacksNFTDeployed.checkWolfPackStatusPromo(wolfPackID)).false;
            });

            it("Should not generate slots WOLFPACK 0", async function () {
                // Checkear los mappings del WOLF 0
                let totalSlots = await WolfPacksNFTDeployed.getTotalSlotsAvailableInWolfPack(0);
                expect(totalSlots).to.equal(0);
            });

            it("Should not mint if msg.value is less than gasToMinter", async function () {
                await expect(WolfPacksNFTDeployed.mintWithCWOLF({ value: "1" }))
                    .to.be.revertedWith("Not enough gas");
            });

            /*
            it("Should mint a Wolfpack and distribute commission", async function () {
                await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF( { value: "260000000000000000" });
                const balancePost = await provider.getBalance(WolfPacksNFTDeployed.commissionWalletAddress());
                const priceBNB = ethers.utils.formatEther(await VariablesDeployed.priceBNB());
                const balanceFinal = ethers.utils.formatEther(balancePost);
                console.log(priceBNB);
                console.log(balanceFinal);
                expect((priceBNB * balanceFinal).toFixed(2)).to.equal('0.25');
            });
            */

        });

        describe('addWolfToWolfPack function', function () {

            it('Should add a wolf to wolf pack', async function () {

                const randomUUID = uuidv4();
                const seed = (keccak256(randomUUID)).toString('hex');
                await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "100000000000000000" });
                const totalSupplyWolfs = (await WolfsNFTDeployed.totalSupply()).toNumber();
                const idsGeneratedWolfs = [totalSupplyWolfs - 1];
                await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "10000000000000000" });
                const totalSupplyMaterials = (await MaterialsNFTDeployed.totalSupply()).toNumber();
                const idsGeneratedMaterials = [totalSupplyMaterials - 1];
                await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "260000000000000000" });
                const totalSupplyWolfPacks = (await WolfsNFTDeployed.totalSupply()).toNumber();

                await MaterialsNFTDeployed.connect(minterWallet)
                    .generateValuesMaterials(idsGeneratedMaterials, '0x' + seed);

                await WolfsNFTDeployed.connect(minterWallet)
                    .generateValuesWolf(idsGeneratedWolfs, '0x' + seed);

                const getTotalSlotsAvailableInWolfPack1 = await WolfPacksNFTDeployed.getTotalSlotsAvailableInWolfPack(totalSupplyWolfPacks - 1);

                expect(getTotalSlotsAvailableInWolfPack1).to.equal(ethers.BigNumber.from(0));

                await WolfPacksNFTDeployed.connect(auxWallet).addMaterialToWolfPack(totalSupplyWolfPacks - 1, idsGeneratedMaterials);
                const getTotalSlotsAvailableInWolfPack2 = await WolfPacksNFTDeployed.getTotalSlotsAvailableInWolfPack(totalSupplyWolfPacks - 1);
                await WolfPacksNFTDeployed.connect(auxWallet).addWolfToWolfPack(totalSupplyWolfPacks - 1, idsGeneratedWolfs);
                const getTotalSlotsAvailableInWolfPack3 = await WolfPacksNFTDeployed.getTotalSlotsAvailableInWolfPack(totalSupplyWolfPacks - 1);
                expect(getTotalSlotsAvailableInWolfPack2.sub(getTotalSlotsAvailableInWolfPack3)).to.equal(ethers.BigNumber.from(1));

            });


            it('Should add multiple wolfs and multiple materials to wolf pack (addMultipleMaterialsToWolfPack/addMultipleWolfsToWolfPack)', async function () {

                const randomUUID = uuidv4();
                const seed = (keccak256(randomUUID)).toString('hex');
                await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(5, { value: "100000000000000000" });
                const totalSupplyWolfs = (await WolfsNFTDeployed.totalSupply()).toNumber();
                const idsGeneratedWolfs = [totalSupplyWolfs - 1, totalSupplyWolfs - 2, totalSupplyWolfs - 3, totalSupplyWolfs - 4, totalSupplyWolfs - 5];

                await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(5, { value: "10000000000000000" });
                const totalSupplyMaterials = (await MaterialsNFTDeployed.totalSupply()).toNumber();
                const idsGeneratedMaterials = [totalSupplyMaterials - 1, totalSupplyMaterials - 2, totalSupplyMaterials - 3, totalSupplyMaterials - 4, totalSupplyMaterials - 5];

                await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "260000000000000000" });
                const totalSupplyWolfPacks = (await WolfPacksNFTDeployed.totalSupply()).toNumber();

                await MaterialsNFTDeployed.connect(minterWallet)
                    .generateValuesMaterials(idsGeneratedMaterials, '0x' + seed);

                await WolfsNFTDeployed.connect(minterWallet)
                    .generateValuesWolf(idsGeneratedWolfs, '0x' + seed);

                const getTotalSlotsAvailableInWolfPack1 = await WolfPacksNFTDeployed.getTotalSlotsAvailableInWolfPack(totalSupplyWolfPacks - 1);
                expect(getTotalSlotsAvailableInWolfPack1).to.equal(ethers.BigNumber.from(0));

                await WolfPacksNFTDeployed.connect(auxWallet).addMultipleMaterialsToWolfPack(totalSupplyWolfPacks - 1, idsGeneratedMaterials);
                const getTotalSlotsAvailableInWolfPack2 = await WolfPacksNFTDeployed.getTotalSlotsAvailableInWolfPack(totalSupplyWolfPacks - 1);

                await WolfPacksNFTDeployed.connect(auxWallet).addMultipleWolfsToWolfPack(totalSupplyWolfPacks - 1, idsGeneratedWolfs);
                const getTotalSlotsAvailableInWolfPack3 = await WolfPacksNFTDeployed.getTotalSlotsAvailableInWolfPack(totalSupplyWolfPacks - 1);

                expect(getTotalSlotsAvailableInWolfPack2.sub(getTotalSlotsAvailableInWolfPack3)).to.equal(ethers.BigNumber.from(5));

            });

            it('Should add multiple wolfs and multiple materials to wolf pack (addMultipleMaterialsAndWolfsToWolfPack)', async function () {

                const randomUUID = uuidv4();
                const seed = (keccak256(randomUUID)).toString('hex');
                await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(5, { value: "100000000000000000" });
                const totalSupplyWolfs = (await WolfsNFTDeployed.totalSupply()).toNumber();
                const idsGeneratedWolfs = [totalSupplyWolfs - 1, totalSupplyWolfs - 2, totalSupplyWolfs - 3, totalSupplyWolfs - 4, totalSupplyWolfs - 5];

                await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(5, { value: "10000000000000000" });
                const totalSupplyMaterials = (await MaterialsNFTDeployed.totalSupply()).toNumber();
                const idsGeneratedMaterials = [totalSupplyMaterials - 1, totalSupplyMaterials - 2, totalSupplyMaterials - 3, totalSupplyMaterials - 4, totalSupplyMaterials - 5];

                await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "260000000000000000" });
                const totalSupplyWolfPacks = (await WolfPacksNFTDeployed.totalSupply()).toNumber();

                await MaterialsNFTDeployed.connect(minterWallet)
                    .generateValuesMaterials(idsGeneratedMaterials, '0x' + seed);

                await WolfsNFTDeployed.connect(minterWallet)
                    .generateValuesWolf(idsGeneratedWolfs, '0x' + seed);

                const getTotalSlotsAvailableInWolfPack1 = await WolfPacksNFTDeployed.getTotalSlotsAvailableInWolfPack(totalSupplyWolfPacks - 1);

                expect(getTotalSlotsAvailableInWolfPack1).to.equal(ethers.BigNumber.from(0));

                await WolfPacksNFTDeployed.connect(auxWallet).addMultipleMaterialsAndWolfsToWolfPack(totalSupplyWolfPacks - 1, idsGeneratedMaterials, idsGeneratedWolfs);

                const getTotalSlotsInWolfPack2 = await WolfPacksNFTDeployed.getTotalSlotsInWolfPack(totalSupplyWolfPacks - 1);
                const getTotalSlotsAvailableInWolfPack2 = await WolfPacksNFTDeployed.getTotalSlotsAvailableInWolfPack(totalSupplyWolfPacks - 1);
                expect(getTotalSlotsInWolfPack2.sub(getTotalSlotsAvailableInWolfPack2)).to.equal(ethers.BigNumber.from(5));

            });


            it('Should not add a wolf if sender is not the owner of the pack', async function () {
                // Owner of pack0 is minter and the owner of Wolf0 is minter
                const packsOfMinter = await WolfPacksNFTDeployed.walletOfOwner(minterWallet.address);
                await expect(WolfPacksNFTDeployed.connect(deployerWallet).addWolfToWolfPack(packsOfMinter[0], 0))
                    .to.be.revertedWith("WolfPack property failed");
            });

            it('Should not add a wolf if sender is not the owner of the wolf', async function () {
                await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "10000000000000000" });
                await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "10000000000000000" });
                const packsOfMinter = await WolfPacksNFTDeployed.walletOfOwner(minterWallet.address);
                const wolfsOfAux = await WolfsNFTDeployed.walletOfOwner(auxWallet.address);
                await expect(WolfPacksNFTDeployed.connect(minterWallet).addWolfToWolfPack(packsOfMinter[0], wolfsOfAux[0]))
                    .to.be.revertedWith("Wolf property failed");
            });

            it('Should not add a wolf if slots are equal to 0', async function () {
                const packsOfMinter = await WolfPacksNFTDeployed.walletOfOwner(minterWallet.address);
                const wolfsOfMinter = await WolfsNFTDeployed.walletOfOwner(minterWallet.address);
                const slotsOfPack = await WolfPacksNFTDeployed.getTotalSlotsAvailableInWolfPack(packsOfMinter[0]);
                expect(slotsOfPack).to.equal(0);
                await expect(WolfPacksNFTDeployed.connect(minterWallet).addWolfToWolfPack(packsOfMinter[0], wolfsOfMinter[0]))
                    .to.be.revertedWith("Max capacity reached");
            });

        });

        describe('addMaterialToWolfPack function', function () {

            /*
            it('Should add material to wolf pack', async function () {
                const randomUUID = uuidv4();
                const seed = (keccak256(randomUUID)).toString('hex');

                await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "10000000000000000" });
                const materialsOfAux = await MaterialsNFTDeployed.walletOfOwner(auxWallet.address);
                await MaterialsNFTDeployed.connect(deployerWallet)
                    .generateValuesMaterials([materialsOfAux[0]], '0x' + seed);

                const packsOfAux = await WolfPacksNFTDeployed.walletOfOwner(auxWallet.address);
                await WolfPacksNFTDeployed.connect(auxWallet).destroyWolfPack(packsOfAux[0]);
                await WolfPacksNFTDeployed.connect(auxWallet).addMaterialToWolfPack(packsOfAux[0], materialsOfAux[0]);
                const totalMaterialsInWolfPack = await WolfPacksNFTDeployed.getTotalMaterialsInWolfPack(packsOfAux[0]);
                expect(totalMaterialsInWolfPack).to.equal(1);
            });
            */

            /*
            it('Should add multiple materials to wolf pack', async function () {
                const randomUUID = uuidv4();
                const seed = (keccak256(randomUUID)).toString('hex');
                await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "260000000000000000" });
                await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(10, { value: "10000000000000000000" });
                const materialsOfAux = await MaterialsNFTDeployed.walletOfOwner(auxWallet.address);
                console.log(materialsOfAux.length);
                await MaterialsNFTDeployed.connect(deployerWallet)
                    .generateValuesMaterials(materialsOfAux, '0x' + seed);
                const packsOfAux = await WolfPacksNFTDeployed.walletOfOwner(auxWallet.address);
                console.log(packsOfAux);
                await WolfPacksNFTDeployed.connect(auxWallet).addMultipleMaterialsToWolfPack(packsOfAux[0], [6, 7, 8, 9]);
                const totalMaterialsInWolfPack = await WolfPacksNFTDeployed.getTotalMaterialsInWolfPack(packsOfAux[0]);
                expect(totalMaterialsInWolfPack).to.equal(4);
            });
            */

            it('Should not add a wolf if sender is not the owner of the pack', async function () {
                // Owner of pack0 is minter and the owner of Wolf0 is minter
                const packsOfMinter = await WolfPacksNFTDeployed.walletOfOwner(minterWallet.address);
                await expect(WolfPacksNFTDeployed.connect(deployerWallet).addMaterialToWolfPack(packsOfMinter[0], 0))
                    .to.be.revertedWith("WolfPack property failed");
            });

            it('Should not add a material if sender is not the owner of the material', async function () {
                await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "10000000000000000" });
                await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "10000000000000000" });
                const packsOfMinter = await WolfPacksNFTDeployed.walletOfOwner(minterWallet.address);
                const materialsOfAux = await MaterialsNFTDeployed.walletOfOwner(auxWallet.address);
                await expect(WolfPacksNFTDeployed.connect(minterWallet).addMaterialToWolfPack(packsOfMinter[0], materialsOfAux[0]))
                    .to.be.revertedWith("Material property failed");
            });

            it('Should not add a material if limit 20 is reached', async function () {
                const packOfAux = await WolfPacksNFTDeployed.walletOfOwner(auxWallet.address);
                // Fill all the slots of wolfpack until 20 materials
                for (let i = 0; i < 21; i++) {
                    const tx = await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(1, { value: "10000000000000000" });
                    const res = await tx.wait();
                    const tokenId = res.events[3].args[1];
                    const totalMaterial = await WolfPacksNFTDeployed.getTotalMaterialsInWolfPack(packOfAux[0]);
                    if (i < 20 && totalMaterial.toString() !== '20')
                        await WolfPacksNFTDeployed.connect(auxWallet).addMaterialToWolfPack(packOfAux[0], tokenId);
                    else
                        await expect(WolfPacksNFTDeployed.connect(auxWallet).addMaterialToWolfPack(packOfAux[0], tokenId))
                            .to.be.revertedWith("Limit 20 reached");
                }
                WolfPacksNFTDeployed.connect(auxWallet).destroyWolfPack(packOfAux[0]);
            });

        });

        describe('destroyWolfPack', function () {

            it('Should not destroy a wolfpack if sender is not the owner of the pack', async function () {
                // Owner of pack0 is minter and the owner of Wolf0 is minter
                const packsOfMinter = await WolfPacksNFTDeployed.walletOfOwner(minterWallet.address);
                await expect(WolfPacksNFTDeployed.connect(deployerWallet).destroyWolfPack(packsOfMinter[0]))
                    .to.be.revertedWith("WolfPack property failed");
            });

            it('Should destroy a wolf pack', async function () {

                const totalSupplyWolfPacks = (await WolfPacksNFTDeployed.totalSupply()).toNumber();
                console.log('totalSupplyWolfPacks: ', totalSupplyWolfPacks);

                // const wolfInWolfPack = await WolfPacksNFTDeployed.wolfsInWolfPack(totalSupplyWolfPacks - 1, 0);
                // console.log('wolfInWolfPack:', wolfInWolfPack);

                //await WolfPacksNFTDeployed.connect(auxWallet).destroyWolfPack(totalSupplyWolfPacks - 1);
            });

        });

        describe('pointsOfWolfPack', function () {

            it('Should exists the wolfpack', async function () {
                await expect(WolfPacksNFTDeployed.pointsOfWolfPack(100000)).to.be.revertedWith("");
            });

            it('Should get total point of wolfpack', async function () {

                const randomUUID = uuidv4();
                const seed = (keccak256(randomUUID)).toString('hex');
                await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(5, { value: "100000000000000000" });
                const totalSupplyWolfs = (await WolfsNFTDeployed.totalSupply()).toNumber();
                const idsGeneratedWolfs = [totalSupplyWolfs - 1, totalSupplyWolfs - 2, totalSupplyWolfs - 3, totalSupplyWolfs - 4, totalSupplyWolfs - 5];

                await MaterialsNFTDeployed.connect(auxWallet).mintWithCWOLF(5, { value: "10000000000000000" });
                const totalSupplyMaterials = (await MaterialsNFTDeployed.totalSupply()).toNumber();
                const idsGeneratedMaterials = [totalSupplyMaterials - 1, totalSupplyMaterials - 2, totalSupplyMaterials - 3, totalSupplyMaterials - 4, totalSupplyMaterials - 5];

                await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "260000000000000000" });
                const totalSupplyWolfPacks = (await WolfPacksNFTDeployed.totalSupply()).toNumber();
                console.log('totalSupplyWolfPacks:', totalSupplyWolfPacks);

                await MaterialsNFTDeployed.connect(minterWallet)
                    .generateValuesMaterials(idsGeneratedMaterials, '0x' + seed);

                await WolfsNFTDeployed.connect(minterWallet)
                    .generateValuesWolf(idsGeneratedWolfs, '0x' + seed);

                let totalAttack = 0;
                for (let index = 0; index < idsGeneratedWolfs.length; index++) {
                    const element = idsGeneratedWolfs[index];
                    totalAttack = totalAttack + ((await WolfsNFTDeployed.getWolfProperties(element))[3]).toNumber()
                }

                // TODO: TEST INCOMPLETO.  SÓLO SE MIRA LA CANTIDAD POR LOBO, PERO NO SE COMPARA CN LA FUNCIÓN DEL CONTRATO

                // TODO:  LA FUNCIÓN wolfsInWolfPack no tiene TEST y creo que falla.

                return;

                /*
                const seed = '1fe1a9eb627679eb82711c95e1ec2af099f12a73c1c3afe51c926abb9213b4b5'.toString('hex');
                const materialsOfAux = await MaterialsNFTDeployed.walletOfOwner(auxWallet.address);
                const packsOfAux = await WolfPacksNFTDeployed.walletOfOwner(auxWallet.address);
                const wolfsOfAux = await WolfsNFTDeployed.connect(auxWallet).walletOfOwner(auxWallet.address);
                await MaterialsNFTDeployed.connect(deployerWallet)
                    .generateValuesMaterials([materialsOfAux[0]], '0x' + seed);
                await WolfPacksNFTDeployed.connect(auxWallet).addMaterialToWolfPack(packsOfAux[0], materialsOfAux[0]);
                await WolfsNFTDeployed.connect(auxWallet).mintWithCWOLF(3, { value: "100000000000000000" });
                await WolfsNFTDeployed.connect(deployerWallet).generateValuesWolf([wolfsOfAux[5]], '0x' + seed);
                await WolfPacksNFTDeployed.connect(auxWallet).addWolfToWolfPack(packsOfAux[0], wolfsOfAux[0]);
                const wolfProperties = await WolfsNFTDeployed.getWolfProperties(wolfsOfAux[0]);
                const attackPoints = parseInt(wolfProperties[3]);
                const totalPoints = await WolfPacksNFTDeployed.pointsOfWolfPack(packsOfAux[0]);
                expect(attackPoints).to.equal(totalPoints);
                */
            });

        });
    });

    describe("Buy energy", function () {
        // Test block for buyEnergy

        it("Should not buy energy if not owner of the wolfpack", async function () {
            await expect(WolfPacksNFTDeployed.connect(auxWallet).buyEnergy(0, 2000))
                .to.be.revertedWith("Owner of WolfPack failed");
        });

        it("Should not buy energy if amount of CWOLF is not valid", async function () {
            const packsOfAux = await WolfPacksNFTDeployed.walletOfOwner(auxWallet.address);
            await expect(WolfPacksNFTDeployed.connect(auxWallet).buyEnergy(packsOfAux[packsOfAux.length - 1], "2000"))
                .to.be.revertedWith("The amount is not valid");
        });

        it("Should not buy energy if allowance of CWOLF is not valid", async function () {
            const packsOfAux = await WolfPacksNFTDeployed.walletOfOwner(auxWallet.address);
            await CWolfTokenDeployed.connect(auxWallet).approve(WolfPacksNFTDeployed.address, "0");
            await expect(WolfPacksNFTDeployed.connect(auxWallet).buyEnergy(packsOfAux[packsOfAux.length - 1], "2000000000000000000"))
                .to.be.revertedWith("Not enough allowance");
        });

        it("Should buy energy and transfer CWOLF correctly to reward pool", async function () {
            const allowanceAmount = "1000000000000000000000000000000000000"
            const cwolfAmount = "200000000000000000000"
            const packsOfAux = await WolfPacksNFTDeployed.walletOfOwner(auxWallet.address);
            await CWolfTokenDeployed.connect(auxWallet).approve(WolfPacksNFTDeployed.address, allowanceAmount);
            const preBalance = await CWolfTokenDeployed.balanceOf(rewardsWallet.address);
            const bnCWOLF = ethers.BigNumber.from(cwolfAmount);
            await WolfPacksNFTDeployed.connect(auxWallet).buyEnergy(packsOfAux[packsOfAux.length - 1], cwolfAmount);
            const postBalance = await CWolfTokenDeployed.balanceOf(rewardsWallet.address);
            expect(postBalance).to.equal(bnCWOLF.add(preBalance));
        });

    });

    describe("Decrease life", function () {
        it("Shoould not decrease energy if not hunting contract", async function () {
            await WolfPacksNFTDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            await expect(WolfPacksNFTDeployed.connect(deployerWallet).decreaseWolfPackLife(0, 1)).to.be.revertedWith("Caller is not Hunting contract");
        });

        /*
        it.only("Should decrease but not kill wolfpack", async function () {

            const totalSupply = await WolfPacksNFTDeployed.totalSupply();
            console.log('totalSupply: ', totalSupply.toNumber());

            await WolfPacksNFTDeployed.connect(auxWallet).buyEnergy(5, '1000000000000000000');


            const x = await WolfPacksNFTDeployed.pointsOfWolfPack(5);
            const y = await WolfPacksNFTDeployed.wolfPackLife(5);
            const z = await WolfPacksNFTDeployed.wolfPackEnergy(5);
            console.log('x: ', x.toString());
            console.log('y: ', y.toString());
            console.log('z: ', z.toString());

            // for (let index = 1; index < totalSupply; index++) {
            //     try {
            //         console.log('AAAA: ', await WolfPacksNFTDeployed.wolfsInWolfPack(index, 0));
            //         console.log('index: ', index);
            //     }
            //     catch (error) {
            //         console.log(error)
            //     }
            //     // const x = await WolfPacksNFTDeployed.pointsOfWolfPack(index);
            //     // const y = await WolfPacksNFTDeployed.wolfPackLife(index);
            //     // console.log('x: ', x);
            //     // console.log('y: ', y);

            // }
            
        });
        */


        it("Should decrease but not kill wolfpack", async function () {
            const packsOfAux = await WolfPacksNFTDeployed.walletOfOwner(auxWallet.address);
            await WolfPacksNFTDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            let life = await WolfPacksNFTDeployed.wolfPackLife(packsOfAux[2]);
            console.log('life: ', life.toString());
            await WolfPacksNFTDeployed.connect(aux2Wallet).decreaseWolfPackLife(packsOfAux[2], 1);
            console.log('packsOfAux[2]: ', packsOfAux[2].toString());
            expect(await WolfPacksNFTDeployed.wolfPackLife(packsOfAux[2])).to.equal(life - 1);
        });

        it("Should decrease and kill wolfpack", async function () {
            const packsOfAux = await WolfPacksNFTDeployed.walletOfOwner(auxWallet.address);
            await WolfPacksNFTDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            let life = await WolfPacksNFTDeployed.wolfPackLife(packsOfAux[2]);
            await WolfPacksNFTDeployed.connect(aux2Wallet).decreaseWolfPackLife(packsOfAux[2], life);
            expect(await WolfPacksNFTDeployed.wolfPackLife(packsOfAux[2])).to.equal(0);
            expect(await WolfPacksNFTDeployed.checkWolfPackStatusDeadOrAlive(packsOfAux[2])).false;
        });
    });

    describe("Tests for promo", function () {

        it('Should set days of promo', async function () {
            const daysOfPromo = await WolfPacksNFTDeployed.daysOfPromo();
            await WolfPacksNFTDeployed.setDaysOfPromo(0);
            expect(await WolfPacksNFTDeployed.daysOfPromo()).equal(0);
            await WolfPacksNFTDeployed.setDaysOfPromo(daysOfPromo);
        });

        it('should activate promo', async function () {
            const tx = await WolfPacksNFTDeployed.activatePromo();
            const block = await provider.getBlock(tx.blockNumber);
            expect(await WolfPacksNFTDeployed.isPromoActive()).true;
            expect(block.timestamp).equal(await WolfPacksNFTDeployed.dateLastPromoActivation())
        });

        it('should deactivate promo', async function () {
            await WolfPacksNFTDeployed.deactivatePromo();
            expect(await WolfPacksNFTDeployed.isPromoActive()).false;
            expect(0).equal(await WolfPacksNFTDeployed.dateLastPromoActivation())
        });

        it('should set status promo in true', async function () {
            const packsOfAux = await WolfPacksNFTDeployed.walletOfOwner(minterWallet.address);
            const packId = packsOfAux[packsOfAux.length - 1];
            await WolfPacksNFTDeployed.connect(deployerWallet).setPromoStatusForWolfPack(packId, true);
            expect(await WolfPacksNFTDeployed.checkWolfPackStatusPromo(packId)).true;
        });

        it('should set status promo in true', async function () {
            const packsOfAux = await WolfPacksNFTDeployed.walletOfOwner(minterWallet.address);
            const packId = packsOfAux[packsOfAux.length - 1];
            await WolfPacksNFTDeployed.connect(deployerWallet).setPromoStatusForWolfPack(packId, false);
            expect(await WolfPacksNFTDeployed.checkWolfPackStatusPromo(packId)).false;
        });

    });

    describe("Pause contract tests", function () {
        // Pause contract
        it("Should pause contract", async function () {
            await expect(WolfPacksNFTDeployed.pause())
                .to.emit(WolfPacksNFTDeployed, 'Paused')
                .withArgs(deployerWallet.address);
        });

        it("Should not mint if contract is paused", async function () {
            await expect(WolfPacksNFTDeployed.mintWithCWOLF({ value: "100000000000000000" }))
                .to.be.revertedWith("Pausable: paused");
        });

        // Unpause contract
        it("Should unpause contract", async function () {
            await expect(WolfPacksNFTDeployed.unpause())
                .to.emit(WolfPacksNFTDeployed, 'Unpaused')
                .withArgs(deployerWallet.address);
        });

        it("Should mint if contract is unpaused", async function () {
            expect(await WolfPacksNFTDeployed.connect(auxWallet).mintWithCWOLF({ value: "100000000000000000" }))
        });

    });

    describe('Test parameter modifications', function () {

        it('should change rewardsPoolAddress', async function () {
            await WolfPacksNFTDeployed.changeRewardsPoolAddress(auxWallet.address);
            expect(await WolfPacksNFTDeployed.rewardsPoolAddress()).to.equal(auxWallet.address);
            await WolfPacksNFTDeployed.changeRewardsPoolAddress(rewardsWallet.address);
            expect(await WolfPacksNFTDeployed.rewardsPoolAddress()).to.equal(rewardsWallet.address);
        });

        it('should change addWolfOrMaterialCWOLFInDollar', async function () {
            const initialAddWolfOrMaterialCWOLFInDollar = await WolfPacksNFTDeployed.addWolfOrMaterialCWOLFInDollar();
            await WolfPacksNFTDeployed.changeAddWolfOrMaterialCWOLFInDollar(1);
            expect(await WolfPacksNFTDeployed.addWolfOrMaterialCWOLFInDollar()).to.equal(1);
            await WolfPacksNFTDeployed.changeAddWolfOrMaterialCWOLFInDollar(initialAddWolfOrMaterialCWOLFInDollar);
            expect(await WolfPacksNFTDeployed.addWolfOrMaterialCWOLFInDollar()).to.equal(initialAddWolfOrMaterialCWOLFInDollar);

        });

        it('should change gasToMinter', async function () {
            const initialGasToMinter = await WolfPacksNFTDeployed.gasToMinter();
            expect(initialGasToMinter).to.equal(1000000000000000);
            await WolfPacksNFTDeployed.changeGasToMinter(500);
            expect(await WolfPacksNFTDeployed.gasToMinter()).to.equal(500);
            await WolfPacksNFTDeployed.changeGasToMinter(initialGasToMinter);
        });

        it('should change CWOLFContractAddress', async function () {
            const CWOLFContractAddress = await WolfPacksNFTDeployed.CWOLFContractAddress();
            expect(CWOLFContractAddress).to.equal(CWOLFContractAddress);
            await WolfPacksNFTDeployed.changeCWOLFContractAddress(auxWallet.address);
            expect(await WolfPacksNFTDeployed.CWOLFContractAddress()).to.equal(auxWallet.address);
            await WolfPacksNFTDeployed.changeCWOLFContractAddress(CWOLFContractAddress);
        });

        it('should change wolfsNFTContractAddress', async function () {
            const WolfsNFTContractAddress = await WolfPacksNFTDeployed.WolfsNFTContractAddress();
            expect(WolfsNFTContractAddress).to.equal(WolfsNFTContractAddress);
            await WolfPacksNFTDeployed.changeWolfsNFTContractAddress(auxWallet.address);
            expect(await WolfPacksNFTDeployed.WolfsNFTContractAddress()).to.equal(auxWallet.address);
            await WolfPacksNFTDeployed.changeWolfsNFTContractAddress(WolfsNFTContractAddress);
        });

        it('should change materialsNFTContractAddress', async function () {
            const MaterialsNFTContractAddress = await WolfPacksNFTDeployed.MaterialsNFTContractAddress();
            expect(MaterialsNFTContractAddress).to.equal(MaterialsNFTContractAddress);
            await WolfPacksNFTDeployed.changeMaterialsNFTContractAddress(auxWallet.address);
            expect(await WolfPacksNFTDeployed.MaterialsNFTContractAddress()).to.equal(auxWallet.address);
            await WolfPacksNFTDeployed.changeMaterialsNFTContractAddress(MaterialsNFTContractAddress);
        });

        it('should change minterWalletAddress', async function () {
            expect(await WolfPacksNFTDeployed.minterWalletAddress()).to.equal(minterWallet.address);
            await WolfPacksNFTDeployed.changeAddressMinterWallet(auxWallet.address);
            expect(await WolfPacksNFTDeployed.minterWalletAddress()).to.equal(auxWallet.address);
            await WolfPacksNFTDeployed.changeAddressMinterWallet(minterWallet.address);
        });

        it('should change commission wallet address', async function () {
            expect(await WolfPacksNFTDeployed.commissionWalletAddress()).to.equal(await WolfPacksNFTDeployed.commissionWalletAddress());
            await WolfPacksNFTDeployed.changeAddressCommissionWallet(auxWallet.address);
            expect(await WolfPacksNFTDeployed.commissionWalletAddress()).to.equal(auxWallet.address);
            await WolfPacksNFTDeployed.changeAddressCommissionWallet(WolfPacksNFTDeployed.commissionWalletAddress());
        });

        it('should change HuntingNFTContract address', async function () {
            const HuntingNFTContractAddress = await WolfPacksNFTDeployed.HuntingNFTContractAddress();
            expect(await WolfPacksNFTDeployed.HuntingNFTContractAddress()).to.equal(HuntingNFTContractAddress);
            await WolfPacksNFTDeployed.changeHuntingNFTContractAddress(auxWallet.address);
            expect(await WolfPacksNFTDeployed.HuntingNFTContractAddress()).to.equal(auxWallet.address);
            await WolfPacksNFTDeployed.changeHuntingNFTContractAddress(HuntingNFTContractAddress);
        });

        // TODO: Probar esto con el impersonate de hardhat
        it('should set last hunting', async function () {
            await WolfPacksNFTDeployed.connect(deployerWallet).changeHuntingNFTContractAddress(aux2Wallet.address);
            const packsOfMinter = await WolfPacksNFTDeployed.walletOfOwner(minterWallet.address);
            await WolfPacksNFTDeployed.connect(aux2Wallet).setLastHunting(packsOfMinter[0], 3);
            expect(await WolfPacksNFTDeployed.lastHunting(packsOfMinter[0])).to.equal(3);
        });

    });

});