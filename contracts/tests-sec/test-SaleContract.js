// npx hardhat test

const { expect } = require("chai");
const { ethers } = require("hardhat");
const config = require("../../config.js");
const { BigNumber } = require('ethers');

//!  Meter el deploy en un beforeEach

describe("Sale", () => {

    /*
    it("Add some addresses and balance of the first presale", async function () {
        const Sale = await ethers.getContractFactory('Sale');
        const SaleDeployed = await Sale.deploy(config.wolfAddress);
        await SaleDeployed.deployed();

        const address1 = '0x3f81011729c104c38CbeD362ba050f83621a73a2';
        const address2 = '0x759a1040B2bc2220f8ef16aC12E4B6A18d3d2DF7';

        const supplyBefore =  BigNumber.from(await SaleDeployed.remainingSupply());
        console.log('supplyBefore:', supplyBefore.toString());

        const tx = await SaleDeployed.addAddresses(
            [address1, address2], [100, 200]
        );

        const supplyAfter =  BigNumber.from(await SaleDeployed.remainingSupply());
        console.log('supplyAfter:', supplyAfter.toString());

        await tx.wait();

        expect(await SaleDeployed.remainingSupply()).to.equal(supplyBefore.sub(300));
        expect(await SaleDeployed.initialTokens(address1)).to.equal(100);
        expect(await SaleDeployed.initialTokens(address2)).to.equal(200);

    });
    */

    /*
    it("Buy 10$ BUSD", async function () {

        
        const BUSD = await ethers.getContractFactory("BUSD");
        console.log('BUSD:', BUSD);

        const address1 = '0x3f81011729c104c38CbeD362ba050f83621a73a2';

        const supplyBefore = BigNumber.from(await SaleDeployed.remainingSupply());
        console.log('supplyBefore:', supplyBefore.toString());

        const tx = await SaleDeployed.buy('10000000000000000000');

        const supplyAfter = BigNumber.from(await SaleDeployed.supremainingSupplyply());
        console.log('supplyAfter:', supplyAfter.toString());

        await tx.wait();
                
        expect(await SaleDeployed.remainingSupply()).to.equal(supplyBefore.sub(300));
        expect(await SaleDeployed.initialTokens(address1)).to.equal(100);
        expect(await SaleDeployed.initialTokens(address2)).to.equal(200);
        
    });
    */

    /*
    it("Claim 0", async function () {
        const Sale = await ethers.getContractFactory('Sale');
        const SaleDeployed = await Sale.deploy(config.wolfAddress);
        await SaleDeployed.deployed();

        const actualTimestamp = Math.round(Date.now() / 1000);
        const seconsdsInAWeek = 604800;

        await SaleDeployed.addAddresses([(await hre.ethers.getSigner()).address], [10000]);

        await SaleDeployed.setblockTimestamp20(actualTimestamp);
        await SaleDeployed.setblockTimestamp40(actualTimestamp + seconsdsInAWeek);
        await SaleDeployed.setblockTimestamp60(actualTimestamp + seconsdsInAWeek * 2);
        await SaleDeployed.setblockTimestamp80(actualTimestamp + seconsdsInAWeek * 3);
        await SaleDeployed.setblockTimestamp100(actualTimestamp + seconsdsInAWeek * 4);

        
        await expect(
             SaleDeployed.claim(10)
        ).to.be.revertedWith("Nothing to claim");
        
    });
    */

    it("Claim 20", async function () {

        const CWolfToken = await hre.ethers.getContractFactory("CWolfToken");
        const CWolfTokenDeployed = await CWolfToken.deploy();
        await CWolfTokenDeployed.deployed();
        console.log('CWolfTokenDeployed: ', CWolfTokenDeployed.address);

        const Sale = await ethers.getContractFactory('Sale');
        const SaleDeployed = await Sale.deploy(CWolfTokenDeployed.address);
        await SaleDeployed.deployed();
        console.log('SaleDeployed: ', SaleDeployed.address);

        // console.log('AAA: ',  (await hre.ethers.getSigner()).address   )
        // console.log('XXX: ', (await CWolfTokenDeployed.balanceOf((await hre.ethers.getSigner()).address)).toString()) ;
        // console.log('addressWolf: ', CWolfTokenDeployed.address);


        console.log('ABC:', (await CWolfTokenDeployed.balanceOf(SaleDeployed.address)).toString());
        await CWolfTokenDeployed.transfer(SaleDeployed.address, "2000000000000000000000000");
        console.log('ABC:', (await CWolfTokenDeployed.balanceOf(SaleDeployed.address)).toString());


        const actualTimestamp = Math.round(Date.now() / 1000);
        const seconsdsInAWeek = 604800;

        await SaleDeployed.addAddresses(["0x3f81011729c104c38CbeD362ba050f83621a73a2"], [10000]);

        await SaleDeployed.setBlocksTimestamp([
            actualTimestamp - seconsdsInAWeek *2,
            actualTimestamp - seconsdsInAWeek,
            actualTimestamp + seconsdsInAWeek * 1,
            actualTimestamp + seconsdsInAWeek * 2,
            actualTimestamp + seconsdsInAWeek * 3
        ]);
        /*
        await SaleDeployed.setBlocksTimestamp([
            actualTimestamp + seconsdsInAWeek * 2,
            actualTimestamp + seconsdsInAWeek * 4,
            actualTimestamp + seconsdsInAWeek * 6,
            actualTimestamp + seconsdsInAWeek * 8,
            actualTimestamp + seconsdsInAWeek * 10
        ]);
        */
        
        await SaleDeployed.claim(2100);
        console.log('CWOLF MY WALLET:', (await CWolfTokenDeployed.balanceOf("0x3f81011729c104c38CbeD362ba050f83621a73a2")).toString());


        /*
        await expect(
            SaleDeployed.claim(20000)
        ).to.be.revertedWith("Amount exceeded");
        */

    });


});
