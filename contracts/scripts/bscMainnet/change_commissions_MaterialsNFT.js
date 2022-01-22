// npx hardhat run scripts/bscMainnet/change_commissions_MaterialsNFT.js --network 

const hre = require("hardhat");

async function main() {

    const MaterialsNFT = await hre.deployments.get('MaterialsNFT_Proxy');
    const MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);

    const tx = await MaterialsNFTDeployed.changeGasToMinter('500000000000000');;

    console.log(tx);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

