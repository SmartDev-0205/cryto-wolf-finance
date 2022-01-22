import { chunks } from "chunk-array";
import { MultiCall } from "eth-multicall";
import { createRequire } from "module";
import Web3 from "web3";

const require = createRequire(import.meta.url);
const WolfPacksNFTJSON = require("./WolfPacksNFT.json");


const env = {
  PRIVATE_KEY_MINTER:
    "a6ad5c683eceae9fbb17263f887129e719dae5a488d1c615aa621218e21a755c",
  PUBLIC_MULTICALL: "0x5FEe37c8812cB28d32B077B706ed08dcbE53108f",
};

const getWolfPacks = async () => {
  const web3 = await new Web3(
    new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/")
  );

  const account = await web3.eth.accounts.privateKeyToAccount(
    env.PRIVATE_KEY_MINTER
  );
  console.log(account.address);
  web3.eth.accounts.wallet.add(account);

  const contractWolfPacks = new web3.eth.Contract(
    WolfPacksNFTJSON.abi,
    WolfPacksNFTJSON.address
  );
  

  const totalSupplyWolfPacks = await contractWolfPacks.methods.totalSupply().call();
  console.log("totalSupplyWolfPacks: " + totalSupplyWolfPacks);
  const ids = Array.from(Array(parseInt(totalSupplyWolfPacks)).keys());

  const multicall = new MultiCall(web3, env.PUBLIC_MULTICALL);

  const calls = [];
  for (const id of ids) {
    calls.push({ wallet: await contractWolfPacks.methods.wolfPackLinkDays(id)});
  }

  let results = await multicall.all([calls]);
  //console.log(results);
  let data = [];
  let i = 0;
  for(let result of results[0]) {
    console.log(parseInt(result.wallet));
    if(parseInt(result.wallet) > 25) {
      data.push({id: i, wallet: result.wallet});
    }
    i++;
  }
  console.log(data);
  console.log(data.length);
  return true;
};

function getUniqueArray(array, key) {
  return [...new Map(array.map((item) => [item[key], item])).values()];
}

getWolfPacks();
