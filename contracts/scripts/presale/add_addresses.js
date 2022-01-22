// npx hardhat run scripts/presale/add_addresses.js --network 

const hre = require("hardhat");
const fs = require('fs').promises;

async function main() {

    const PresaleCWOLF = await hre.deployments.get('PresaleCWOLF_Proxy');
    const PresaleCWOLFDeployed = await ethers.getContractAt('PresaleCWOLF', PresaleCWOLF.address);

    const maxChunkLenght = 20;

    const data = require('./both_presales.js')

    console.log(data);

    // Suma de tokens
    let sum = 0;
    for (let index = 0; index < data.length; index++) {
        const reg = data[index];
        sum = sum + reg.amount;
    }

    console.log('Total tokens: ', sum);

    // Número de trozos a tratar
    const chunksNumber = (data.length / maxChunkLenght) + 1;
    console.log('chunksNumber: ', chunksNumber);

    for (let index = 0; index <= chunksNumber; index++) {
        // console.log('INDEX: ', index);
        // console.log('inicio: ', maxChunkLenght * index);
        // console.log('final: ',  (maxChunkLenght * index) + maxChunkLenght);
        const chunk = data.slice(maxChunkLenght * index, (maxChunkLenght * index) + maxChunkLenght);

        console.log(`Chunk ${index}: `, chunk);
        console.log('Chunk lenght:', chunk.length);

        const addresses = chunk.map(x => x.address);
        console.log('addresses: ', addresses);

        const amounts = chunk.map(x => x.amount);
        console.log('amounts: ', amounts);

        /* COMENTADO OR SEGGURIDAD
        const tx = await PresaleCWOLFDeployed.addAddresses(addresses, amounts);
        await tx.wait(1);
        */


    }




}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

