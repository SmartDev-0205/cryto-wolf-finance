/* eslint-disable no-await-in-loop */
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';
import Web3 from 'web3';

import contractAbi from '../../contracts/Variables.json';

const {
  NEXT_PUBLIC_RPC_URL,
  PK_ADDRESS_MINTER_ORACLE_REAL,
  NEXT_PUBLIC_CWOLF_ADDRESS,
  NEXT_PUBLIC_WBNB_ADDRESS,
  NEXT_PUBLIC_GAS,
} = process.env;

const updateTokensWolf = async () => {
  // instancio web3 con el provider, guardo la cuenta y la agregu a las wallets de web3
  const web3 = await new Web3(
    new Web3.providers.HttpProvider(NEXT_PUBLIC_RPC_URL as string)
  );
  const account = await web3.eth.accounts.privateKeyToAccount(
    PK_ADDRESS_MINTER_ORACLE_REAL as string
  );
  const abi = contractAbi.abi as [];
  const address = contractAbi.address as string;
  web3.eth.accounts.wallet.add(account);
  // instancio el contrato y llamo al getDollarsInCWOLF (para cualquier llamada read se utiliza .call())
  const contract = await new web3.eth.Contract(abi, address);
  // const getDollarsInCWOLF = await contract.methods.getDollarsInCWOLF(1).call();
  // console.log('getDollarsInCWOLF');
  const cwolf = await axios.get(NEXT_PUBLIC_CWOLF_ADDRESS as string);
  const wbnb = await axios.get(NEXT_PUBLIC_WBNB_ADDRESS as string);

  const cwolfUsd = Math.round(cwolf.data.data.price * 1e18).toString();
  const wbnbUsd = Math.round(wbnb.data.data.price * 1e18).toString();
  if (cwolf.data.data.price > 0 && wbnb.data.data.price > 0) {
    console.log(cwolfUsd, wbnbUsd);

    const gasPrice = await web3.eth.getGasPrice();
    // llamo al método write: generateValuesWolf
    const resp = await contract.methods
      .setCWOLFAndBNBPriceInDollars(cwolfUsd, wbnbUsd)
      .send({
        from: account.address,
        to: address,
        gasPrice,
        gas: NEXT_PUBLIC_GAS,
      });
    console.log(resp);
  }
};

export default async function handleRequest(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  const message = `Update tokens prices...`;

  await updateTokensWolf();

  res.send({
    message,
  });
  return true;
}
