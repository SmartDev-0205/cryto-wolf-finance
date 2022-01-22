require("dotenv").config({ path: "./../.env.private" }).parsed;
require("dotenv").config({ path: "./../.env" }).parsed;

const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    [deployerWallet] = await ethers.getSigners();

    const contractDeployed = await deploy('WolfsNFT', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10

    });

    const WolfsNFT = await hre.deployments.get('WolfsNFT');
    const WolfsNFTDeployed = await ethers.getContractAt('WolfsNFT', WolfsNFT.address);

    const isInitialized = await WolfsNFTDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');

        const WolfsNFTHelperProxy = await hre.deployments.get('WolfsNFTHelper_Proxy');
        const VariablesProxy = await hre.deployments.get("Variables_Proxy");

        let cWolfTokenAddress;
        let accountAddressRewards;
        let accountAddressMinterWolfs;
        let accountAddressCommission;

        if (network.name === 'bscMainnet') {
            cWolfTokenAddress = process.env.CWOLF_ADDRESS_REAL;
            accountAddressRewards = process.env.ACCOUNT_ADDRESS_REWARDS_REAL;
            accountAddressMinterWolfs = process.env.ACCOUNT_ADDRESS_MINTER_WOLFS_REAL;
            accountAddressCommission = process.env.ACCOUNT_ADDRESS_COMMISSION_REAL;
        } else {
            cWolfTokenAddress = (await hre.deployments.get('CWolfToken_Proxy')).address;
            accountAddressRewards = process.env.ACCOUNT_ADDRESS_REWARDS;
            accountAddressMinterWolfs = process.env.ACCOUNT_ADDRESS_MINTER;
            accountAddressCommission = process.env.ACCOUNT_ADDRESS_COMMISSION;
        }

        await WolfsNFTDeployed.initialize(
            WolfsNFTHelperProxy.address,
            cWolfTokenAddress,
            VariablesProxy.address,
            accountAddressRewards,
            accountAddressMinterWolfs,
            accountAddressCommission,
        );
    }

    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const WolfsNFTImplementation = await hre.deployments.get('WolfsNFT_Implementation');
            const WolfsNFTImplementationDeployed = await ethers.getContractAt('WolfsNFT', WolfsNFTImplementation.address);
            await run("verify:verify", {
                address: WolfsNFTImplementationDeployed.address,
                contract: "contracts/WolfsNFT.sol:WolfsNFT"
            });
        } catch (error) {
            console.log(error);
        }
    }

};
module.exports.tags = ['WolfsNFT'];
