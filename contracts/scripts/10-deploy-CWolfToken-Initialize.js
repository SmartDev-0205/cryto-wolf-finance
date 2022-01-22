// npx hardhat run scripts/10-deploy-CWolfToken-Initialize.js --network rinkeby

const hre = require("hardhat");

async function main() {

    const CWolfToken = await  hre.deployments.get('CWolfToken_Proxy');
    const CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);
    const tx = await CWolfTokenDeployed.initialize();

    console.log('tx: ', tx);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

