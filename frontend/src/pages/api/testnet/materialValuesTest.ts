/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import { MultiCall } from 'eth-multicall';
import keccak256 from 'keccak256';
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import Web3 from 'web3';

import contractAbi from '../../../contracts/MaterialsNFT.json';

const {
  NEXT_PUBLIC_RPC_URL_TESTNET,
  NEXT_PUBLIC_MULTICALL_TESTNET,
  ACCOUNT_PRIVATE_KEY_MINTER_TESTNET,
} = process.env;
const chunkArray = (arr: string | any[], chunkCount: number) => {
  const chunks = [];
  while (arr.length) {
    const chunkSize = Math.ceil(arr.length / chunkCount--);
    const chunk = arr.slice(0, chunkSize);
    chunks.push(chunk);
    arr = arr.slice(chunkSize);
  }
  return chunks;
};
function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
const generateValuesMaterial = async () => {
  // instancio web3 con el provider, guardo la cuenta y la agregu a las wallets de web3
  const web3 = await new Web3(
    new Web3.providers.HttpProvider(NEXT_PUBLIC_RPC_URL_TESTNET as string)
  );
  const account = await web3.eth.accounts.privateKeyToAccount(
    ACCOUNT_PRIVATE_KEY_MINTER_TESTNET as string
  );
  const abi = contractAbi.abi as [];
  const address = contractAbi.address as string;
  web3.eth.accounts.wallet.add(account);
  // instancio el contrato y llamo al totalSupply (para cualquier llamada read se utiliza .call())
  const contract = await new web3.eth.Contract(abi, address);
  const totalSupply = await contract.methods.totalSupply().call();
  console.log('totalSupply', totalSupply);
  const dividedSupply = totalSupply / 200;
  let splittedSupplies = [];
  // NEXT_PUBLIC_MULTICALL_DIVISOR = 3
  for (let i = totalSupply - 1; i >= 1; i -= 1) {
    splittedSupplies.push(i);
  }
  if (dividedSupply > 1) {
    splittedSupplies = chunkArray(splittedSupplies, dividedSupply);
  } else {
    splittedSupplies = [splittedSupplies];
  }

  for (const splittedSupply of splittedSupplies) {
    const calls = [];
    // console.log('splittedSupply', splittedSupply);
    for (const supply of splittedSupply) {
      // guardo todos los llamados que debo hacer luego.. (fijate que uso sin .call() aquí para que funcione el .all([]) luego)
      // console.log('supply', supply);
      calls.push({ generated: await contract.methods.generated(supply) });
    }
    // instancia multicall el address multicall lo puedes guardar en .env ya que luego cambia en mainnet.
    const multicall = new MultiCall(web3, NEXT_PUBLIC_MULTICALL_TESTNET);

    // aquí llamo a multicall que devuelve un array de objetos.
    const results = await multicall.all([calls]);
    const generatedList = results[0] as any[];
    const generated = [];
    for (let i = 0; i < Object.entries(generatedList).length; i += 1) {
      if (generatedList[i].generated === false) {
        generated.push(splittedSupply[i]);
      }
      if (generated.length > 15) break;
    }

    // seed aleatoria para el método: generateValuesMaterials
    const uuid = uuidv4();
    const randomSeed = `0x${keccak256(uuid).toString('hex')}`;
    console.log('generated.length', generated.length);
    if (generated.length > 0) {
      // calculo el precio del gas.
      const gasPrice = await web3.eth.getGasPrice();
      // llamo al método write: generateValuesMaterials
      try {
        // const resp =
        await contract.methods
          .generateValuesMaterials(generated, randomSeed)
          .send({
            from: account.address,
            to: address,
            gasPrice,
            gas: '600000',
          });
        // console.log(resp);

        console.log('To generated', generated);
        await sleep(2000);
      } catch (_error) {
        console.log('_error', _error);
        await sleep(9000);
      }
      await sleep(1000);
      // aquí tienes la respuesta de la transacción te dejo una respuesta modelo para que la valides cómo quieras:
      /*
      {
        blockHash: '0xb47380d74e7b1f8863d4c109972b8518edf888f83cbed81ea9f7892e6f1360b6',
        blockNumber: 15068534,
        contractAddress: null,
        cumulativeGasUsed: 669058,
        from: '0xfd03d5fdb9ba445bdf6fe9ad281fe9168ca317d3',
        gasUsed: 558816,
        logsBloom: '0x00000000000000000000004000000000000000000000000000000000000000000000020000000000000000000000000000000000040000000020000000200000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000010000000000000000001000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000020000000000000000000000000000000000000000000000002000040000000000800000',
        status: true,
        to: '0xd55f58c712debf679a6a82565c14ded7339212a2',
        transactionHash: '0x5f3e098e3130f1f3813feb2bb1628cbf2cd237a4b7f27af73ac1ab71f53dac2e',
        transactionIndex: 2,
        type: '0x0',
        events: { GeneratedNFT: [ [Object], [Object], [Object] ] }
      }
     */
    }
  }
};

export default async function handleRequest(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const message = `Generating materials...`;

  await generateValuesMaterial();

  res.send({
    message,
  });
  return true;
}