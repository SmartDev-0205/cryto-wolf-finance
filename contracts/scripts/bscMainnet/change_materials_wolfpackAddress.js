// npx hardhat run scripts/bscMainnet/change_materials_wolfpackAddress.js --network 

const hre = require("hardhat");

async function main() {

    const MaterialsNFT = await hre.deployments.get('MaterialsNFT_Proxy');
    const MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);

    const tx = await MaterialsNFTDeployed.changeWolfPackNFTContractAddress('0x0ede2D3d3A1a649801128b1205dB235aDB255C8C');

    console.log(tx);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

