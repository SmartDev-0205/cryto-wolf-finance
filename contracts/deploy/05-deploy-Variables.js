require("dotenv").config({ path: "./../.env.private" }).parsed;
const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const contractDeployed = await deploy('Variables', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const Variables = await hre.deployments.get('Variables');
    const VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);

    const isInitialized = await VariablesDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');

        let accountAddressMinterOracle;

        if (network.name === 'bscMainnet') {
            accountAddressMinterOracle = process.env.ACCOUNT_ADDRESS_MINTER_ORACLE_REAL;
        } else {
            accountAddressMinterOracle = process.env.ACCOUNT_ADDRESS_MINTER;
        }

        await VariablesDeployed.initialize(
            accountAddressMinterOracle
        );
    }

    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const VariablesImplementation = await hre.deployments.get('Variables_Implementation');
            const VariablesImplementationDeployed = await ethers.getContractAt('Variables', VariablesImplementation.address);
            await run("verify:verify", {
                address: VariablesImplementationDeployed.address,
                contract: "contracts/Variables.sol:Variables"
            });
        } catch (error) {
            console.log(error);
        }
    }

};

module.exports.tags = ['Variables'];
