require("dotenv").config({ path: "./../.env.private" }).parsed;
require("dotenv").config({ path: "./../.env" }).parsed;
const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    [deployerWallet, minterWallet, rewardsWallet] = await ethers.getSigners();

    const contractDeployed = await deploy('MaterialsNFT', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const MaterialsNFT = await hre.deployments.get('MaterialsNFT');
    const MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);

    const isInitialized = await MaterialsNFTDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');

        //const CWolfTokenProxy = await hre.deployments.get('CWolfToken_Proxy');
        const VariablesProxy = await hre.deployments.get("Variables_Proxy");

        let cWolfTokenAddress;
        let accountAddressRewards;
        let accountAddressMinterMaterials;
        let accountAddressCommission;

        if (network.name === 'bscMainnet') {
            cWolfTokenAddress = process.env.CWOLF_ADDRESS_REAL;
            accountAddressRewards = process.env.ACCOUNT_ADDRESS_REWARDS_REAL;
            accountAddressMinterMaterials = process.env.ACCOUNT_ADDRESS_MINTER_MATERIALS_REAL;
            accountAddressCommission = process.env.ACCOUNT_ADDRESS_COMMISSION_REAL;
        } else {
            cWolfTokenAddress = (await hre.deployments.get('CWolfToken_Proxy')).address;
            accountAddressRewards = process.env.ACCOUNT_ADDRESS_REWARDS;
            accountAddressMinterMaterials = process.env.ACCOUNT_ADDRESS_MINTER;
            accountAddressCommission = process.env.ACCOUNT_ADDRESS_COMMISSION;
        }

        await MaterialsNFTDeployed.initialize(
            cWolfTokenAddress,
            VariablesProxy.address,
            accountAddressRewards,
            accountAddressMinterMaterials,
            accountAddressCommission,
        );

    }

    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const MaterialsNFTImplementation = await hre.deployments.get('MaterialsNFT_Implementation');
            const MaterialsNFTImplementationDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFTImplementation.address);
            await run("verify:verify", {
                address: MaterialsNFTImplementationDeployed.address,
                contract: "contracts/MaterialsNFT.sol:MaterialsNFT"
            });
        } catch (error) {
            console.log(error);
        }

    }

};
module.exports.tags = ['MaterialsNFT'];
