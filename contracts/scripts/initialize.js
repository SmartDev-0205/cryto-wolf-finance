// npx hardhat run scripts/initialize.js --network 

const hre = require("hardhat");

async function main() {

    const WolfsNFTHelper = await hre.deployments.get('WolfsNFTHelper_Proxy');
    const WolfsNFTHelperDeployed = await ethers.getContractAt('WolfsNFTHelper', WolfsNFTHelper.address);

    const WolfsNFT = await hre.deployments.get('WolfsNFT_Proxy');
    const WolfsNFTDeployed = await ethers.getContractAt('WolfsNFT', WolfsNFT.address);

    console.log('WolfsNFTHelper.address: ', WolfsNFTHelper.address);
    console.log('WolfsNFT.address: ', WolfsNFT.address);

    // Initialize
    await WolfsNFTHelperDeployed.initialize();
    await WolfsNFTDeployed.initialize(WolfsNFTHelper.address, '0x759a1040B2bc2220f8ef16aC12E4B6A18d3d2DF7', '0xb6f7D26AEDCAf1E4B753F1854B13C39cc00EDd28');
    
    const mint = await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');


    /*
    for (let index = 0; index < 5; index++) {
        const mint = await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');
        const res = await WolfsNFTDeployed.WolfProperties[index];   
        console.log(res);
    }
    */
    




    // console.log(x);

    /*
    await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');
    await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');
    await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');
    await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');
    await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');
    await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');
    await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');
    await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');
    await WolfsNFTDeployed.mintOwner('0x3f81011729c104c38CbeD362ba050f83621a73a2');
    */

    // const x = await WolfsNFTDeployed.wolfProperties[0];
    // console.log(x)

    // const tx1 = await WolfsNFTDeployed.initialize();
    // console.log('tx1: ', tx1);

    /*
    for (let index = 0; index < 200; index++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await WolfsNFTDeployed.generateWolf(); 
    }
    */

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

