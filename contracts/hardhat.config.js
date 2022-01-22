// import('hardhat/config').HardhatUserConfig;

require("@nomiclabs/hardhat-waffle");
require("dotenv").config({ path: "./.env" }).parsed;
require("dotenv").config({ path: "./.env.private" }).parsed;
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");
require('hardhat-contract-sizer');
require("hardhat-gas-reporter");

// console.log(process.env)

// console.log('private: ', private);

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },

  /*
  paths: {
    artifacts: "./packages/frontend/src/artifacts",
  },
  */

  namedAccounts: {
    deployer: 0,
  },

  defaultNetwork: "hardhat",

  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_HTTP_URL,
      },
      accounts: [
        {
          privateKey: `0x${process.env.ACCOUNT_PRIVATE_KEY_DEVELOPER}`,
          balance: "1000000000000000000000",
        },
        {
          privateKey: `0x${process.env.ACCOUNT_PRIVATE_KEY_MINTER}`,
          balance: "1000000000000000000000",
        },
        {
          privateKey: `0x${process.env.ACCOUNT_PRIVATE_KEY_REWARDS}`,
          balance: "1000000000000000000000",
        },
        {
          privateKey: `0x${process.env.ACCOUNT_PRIVATE_KEY_AUX}`,
          balance: "1000000000000000000000",
        },
        {
          privateKey: `0x${process.env.ACCOUNT_PRIVATE_KEY_AUX2}`,
          balance: "1000000000000000000000",
        }
        
      ],
    },

    bscMainnet: {
      url: process.env.MAINNET_HTTP_URL,
      accounts: [`0x${process.env.ACCOUNT_PRIVATE_KEY_DEVELOPER}`],
      gas: 2100000,
      gasPrice: 9000000000,
    },

    bscTestnet: {
      url: process.env.BSC_TESTNET_HTTP_URL,
      accounts: [`0x${process.env.ACCOUNT_PRIVATE_KEY_DEVELOPER}`],
      gas: 2100000,
      gasPrice: 8000000000,
    },
  },

  mocha: {
    timeout: 100000000,
  },

  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true
  },

  /*
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
*/

  //TESTNET
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY,
  },
};
