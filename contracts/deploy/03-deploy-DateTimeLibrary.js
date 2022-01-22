const sleep = require('sleep-promise');

module.exports = async ({ getNamedAccounts, deployments, getChainId, network }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const contractDeployed = await deploy('DateTimeLibrary', {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 10
  });

  if (network.name === 'bscTestnet' || network.name === 'bscMainnet') {
    try {
      await sleep(10000);
      const DateTimeLibrary = await hre.deployments.get('DateTimeLibrary');
      const DateTimeLibraryDeployed = await ethers.getContractAt('DateTimeLibrary', DateTimeLibrary.address);
      await run("verify:verify", {
        address: DateTimeLibraryDeployed.address,
        contract: "contracts/DateTimeLibrary.sol:DateTimeLibrary"
      });
    } catch (error) {
      console.log(error);
    }
  }


};

module.exports.tags = ['DateTimeLibrary'];
