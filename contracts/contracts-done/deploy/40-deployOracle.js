module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const contractDeployed = await deploy('Oracle', {
        from: deployer,
        args: [],
        log: true,
        proxy: false,
        /*
        proxy: {
            proxyContract: 'OpenZeppelinTransparentProxy',
        },
        */

    });
 
    // '0xb2C6c4162c0d2B6963C62A9133331b4D0359AA34' 

    console.log('contractDeployed:', contractDeployed.address);

    const Oracle = await hre.deployments.get('Oracle');
    const OracleDeployed = await ethers.getContractAt('Oracle', Oracle.address);

    const x = await OracleDeployed.getTokenPrice('0xd26d4B9a44A951cC3377d7320323F0A34f57d159', '1000000000000000000');

    console.log(x.toString())

    // console.log('Verify:');
    // console.log('npx hardhat verify --network ' + hre.network.name + ' ' + contractDeployed.address);

};

module.exports.tags = ['Oracle'];
