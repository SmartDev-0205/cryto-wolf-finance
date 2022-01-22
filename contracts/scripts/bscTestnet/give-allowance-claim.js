// npx hardhat run scripts/test2.js --network localhost

const hre = require("hardhat");

async function main() {

    [deployerWallet, rewardsWallet] = await hre.ethers.getSigners();

    
    const CWolfToken = await  hre.deployments.get('CWolfToken_Proxy');
    console.log(CWolfToken.address);
    const CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);

    console.log(rewardsWallet);
    await CWolfTokenDeployed.connect(rewardsWallet).approve('0xDE82c0f3edf7d3B2ecc7f6948baC455b66582D76', '10000000000000000000000000000000000000000000000000000000000000000000');

    // console.log(tx);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

