require("dotenv").config({ path: "./../.env.private" }).parsed;
const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    [deployerWallet, minterWallet, rewardsWallet] = await ethers.getSigners();

    await deploy('ShopNFT', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const ShopNFT = await hre.deployments.get('ShopNFT');
    const ShopNFTDeployed = await ethers.getContractAt('ShopNFT', ShopNFT.address);
    const VariablesProxy = await hre.deployments.get("Variables_Proxy");

    const isInitialized = await ShopNFTDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');
        const ShopNFTHelperProxy = await hre.deployments.get('ShopNFTHelper_Proxy');
        

        let cWolfTokenAddress;
        let accountAddressRewards;
        let accountAddressCommission;

        if (network.name === 'bscMainnet') {
            cWolfTokenAddress = process.env.CWOLF_ADDRESS_REAL;
            accountAddressRewards = process.env.ACCOUNT_ADDRESS_REWARDS_REAL;
            accountAddressCommission = process.env.ACCOUNT_ADDRESS_COMMISSION_REAL;
        } else {
            cWolfTokenAddress = (await hre.deployments.get('CWolfToken_Proxy')).address;
            accountAddressRewards = process.env.ACCOUNT_ADDRESS_REWARDS;
            accountAddressCommission = process.env.ACCOUNT_ADDRESS_COMMISSION;
        }

        await ShopNFTDeployed.initialize(
            ShopNFTHelperProxy.address,
            cWolfTokenAddress,
            VariablesProxy.address,
            accountAddressRewards,
            minterWallet.address,
            accountAddressCommission,
            rewardsWallet.address
        );


    }

    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const MarketPlaceImplementation = await hre.deployments.get('MarketPlace_Implementation');
            const MarketPlaceImplementationDeployed = await ethers.getContractAt('MarketPlace', MarketPlaceImplementation.address);
            await run("verify:verify", {
                address: MarketPlaceImplementationDeployed.address,
                contract: "contracts/MarketPlace.sol:MarketPlace"
            });
        } catch (error) {
            console.log(error);
        }
    }

};
module.exports.tags = ['ShopNFT'];
