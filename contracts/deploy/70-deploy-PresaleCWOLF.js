require("dotenv").config({ path: "./../.env.private" }).parsed;
const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    [deployerWallet, minterWallet, rewardsWallet] = await ethers.getSigners();

    await deploy('PresaleCWOLF', {
        from: deployer,
        args: [],
        log: true,
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        waitConfirmations: 10
    });

    const PresaleCWOLF = await hre.deployments.get('PresaleCWOLF');
    const PresaleCWOLFDeployed = await ethers.getContractAt('PresaleCWOLF', PresaleCWOLF.address);

    const isInitialized = await PresaleCWOLFDeployed.isInitialized();
    console.log("isInitialized: ", isInitialized);

    if (!isInitialized) {
        console.log('Initializing...');

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

        await PresaleCWOLFDeployed.initialize(
            cWolfTokenAddress
        );

    }

    if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
        try {
            await sleep(10000);
            const PresaleCWOLFImplementation = await hre.deployments.get('PresaleCWOLF_Implementation');
            const PresaleCWOLFImplementationDeployed = await ethers.getContractAt('PresaleCWOLF', PresaleCWOLFImplementation.address);
            await run("verify:verify", {
                address: PresaleCWOLFImplementationDeployed.address,
                contract: "contracts/PresaleCWOLF.sol:PresaleCWOLF"
            });
        } catch (error) {
            console.log(error);
        }
    }

};
module.exports.tags = ['PresaleCWOLF'];
