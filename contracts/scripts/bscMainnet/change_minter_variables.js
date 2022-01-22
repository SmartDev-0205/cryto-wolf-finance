// npx hardhat run scripts/change_minter_variables.js --network 

const hre = require("hardhat");

async function main() {

    const Variables = await hre.deployments.get('Variables_Proxy');
    const VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);

    const tx = await VariablesDeployed.changeAddressMinterWallet('0xF17769998F9e5296004D60FD7e57A0bD9490E53e');

    console.log(tx);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

