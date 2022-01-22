// npx hardhat run scripts/bscMainnet/change_commissions_WolfsNFT.js --network 

const hre = require("hardhat");

async function main() {

    const WolfsNFT = await hre.deployments.get('WolfsNFT_Proxy');
    const WolfsNFTDeployed = await ethers.getContractAt('WolfsNFT', WolfsNFT.address);

    const tx = await WolfsNFTDeployed.changeGasToMinter('1000000000000000');

    console.log(tx);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

