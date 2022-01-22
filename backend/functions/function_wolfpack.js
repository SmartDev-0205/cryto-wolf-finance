const { MongoClient } = require('mongodb');
const env = require('../config');
const { filter_pointsOfWolfPack, filter_wolfPackLife, filter_level } = require('../functions/utils');

async function insertwolfPackNFT(id, tokenId, wolfPackLink, totalSlotsAvailable_, totalSlotsInWolfPack, pointsOfWolfPack, wolfPackLife, wolfPackEnergy, wolfPackInPromo, askingPrice) {
    let result;
    const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });

    let db = 'nft_array';
    let col = 'wolfPackNFT';
    let col_add = 'addList';

    await client.connect();
    const real_db = client.db(db);
    const real_col = real_db.collection(col);
    const real_col_add = real_db.collection(col_add);

    let nft_data = {
        id: id,
        tokenId: tokenId,
        wolfPackLink: wolfPackLink,
        totalSlotsAvailable_: totalSlotsAvailable_,
        totalSlotsInWolfPack: totalSlotsInWolfPack,
        pointsOfWolfPack: pointsOfWolfPack,
        wolfPackLife: wolfPackLife,
        wolfPackEnergy: wolfPackEnergy,
        wolfPackInPromo: wolfPackInPromo,
        askingPrice: askingPrice
    };
    let nft_data_add = {
        id: id,
    };

    const cursor = await real_col.insertOne(nft_data);
    console.log("cursor====>", cursor);
    if (cursor)
        await real_col_add.insertOne(nft_data_add)
    client.close();

    return cursor;
}

async function removewolfPackNFT(id) {
    let result;
    const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });

    let db = 'nft_array';
    let col = 'wolfPackNFT';
    let col_remove = 'removeList';

    await client.connect();
    const real_db = client.db(db);
    const real_col = real_db.collection(col);
    const real_col_remove = real_db.collection(col_remove);

    let nft_data = {
        id: id
    };

    var cursor = await real_col.find(nft_data).toArray();
    if (cursor.length > 0) {
        await real_col.deleteOne(nft_data);
        await real_col_remove.insertOne(nft_data);
    }
    client.close();

    return cursor;
}

async function filterwolfPackNFT(pointsOfWolfPack, wolfPackLife) {
    console.log('run filter function')
    let result;
    const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });

    let db = 'nft_array';
    let col = 'wolfPackNFT';

    await client.connect();
    const real_db = client.db(db);
    const real_col = real_db.collection(col);

    let filters = [];

    console.log(pointsOfWolfPack, wolfPackLife);

    if (pointsOfWolfPack) filters.push(filter_pointsOfWolfPack(pointsOfWolfPack));
    if (wolfPackLife) filters.push(filter_wolfPackLife(wolfPackLife));
    let filter = {
        $and: filters
    }

    console.log('filter', filter);

    const cursor = await real_col.find().toArray();

    return cursor;
}


exports.insertwolfPackNFT = insertwolfPackNFT;
exports.removewolfPackNFT = removewolfPackNFT;
exports.filterwolfPackNFT = filterwolfPackNFT;