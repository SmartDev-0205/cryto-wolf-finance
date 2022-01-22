require("dotenv").config({ path: "./../.env.private" }).parsed;
const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    [deployerWallet, minterWallet, rewardsWallet] = await ethers.getSigners();

    await deploy('MarketPlace', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const MarketPlace = await hre.deployments.get('MarketPlace');
    const MarketPlaceDeployed = await ethers.getContractAt('MarketPlace', MarketPlace.address);
    const VariablesProxy = await hre.deployments.get("Variables_Proxy");

    const isInitialized = await MarketPlaceDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');
        const Variables = await hre.deployments.get('Variables');
        const VariablesDeployed = await ethers.getContractAt('Variables', Variables.address);

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

        await MarketPlaceDeployed.initialize(
            cWolfTokenAddress,
            VariablesDeployed.address,
            accountAddressRewards,
            accountAddressCommission
        );


        // SETEAR LA ADDRESS DEL CONTRATO DE MarketPlace en WolfsNFT, MaterialsNFT, WolfPacksNFT
        
        // const WolfsNFT = await hre.deployments.get('WolfsNFT');
        // const WolfsNFTDeployed = await ethers.getContractAt('WolfsNFT', WolfsNFT.address);
        // await WolfsNFTDeployed.changeMarketplaceContractAddress(MarketPlaceDeployed.address);
    
        
        // const MaterialsNFT = await hre.deployments.get('MaterialsNFT');
        // const MaterialsNFTDeployed = await ethers.getContractAt('MaterialsNFT', MaterialsNFT.address);
        // await MaterialsNFTDeployed.changeMarketplaceContractAddress(MarketPlaceDeployed.address);

        // const WolfPacksNFT = await hre.deployments.get('WolfPacksNFT');
        // const WolfPacksNFTDeployed = await ethers.getContractAt('WolfPacksNFT', WolfPacksNFT.address);
        // await WolfPacksNFTDeployed.changeMarketplaceContractAddress(MarketPlaceDeployed.address);
        

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
module.exports.tags = ['MarketPlace'];
