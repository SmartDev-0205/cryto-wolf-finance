const Web3 = require('web3');
const { MongoClient } = require('mongodb');
const Market_Contract = require('../contracts/Market.json');
const MaterialsNFTJSON = require('../contracts/MaterialsNFT.json');
const WolfsNFTJSON = require('../contracts/WolfsNFT.json');
const WolfPacksNFTJSON = require('../contracts/WolfPacksNFT.json');
const { MultiCall } = require('eth-multicall');
const env = require('../config');

var curblk_add = 0;

const WOLF_C_ADDR = WolfsNFTJSON.address;
const WOLFPACK_C_ADDR = WolfPacksNFTJSON.address;
const MAT_C_ADDR = MaterialsNFTJSON.address;

async function scan_event() {
    if (curblk_add === 0) {
        const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        let db = 'nft_array';
        let col1 = 'wolfPackNFT';
        let col2 = 'woflNFT';
        let col3 = 'materialNFT';
        let col4 = 'addList';
        let col5 = 'removeList';
        var real_db = client.db(db);
        var real_col1 = real_db.collection(col1);
        var real_col2 = real_db.collection(col2);
        var real_col3 = real_db.collection(col3);
        var real_col4 = real_db.collection(col4);
        var real_col5 = real_db.collection(col5);
        var cursor1 = await real_col1.remove();
        var cursor2 = await real_col2.remove();
        var cursor3 = await real_col3.remove();
        var cursor4 = await real_col4.remove();
        var cursor5 = await real_col5.remove();
        client.close()
    }
    console.log('Scan all events on blocks');
    const web3 = await new Web3(
        new Web3.providers.HttpProvider(env.rpcprovider)
    );
    var contract = new web3.eth.Contract(Market_Contract.abi, Market_Contract.address);

    let dels = [], adds = [];
    let filter = { fromBlock: curblk_add, toBlock: 'latest' }; // filter for your address
    let all_evs = await contract.getPastEvents('itemRemoved', filter, function (error, events) { });

    dels = await del_dblist(all_evs);
    console.log('itemRemoved-Events', dels);

    filter = { fromBlock: curblk_add, toBlock: 'latest' }; // filter for your address
    all_evs = await contract.getPastEvents('itemSold', filter, function (error, events) { });
    dels.concat(await del_dblist(all_evs));
    console.log('itemSold-Events', dels);

    filter = { fromBlock: curblk_add, toBlock: 'latest' }; // filter for your address
    all_evs = await contract.getPastEvents('itemAdded', filter, function (error, events) { });
    adds = await add_dblist(all_evs);
    console.log('itemAdded-Events', adds);
    console.log("latesded block number====>", curblk_add)
    await getItemsNFTs(adds)
    await removeItemsNFTs(dels)
    const latest = await web3.eth.getBlockNumber()
    curblk_add = latest;
    console.log("latesded block number====>", curblk_add)
}

async function add_dblist(params) {
    let add_list = []
    const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    for (let i = 0; i < params.length; i++) {
        let element = params[i];
        let ele_id = element.returnValues.id;

        let db = 'nft_array';
        let col = 'addList';
        var real_db = client.db(db);
        var real_col = real_db.collection(col);
        var cursor = await real_col.find({ id: ele_id }).toArray();
        if (cursor.length === 0 && !add_list.includes(ele_id)) {
            add_list.push(ele_id);
        }
        else {
            await real_col.deleteOne({ id: ele_id })
        }
    }
    client.close();
    return add_list;
}

