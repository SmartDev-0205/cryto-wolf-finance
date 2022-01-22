import { chunks } from "chunk-array";
import { MultiCall } from "eth-multicall";
import keccak256 from "keccak256";
import { v4 as uuidv4 } from "uuid";
import Web3 from "web3";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const WolfsJSON = require("./HuntingNFT.json");

const env = {
  PRIVATE_KEY:
    "a9fb8b937c50a1d84acca217c533a6aa850b34240db0cd1289eff21095498362",
  PUBLIC_MULTICALL: "0x5666349671AE8Fb980d3Cf4F03F805aF408Fb51a",
};

const generateHunts= async () => {
  const web3 = await new Web3(
    new Web3.providers.HttpProvider(
      "https://speedy-nodes-nyc.moralis.io/63842bcca9982a74b2a9fd41/bsc/testnet"
    )
  );

  const account = await web3.eth.accounts.privateKeyToAccount(env.PRIVATE_KEY);
  console.log(account.address);
  web3.eth.accounts.wallet.add(account);

  const contract = new web3.eth.Contract(
    WolfsJSON.abi,
    WolfsJSON.address
  );

  const totalSupply = await contract.methods.totalSupply().call();
  console.log("totalSupply: " + totalSupply);
  let ids = Array.from(Array(parseInt(totalSupply)).keys());
  //ids = ids.map((x) => totalSupply - x - 1).reverse();

  const chunksIds = chunks(ids, 10000);

  const multicall = new MultiCall(web3, env.PUBLIC_MULTICALL);

  let resultsIndex = 0;
  (async function () {
    for await (const chunk of chunksIds) {
      const calls = [];
      for await (const id of chunk) {
        calls.push({ generated: await contract.methods.isGenerated(id) });
      }
      const results = await multicall.all([calls]);

      const callsWallet = [];
      for await (const id of chunk) {
        callsWallet.push({
          wallet: await contract.methods.ownerOf(id),
        });
      }
      const resultsWallet = await multicall.all([callsWallet]);

      const resultsCombined = [];
      for (let index = 0; index < resultsWallet[0].length; index++) {
        const elementCombined = {
          wallet: resultsWallet[0][index].wallet,
          generated: results[0][index].generated,
        };
        resultsCombined.push(elementCombined);
      }

      let pending = [];
      for await (const result of resultsCombined) {
        if (!result.generated && resultsIndex != 0) {
          pending.push(resultsIndex);
        }
        resultsIndex++;
      }

      for await (const chunkPending of chunks(pending, 1)) {
        const uuid = uuidv4();
        const seed = '0x6f3e542d65dd3dc94428fa3387757179b4c940ea8a28bca2292c68fbd3cc823d';

        try {
          let gas = "9000000";
          const gasPrice = await web3.eth.getGasPrice();

          await contract.methods.generateResult(chunkPending, seed).estimateGas(
            {
              from: account.address,
              gasPrice: gasPrice,
            },
            function (error, estimatedGas) {
              if (error == null && estimatedGas != null && estimatedGas > 0) {
                gas = estimatedGas;
              }
            }
          );

          await contract.methods.generateResult(chunkPending, seed).send({
            from: account.address,
            to: HuntingNFTJSON.address,
            gasPrice: gasPrice,
            gas: Number(gas).toString(),
          });

          console.log("Chunk generated SEED: " + seed);
          await new Promise((r) => setTimeout(r, 2500));
        } catch (error) {
          console.log(error);
          await new Promise((r) => setTimeout(r, 2500));
        }
      }
    }
  })();

  return true;
};

generateHunts();