require("dotenv").config({ path: "./../.env.private" }).parsed;
const hre = require("hardhat");
const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    [deployerWallet, minterWallet, rewardsWallet] = await ethers.getSigners();

    const Pool = await hre.ethers.getContractFactory('Pool');
    const pool = await Pool.deploy("0x0e5903749fCa586a0d22F2d190A49008D21894a6", "0x2c603792F3f04f5E1a45dbAaB748b9C7547261D1", "1000000000000000000", 0, "0x2c603792F3f04f5E1a45dbAaB748b9C7547261D1");
    console.log("Pool deployed at: ", pool.address);

};
module.exports.tags = ['Pool'];
