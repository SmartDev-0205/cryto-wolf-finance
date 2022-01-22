const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {

    if(network.name === 'bscMainnet'){
        return;
    }
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const contractDeployed = await deploy('CWolfToken', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const CWolfToken = await hre.deployments.get('CWolfToken');
    const CWolfTokenDeployed = await ethers.getContractAt('CWolfToken', CWolfToken.address);

    const isInitialized = await CWolfTokenDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');
        await CWolfTokenDeployed.initialize();
    }

    // Transfer CWOLF to Deployer and Aux1
    await CWolfTokenDeployed.mint('0xeB87be771498F7244F1bBf8578aeF6405cf3b6fa', '10000000000000000000000000');
    await CWolfTokenDeployed.mint(deployer, '10000000000000000000000000');


    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const CWolfTokenImplementation = await hre.deployments.get('CWolfToken_Implementation');
            const CWolfTokenImplementationDeployed = await ethers.getContractAt('CWolfToken', CWolfTokenImplementation.address);
            await run("verify:verify", {
                address: CWolfTokenImplementationDeployed.address,
                contract: "contracts/CWolfToken.sol:CWolfToken"
            });
        } catch (error) {
            console.log(error);
        }
    }


};
module.exports.tags = ['CWolfToken'];
