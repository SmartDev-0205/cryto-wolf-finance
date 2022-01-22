const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const contractDeployed = await deploy('WolfsNFTHelper', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const WolfsNFTHelper = await hre.deployments.get('WolfsNFTHelper');
    const WolfsNFTHelperDeployed = await ethers.getContractAt('WolfsNFTHelper', WolfsNFTHelper.address);

    const isInitialized = await WolfsNFTHelperDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');
        await WolfsNFTHelperDeployed.initialize();
    }

    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const WolfsNFTHelperImplementation = await hre.deployments.get('WolfsNFTHelper_Implementation');
            const WolfsNFTHelperImplementationDeployed = await ethers.getContractAt('WolfsNFTHelper', WolfsNFTHelperImplementation.address);
            await run("verify:verify", {
                address: WolfsNFTHelperImplementationDeployed.address,
                contract: "contracts/WolfsNFTHelper.sol:WolfsNFTHelper"
            });
        } catch (error) {
            console.log(error);
        }
    }

};
module.exports.tags = ['WolfsNFTHelper'];
