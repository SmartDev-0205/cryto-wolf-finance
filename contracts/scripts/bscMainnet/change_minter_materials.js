// npx hardhat run scripts/change_minter_materials.js --network 

const hre = require("hardhat");

async function main() {

    const MaterialsNFT = await hre.deployments.get('MaterialsNFT_Proxy');
    const MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);

    const tx = await MaterialsNFTDeployed.changeAddressMinterWallet('0x927FF3555fA6b3c3a703736a154a40836C236795');

    console.log(tx);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

