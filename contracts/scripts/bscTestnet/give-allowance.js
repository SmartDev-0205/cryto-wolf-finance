// npx hardhat run scripts/test2.js --network localhost

const hre = require("hardhat");

async function main() {

    [deployerWallet] = await ethers.getSigners();

    console.log(deployerWallet);

    // const MaterialsNFT = await hre.deployments.get('MaterialsNFT_Proxy');
    // const MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);

    // const tx = await MaterialsNFTDeployed.changeGasToMinter('500000000000000');

    // console.log(tx);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

