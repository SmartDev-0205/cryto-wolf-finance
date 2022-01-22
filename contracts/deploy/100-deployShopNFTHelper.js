const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const contractDeployed = await deploy('ShopNFTHelper', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const ShopNFTHelper = await hre.deployments.get('ShopNFTHelper');
    const ShopNFTHelperDeployed = await ethers.getContractAt('ShopNFTHelper', ShopNFTHelper.address);

    const isInitialized = await ShopNFTHelperDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');
        await ShopNFTHelperDeployed.initialize();
    }

    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const ShopNFTHelperImplementation = await hre.deployments.get('ShopNFTHelper_Implementation');
            const ShopNFTHelperImplementationDeployed = await ethers.getContractAt('ShopNFTHelper', ShopNFTHelperImplementation.address);
            await run("verify:verify", {
                address: ShopNFTHelperImplementationDeployed.address,
                contract: "contracts/ShopNFTHelper.sol:ShopNFTHelper"
            });
        } catch (error) {
            console.log(error);
        }
    }

};
module.exports.tags = ['ShopNFTHelper'];
