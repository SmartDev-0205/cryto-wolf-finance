require("dotenv").config({ path: "./../.env.private" }).parsed;
const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    [deployerWallet, minterWallet, rewardsWallet] = await ethers.getSigners();

    await deploy('Claim', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const Claim = await hre.deployments.get('Claim');
    const ClaimDeployed = await ethers.getContractAt('Claim', Claim.address);
    const VariablesProxy = await hre.deployments.get("Variables_Proxy");

    const isInitialized = await ClaimDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');
        const HuntingNFT = await hre.deployments.get('HuntingNFT');
        const HuntingNFTDeployed = await ethers.getContractAt('HuntingNFT', HuntingNFT.address);

        const WolfPacksNFTProxy = await hre.deployments.get('WolfPacksNFT_Proxy');
        const WolfPacksNFTDeployed = await ethers.getContractAt('WolfPacksNFT', WolfPacksNFTProxy.address);

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

        await ClaimDeployed.initialize(
            cWolfTokenAddress,
            HuntingNFTDeployed.address,
            accountAddressRewards,
            VariablesProxy.address
        );


        // SETEAR LA ADDRESS DEL CONTRATO DE CLAIM EN EL CONTRATO DE HUNTING
        await HuntingNFTDeployed.changeClaimContractAddress(ClaimDeployed.address);

        // SETEAR LA ADDRESS DEL CONTRATO DE WOLFPACKS EN EL CONTRATO DE CLAIM
        await ClaimDeployed.changeWolfpacksContractAddress(WolfPacksNFTDeployed.address);
        
        

    }

    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const ClaimImplementation = await hre.deployments.get('Claim_Implementation');
            const ClaimImplementationDeployed = await ethers.getContractAt('Claim', ClaimImplementation.address);
            await run("verify:verify", {
                address: ClaimImplementationDeployed.address,
                contract: "contracts/Claim.sol:Claim"
            });
        } catch (error) {
            console.log(error);
        }
    }

};
module.exports.tags = ['Claim'];
