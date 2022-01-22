// npx hardhat run scripts/bscMainnet/change_commissions_MaterialsNFT.js --network 

const hre = require("hardhat");

async function main() {

    const HuntingNFT = await hre.deployments.get('HuntingNFT_Proxy');
    const HuntingNFTDeployed = await ethers.getContractAt('HuntingNFT', HuntingNFT.address);

    const tx = await HuntingNFTDeployed.initializeBnbForMint();;

    await tx.await(5);

    const tx2 = await HuntingNFTDeployed.initializeBenefits();;




}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