async function del_dblist(params) {
    let del_list = [];
    const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    for (let i = 0; i < params.length; i++) {
        const element = params[i];
        let ele_id = element.returnValues.id;

        let db = 'nft_array';
        let col = 'removeList';
        var real_db = client.db(db);
        var real_col = real_db.collection(col);
        var cursor = await real_col.find({ id: ele_id }).toArray();
        if (cursor.length === 0) {
            del_list.push(ele_id);
        }
        else {
            await real_col.deleteOne({ id: ele_id })
        }

    }
    client.close();
    return del_list;
}
async function getMaterialNFT(arrayNFTs) {
    let itemsNFTs = [];
    const web3 = await new Web3(
        new Web3.providers.HttpProvider(env.rpcprovider)
    );
    // const web3 = new Web3(env.rpcprovider);
    const contract = await new web3.eth.Contract(
        MaterialsNFTJSON.abi,
        MaterialsNFTJSON.address
    );
    const contractWolfPacks = await new web3.eth.Contract(
        WolfPacksNFTJSON.abi,
        WolfPacksNFTJSON.address
    );

    /* const calls = [];
    for await (const tokenId of arrayNFTs) {
      calls.push({
        getUsedMaterial: await contractWolfPacks.methods.materialsUsed(
          tokenId.toString()
        ),
      });
    } */

    // instancia multicall el address multicall lo puedes guardar en .env ya que luego cambia en mainnet.
    const multicall = new MultiCall(web3, env.config.MULTICALL);

    /* let arrayNFTsnotUsed = [] as any;
    const results = await multicall.all([calls]);
    if (results[0]) {
      for (let index = 0; index < results[0]?.length; index += 1) {
        if (results[0][index].getUsedMaterial === false) {
          arrayNFTsnotUsed.push(arrayNFTs[index]);
        }
      }
    } */

    let callsItems = [];
    for await (const NFTs of arrayNFTs) {
        callsItems.push({
            getMaterialProperties: await contract.methods.getMaterialSlots(
                NFTs.tokenId
            ),
        });
    }

    const resultsItems = await multicall.all([callsItems]);
    if (resultsItems[0]) {
        let callsItemsUsed = [];
        for (let index = 0; index < resultsItems[0]?.length; index += 1) {
            callsItemsUsed.push({
                getUsedMaterial: await contractWolfPacks.methods.materialsUsed(
                    arrayNFTs[index].tokenId
                ),
            });
        }
        const resultsItemsUsed = await multicall.all([callsItemsUsed]);

        for (let index = 0; index < resultsItems[0]?.length; index += 1) {
            let used = false;
            if (resultsItemsUsed[0]) {
                used = resultsItemsUsed[0][index].getUsedMaterial;
            }


            if (used === false) {
                let materialProp;
                if (resultsItems[0]) {
                    materialProp = parseInt(
                        resultsItems[0][index].getMaterialProperties,
                        10
                    );
                }

                let level;
                if (materialProp !== null) {
                    level = env.materialsData.Level[materialProp - 1];
                }

                itemsNFTs.push({
                    level: level,
                    tokenId: arrayNFTs[index].tokenId,
                    askingPrice: arrayNFTs[index].askingPrice,
                    id: arrayNFTs[index].id
                });
            }
        }
    }
    return itemsNFTs;
};
async function getWolfNFT(arrayNFTs) {
    let itemsNFTs = [];

    const web3 = await new Web3(
        new Web3.providers.HttpProvider(env.rpcprovider)
    );
    const contract = await new web3.eth.Contract(
        WolfsNFTJSON.abi,
        WolfsNFTJSON.address
    );
    const contractWolfPacks = await new web3.eth.Contract(
        WolfPacksNFTJSON.abi,
        WolfPacksNFTJSON.address
    );

    const multicall = new MultiCall(web3, env.config.MULTICALL);

    let callsItems = [];
    for await (const tokenId of arrayNFTs) {
        callsItems.push({
            getWolfProperties: await contract.methods.getWolfProperties(
                tokenId.tokenId
            ),
        });
    }

    const resultsItems = await multicall.all([callsItems]);
    if (resultsItems[0]) {
        let callsItemsUsed = [];
        for (let index = 0; index < resultsItems[0]?.length; index += 1) {
            callsItemsUsed.push({
                getUsedWolf: await contractWolfPacks.methods.wolfsUsed(
                    arrayNFTs[index].tokenId
                ),
            });
        }
        const resultsItemsUsed = await multicall.all([callsItemsUsed]);

        for (let index = 0; index < resultsItems[0]?.length; index += 1) {
            let used = false;
            if (resultsItemsUsed[0]) {
                used = resultsItemsUsed[0][index].getUsedWolf;
            }


            if (used === false) {
                const attack = parseInt(
                    resultsItems[0][index].getWolfProperties[3],
                    10
                );
                const defense = parseInt(
                    resultsItems[0][index].getWolfProperties[4],
                    10
                );
                const health = attack + defense
                const breed =
                    env.wolvesData.Breed[resultsItems[0][index].getWolfProperties[0]];
                const gender =
                    env.wolvesData.Gender[resultsItems[0][index].getWolfProperties[1]];
                const level =
                    env.wolvesData.Level[resultsItems[0][index].getWolfProperties[2]];

                itemsNFTs.push({
                    attack: attack,
                    defense: defense,
                    health: health,
                    gender: gender,
                    level: level,
                    breed: breed,
                    tokenId: arrayNFTs[index].tokenId,
                    askingPrice: arrayNFTs[index].askingPrice,
                    id: arrayNFTs[index].id,
                });
            }
        }
    }
    return itemsNFTs;
}
async function getWolfPackNFT(arrayNFTs) {
    let itemsNFTs = [];

    const web3 = await new Web3(
        new Web3.providers.HttpProvider(env.rpcprovider)
    );
    const contract = await new web3.eth.Contract(
        WolfPacksNFTJSON.abi,
        WolfPacksNFTJSON.address
    );
    let calls = [];
    for (const tokenId of arrayNFTs) {
        calls.push({
            checkWolfPackLink: contract.methods.checkWolfPackLink(
                tokenId.tokenId,
                Date.now()
            ),
            getTotalSlotsAvailableInWolfPack:
                contract.methods.getTotalSlotsAvailableInWolfPack(
                    tokenId.tokenId
                ),
            getTotalSlotsInWolfPack: contract.methods.getTotalSlotsInWolfPack(
                tokenId.tokenId
            ),
            pointsOfWolfPack: contract.methods.pointsOfWolfPack(
                tokenId.tokenId
            ),
            wolfPackLife: contract.methods.wolfPackLife(tokenId.tokenId),
            wolfPackEnergy: contract.methods.wolfPackEnergy(tokenId.tokenId),
            wolfPackInPromo: contract.methods.wolfPackInPromo(
                tokenId.tokenId
            ),
        });
    }
    const multicall = new MultiCall(web3, env.config.MULTICALL);
    const results = await multicall.all([calls]);
    if (results[0]) {
        for (let index = 0; index < results[0]?.length; index += 1) {
            itemsNFTs.push({
                id: arrayNFTs[index].id,
                tokenId: arrayNFTs[index].tokenId,
                wolfPackLink: results[0][index].checkWolfPackLink,
                totalSlotsAvailable_:
                    results[0][index].getTotalSlotsAvailableInWolfPack,
                totalSlotsInWolfPack: results[0][index].getTotalSlotsInWolfPack,
                pointsOfWolfPack: results[0][index].pointsOfWolfPack,
                wolfPackLife: results[0][index].wolfPackLife,
                wolfPackEnergy: results[0][index].wolfPackEnergy,
                wolfPackInPromo: results[0][index].wolfPackInPromo,
                askingPrice: arrayNFTs[index].askingPrice,
            });
        }
    }
    return itemsNFTs;
}
async function getItemsNFTs(arrayId) {
    const web3 = await new Web3(
        new Web3.providers.HttpProvider(env.rpcprovider)
    );
    const marketInst = new web3.eth.Contract(
        Market_Contract.abi,
        Market_Contract.address
    );
    let materialNFTs = []
    let wolfNFTs = []
    let wolfpackarrayNFTs = []
    for await (const nftsId of arrayId) {
        const _tokenAddress = await marketInst.methods.tokenAddress(nftsId).call()
        const _tokenId = await marketInst.methods.tokenId(nftsId).call()
        const _sellerAddress = await marketInst.methods.sellerAddress(nftsId).call()
        const _askingPriceInDollars = await marketInst.methods.askingPriceInDollars(nftsId).call()
        const NFTData = { tokenAddress: _tokenAddress, tokenId: _tokenId, sellerAddress: _sellerAddress, askingPrice: _askingPriceInDollars, id: nftsId }
        if (_tokenAddress == MaterialsNFTJSON.address) {
            materialNFTs.push(NFTData)
        }
        if (_tokenAddress == WolfsNFTJSON.address) {
            wolfNFTs.push(NFTData)
        }
        if (_tokenAddress == WolfPacksNFTJSON.address) {
            wolfpackarrayNFTs.push(NFTData)
        }
    }
    let materialNFT = await getMaterialNFT(materialNFTs);
    let wolfNFT = await getWolfNFT(wolfNFTs);
    let wolfpackarrayNFT = await getWolfPackNFT(wolfpackarrayNFTs);
    let db = 'nft_array';
    let _materialNFT = 'materialNFT';
    let _woflNFT = 'woflNFT';
    let _wolfPackNFT = 'wolfPackNFT';
    const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const real_db = client.db(db);
    const real_col_materialNFT = real_db.collection(_materialNFT);
    const real_col_woflNFT = real_db.collection(_woflNFT);
    const real_col_wolfPackNFT = real_db.collection(_wolfPackNFT);
    await real_col_materialNFT.insertMany(materialNFT);
    await real_col_woflNFT.insertMany(wolfNFT);
    await real_col_wolfPackNFT.insertMany(wolfpackarrayNFT);
    client.close();
}
async function removeItemsNFTs(arrayId) {
    let db = 'nft_array';
    let _materialNFT = 'materialNFT';
    let _woflNFT = 'woflNFT';
    let _wolfPackNFT = 'wolfPackNFT';
    const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const real_db = client.db(db);
    const real_col_materialNFT = real_db.collection(_materialNFT);
    const real_col_woflNFT = real_db.collection(_woflNFT);
    const real_col_wolfPackNFT = real_db.collection(_wolfPackNFT);
    const web3 = await new Web3(
        new Web3.providers.HttpProvider(env.rpcprovider)
    );
    const marketInst = new web3.eth.Contract(
        Market_Contract.abi,
        Market_Contract.address
    );
    for await (const nftsId of arrayId) {
        let nft_data = {
            id: nftsId
        };
        const _tokenAddress = await marketInst.methods.tokenAddress(nftsId).call()
        if (_tokenAddress == MaterialsNFTJSON.address) {
            const cursor = await real_col_materialNFT.deleteOne(nft_data);
            console.log("cursor====>", cursor);
        }
        if (_tokenAddress == WolfsNFTJSON.address) {
            const cursor = await real_col_woflNFT.deleteOne(nft_data);
            console.log("cursor====>", cursor);
        }
        if (_tokenAddress == WolfPacksNFTJSON.address) {
            const cursor = await real_col_wolfPackNFT.deleteOne(nft_data);
            console.log("cursor====>", cursor);
        }
    }
    client.close();
}
exports.scan_event = scan_event;