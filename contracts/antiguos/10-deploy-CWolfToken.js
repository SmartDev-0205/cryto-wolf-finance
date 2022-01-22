// npx hardhat run scripts/10-deploy-CWolfToken.js --network hardhat

const fs = require('fs').promises;
const chalk = require('chalk');
const hre = require("hardhat");
const config = require("../../config.js");

async function main() {

  // We get the contract to deploy
  const CWolfToken = await hre.ethers.getContractFactory("CWolfToken");
  const CWolfTokenDeployed = await CWolfToken.deploy();
  await CWolfTokenDeployed.deployed();

  // Save to a file
  // Save address to a file
  console.log('Writing contract address to a file in shared folder...')
  const data = {
    address: CWolfTokenDeployed.address
  }
  await fs.writeFile(`./data/CWolfToken.json`, JSON.stringify(data, null, 4), { flag: 'w' });
  console.log('...done\n');

  // Info deployed
  console.log(chalk.blue('CWolfTokenDeployed deployed to:', CWolfTokenDeployed.address));
  
  // Verify contract
  console.log(chalk.green('To verify the contract execute:'));
  console.log(chalk.greenBright('npx hardhat verify --network rinkeby ' + CWolfTokenDeployed.address + '\n\n'));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
