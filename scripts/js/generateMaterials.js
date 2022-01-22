import { chunks } from "chunk-array";
import { MultiCall } from "eth-multicall";
import keccak256 from "keccak256";
import { createRequire } from "module";
import { v4 as uuidv4 } from "uuid";
import Web3 from "web3";

const require = createRequire(import.meta.url);
const MaterialsJSON = require("./MaterialsNFT.json");

const env = {
  PRIVATE_KEY_HUNT:
    "485dbf91fe3dbb34afd77609945aa0efaa534d0a8ea541001f63f2721ad8ec28",
  PUBLIC_MULTICALL: "0x5FEe37c8812cB28d32B077B706ed08dcbE53108f",
};

const generateMaterials = async () => {
  const web3 = await new Web3(
    new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/")
  );

  const account = await web3.eth.accounts.privateKeyToAccount(
    env.PRIVATE_KEY_HUNT
  );
  console.log(account.address);
  web3.eth.accounts.wallet.add(account);

  const contract = new web3.eth.Contract(
    MaterialsJSON.abi,
    MaterialsJSON.address
  );

  const totalSupply = await contract.methods.totalSupply().call();
  console.log("totalSupply: " + totalSupply);
  let ids = Array.from(Array(parseInt(50000)).keys());
  ids = ids.map((x) => totalSupply - x - 1).reverse();

  const chunksIds = chunks(ids, 10000);

  const multicall = new MultiCall(web3, env.PUBLIC_MULTICALL);

  await new Promise(r => setTimeout(r, 15000));

  let resultsIndex = ids[0];
  (async function () {
    for await (const chunk of chunksIds) {
      const calls = [];
      for await (const id of chunk) {
        calls.push({ generated: await contract.methods.generated(id) });
      }
      const results = await multicall.all([calls]);

      let pending = [];
      for await (const result of results[0]) {
        if (!result.generated && resultsIndex != 0) {
          pending.push(resultsIndex);
        }
        resultsIndex++;
      }

      for await (const chunkPending of chunks(pending, 250)) {
        const uuid = uuidv4();
        const seed = `0x${keccak256(uuid).toString("hex")}`;

        try {
          const gasPrice = await web3.eth.getGasPrice();

          await contract.methods.generateValuesMaterials(chunkPending, seed).send({
            from: account.address,
            to: MaterialsJSON.address,
            gasPrice: gasPrice,
            gas: "60000000",
          });

          console.log("Chunk generated");
          await new Promise((r) => setTimeout(r, 10000));
        } catch (error) {
          console.log(error);
          await new Promise((r) => setTimeout(r, 10000));
        }
      }
    }
  })();

  return true;
};

generateMaterials();
