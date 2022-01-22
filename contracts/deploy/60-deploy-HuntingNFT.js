require("dotenv").config({ path: "./../.env.private" }).parsed;
const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    [deployerWallet, minterWallet, rewardsWallet] = await ethers.getSigners();

    await deploy('HuntingNFT', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const HuntingNFT = await hre.deployments.get('HuntingNFT');
    const HuntingNFTDeployed = await ethers.getContractAt('HuntingNFT', HuntingNFT.address);

    const isInitialized = await HuntingNFTDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');
        const WolfPacksNFTProxy = await hre.deployments.get('WolfPacksNFT_Proxy');
        const WolfPacksNFTDeployed = await ethers.getContractAt('WolfPacksNFT', WolfPacksNFTProxy.address);

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

        await HuntingNFTDeployed.initialize(
            cWolfTokenAddress,
            accountAddressRewards,
            accountAddressMinterWolfPacks,
            WolfPacksNFTProxy.address,
            accountAddressCommission
        );

        
        // const HuntingNFTProxy = await hre.deployments.get('HuntingNFT_Proxy');
        // const HuntingNFTDeployed = await ethers.getContractAt('HuntingNFT', HuntingNFTProxy.address);

        /*
        await sleep(10000);
        await HuntingNFTDeployed.initializeAnimalsPoints();

        await sleep(10000);
        await HuntingNFTDeployed.initializeAnimalsProbability();

        await sleep(10000);
        await HuntingNFTDeployed.initializeAnimalsRewards();
        */
       
        // SETEAR LA ADDRESS DEL CONTRATO DE HUNTING EN EL CONTRATO DE WOLFPACKS
        // ! Quitada por espacio
        await sleep(10000);
        // await WolfPacksNFTDeployed.changeHuntingNFTContractAddress(HuntingNFTDeployed.address)

    }

    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const HuntingNFTImplementation = await hre.deployments.get('HuntingNFT_Implementation');
            const HuntingNFTImplementationDeployed = await ethers.getContractAt('HuntingNFT', HuntingNFTImplementation.address);
            await run("verify:verify", {
                address: HuntingNFTImplementationDeployed.address,
                contract: "contracts/HuntingNFT.sol:HuntingNFT"
            });
        } catch (error) {
            console.log(error);
        }
    }

};
module.exports.tags = ['HuntingNFT'];
