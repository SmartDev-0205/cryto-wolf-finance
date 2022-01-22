// npx hardhat run scripts/10000-deploy-Test.js --network hardhat

const fs = require('fs').promises;
const chalk = require('chalk');
const hre = require("hardhat");
const config = require("../../config.js");

async function main() {

  var fechaEnMiliseg = Date.now();
  console.log(Math.round(fechaEnMiliseg/1000));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
