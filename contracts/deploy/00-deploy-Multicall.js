const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const contractDeployed = await deploy('Multicall', {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 10
  });

  if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
    try {
      await sleep(10000);
      const Multicall = await hre.deployments.get('Multicall');
      const MulticallDeployed = await ethers.getContractAt('Multicall', Multicall.address);
      await run("verify:verify", {
        address: MulticallDeployed.address,
        contract: "contracts/Multicall.sol:Multicall"
      });
    } catch (error) {
      console.log(error);
    }
  }

};

module.exports.tags = ['Multicall'];
