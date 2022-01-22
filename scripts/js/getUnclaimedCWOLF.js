import { chunks } from "chunk-array";
import { MultiCall } from "eth-multicall";
import { createRequire } from "module";
import Web3 from "web3";

const require = createRequire(import.meta.url);
const HuntingNFTJSON = require("./HuntingNFT.json");
const ClaimJSON = require("./Claim.json");

const env = {
  PRIVATE_KEY_MINTER:
    "a6ad5c683eceae9fbb17263f887129e719dae5a488d1c615aa621218e21a755c",
  PUBLIC_MULTICALL: "0x5FEe37c8812cB28d32B077B706ed08dcbE53108f",
};

const getUnclaimedCWOLF = async () => {
  const web3 = await new Web3(
    new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/")
  );

  const account = await web3.eth.accounts.privateKeyToAccount(
    env.PRIVATE_KEY_MINTER
  );
  console.log(account.address);
  web3.eth.accounts.wallet.add(account);

  const contractHunting = new web3.eth.Contract(
    HuntingNFTJSON.abi,
    HuntingNFTJSON.address
  );
  const contractClaim = new web3.eth.Contract(ClaimJSON.abi, ClaimJSON.address);

  const totalSupplyHunting = await contractHunting.methods.totalSupply().call();
  console.log("totalSupplyHunting: " + totalSupplyHunting);
  const ids = Array.from(Array(parseInt(totalSupplyHunting)).keys());

  const chunksIds = chunks(ids, 10000);

  const multicall = new MultiCall(web3, env.PUBLIC_MULTICALL);

  let wallets = [];
  for await (const chunkId of chunksIds) {
    const calls = [];
    for await (const id of chunkId) {
      calls.push({ wallet: await contractHunting.methods.ownerOf(id) });
    }
    let results = await multicall.all([calls]);
    wallets = wallets.concat(getUniqueArray(results[0], "wallet"));
  }
  wallets = getUniqueArray(wallets, "wallet");

  const chunksWallets = chunks(wallets, 10000);

  let claims = [];
  for await (const chunkWallet of chunksWallets) {
    const callsClaim = [];
    for await (const wallet of chunkWallet) {
      callsClaim.push({
        amount: await contractClaim.methods.usersAmount(wallet.wallet),
      });
    }
    const resultsClaim = await multicall.all([callsClaim]);
    claims = claims.concat(resultsClaim[0]);
  }

  let unclaimedCWOLF = 0;
  for (const claim of claims) {
    unclaimedCWOLF += Number(
      Number(Number(claim.amount) / 1e18).toFixed(2)
    );
  }

  console.log("Unclaimed CWOLF: " + unclaimedCWOLF.toFixed(2));

  return true;
};

function getUniqueArray(array, key) {
  return [...new Map(array.map((item) => [item[key], item])).values()];
}

getUnclaimedCWOLF();
