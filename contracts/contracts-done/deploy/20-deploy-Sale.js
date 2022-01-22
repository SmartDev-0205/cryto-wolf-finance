
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // const CWolfToken = await deployments.get("CWolfToken");
  // const CWolfTokenDeployed = await ethers.getContractAt("CWolfToken", CWolfToken.address);
  
  // const CWolfTokenFactory = await ethers.getContractFactory('CWolfToken');
  // const CWolfTokenDeployed = await CWolfTokenFactory.attach(CWolfToken.address);

  const contractDeployed = await deploy('Sale', {
    from: deployer,
    // args: [CWolfTokenDeployed.address],
    args: ["0x8c5921a9563E6d5dDa95cB46b572Bb1Cc9b04a27"],
    log: true,
  });
  
  console.log('Verify:');
  console.log('npx hardhat verify --network ' + hre.network.name + ' ' + contractDeployed.address);
  /*
  await CWolfTokenDeployed.approve(contractDeployed.address, "200000000000000000000000");

  console.log((await CWolfTokenDeployed.allowance(deployer, contractDeployed.address)).toString());
  */
};

module.exports.tags = ['Sale'];