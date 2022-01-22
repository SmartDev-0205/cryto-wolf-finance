module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const contractDeployed = await deploy('RandomProvable', {
        from: deployer,
        args: [],
        log: true,
        proxy: false,

    });

    console.log('contractDeployed:', contractDeployed.address);

    // console.log('Verify:');
    // console.log('npx hardhat verify --network ' + hre.network.name + ' ' + contractDeployed.address);

};
module.exports.tags = ['RandomProvable'];
