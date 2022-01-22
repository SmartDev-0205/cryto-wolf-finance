// npx hardhat run scripts/20-deploy-Sale.js --network hardhat

const fs = require('fs').promises;
const chalk = require('chalk');
const hre = require("hardhat");
const config = require("../../config.js");

async function main() {

  // We get the contract to deploy
  const Sale = await hre.ethers.getContractFactory("Sale");
  const SaleDeployed = await Sale.deploy(config.wolfAddress);
  await SaleDeployed.deployed();

  console.log('SaleDeployed.address:', SaleDeployed.address);

  // Save to a file
  // Save address to a file
  console.log('Writing contract address to a file in shared folder...')
  const data = {
    address: SaleDeployed.address
  }
  await fs.writeFile(`./data/Sale.json`, JSON.stringify(data, null, 4), { flag: 'w' });
  console.log('...done\n');

  // Info deployed
  console.log(chalk.blue('SaleDeployed deployed to:', SaleDeployed.address));
  
  // Verify contract
  console.log(chalk.green('To verify the contract execute:'));
  console.log(chalk.greenBright('npx hardhat verify --network rinkeby ' + SaleDeployed.address + ' "' + config.wolfAddress + '"' + '\n\n'));

  const CWolfToken = await hre.ethers.getContractFactory("CWolfToken");
  const CWolfTokenDeployed = await CWolfToken.deploy();
  await CWolfTokenDeployed.deployed();

  console.log('CWolfTokenDeployed.address:', CWolfTokenDeployed.address);

  await CWolfTokenDeployed.approve(SaleDeployed.address, "2000000000000000000000000");

  const allowance = await CWolfTokenDeployed.allowance((await hre.ethers.getSigner()).address, SaleDeployed.address);
  console.log('Allowance:', allowance.toString());

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
