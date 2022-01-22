require("dotenv").config({ path: "./../.env.private" }).parsed;
require("dotenv").config({ path: "./../.env" }).parsed;
const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    [deployerWallet, minterWallet, rewardsWallet] = await ethers.getSigners();


    const contractDeployed = await deploy('WolfPacksNFT', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const WolfPacksNFT = await hre.deployments.get('WolfPacksNFT');
    const WolfPacksNFTDeployed = await ethers.getContractAt('WolfPacksNFT', WolfPacksNFT.address);

    const isInitialized = await WolfPacksNFTDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');

        //const CWolfTokenProxy = await hre.deployments.get('CWolfToken_Proxy');
        const WolfsNFTProxy = await hre.deployments.get('WolfsNFT_Proxy');
        const MaterialsProxy = await hre.deployments.get('MaterialsNFT_Proxy');
        const VariablesProxy = await hre.deployments.get("Variables_Proxy");

        let cWolfTokenAddress;
        let accountAddressRewards;
        let accountAddressMinterWolfPacks;
        let accountAddressCommission;

        if (network.name === 'bscMainnet') {
            cWolfTokenAddress = process.env.CWOLF_ADDRESS_REAL;
            accountAddressRewards = process.env.ACCOUNT_ADDRESS_REWARDS_REAL;
            accountAddressMinterWolfPacks = process.env.ACCOUNT_ADDRESS_MINTER_WOLFPACKS_REAL;
            accountAddressCommission = process.env.ACCOUNT_ADDRESS_COMMISSION_REAL;
        } else {
            cWolfTokenAddress = (await hre.deployments.get('CWolfToken_Proxy')).address;
            accountAddressRewards = process.env.ACCOUNT_ADDRESS_REWARDS;
            accountAddressMinterWolfPacks = process.env.ACCOUNT_ADDRESS_MINTER;
            accountAddressCommission = process.env.ACCOUNT_ADDRESS_COMMISSION;
        }

        await WolfPacksNFTDeployed.initialize(
            cWolfTokenAddress,
            accountAddressRewards,
            accountAddressMinterWolfPacks,
            WolfsNFTProxy.address,
            MaterialsProxy.address,
            VariablesProxy.address,
            accountAddressCommission,
        );

    }

    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const WolfPacksNFTImplementation = await hre.deployments.get('WolfPacksNFT_Implementation');
            const WolfPacksNFTImplementationDeployed = await ethers.getContractAt('WolfPacksNFT', WolfPacksNFTImplementation.address);
            await run("verify:verify", {
                address: WolfPacksNFTImplementationDeployed.address,
                contract: "contracts/WolfPacksNFT.sol:WolfPacksNFT"
            });
        } catch (error) {
            console.log(error);
        }
    }

};
module.exports.tags = ['WolfPacksNFT'];
