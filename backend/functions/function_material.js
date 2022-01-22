const { MongoClient } = require('mongodb');
const env = require('../config');
const { filter_level } = require('../functions/utils');

async function insertmaterialNFT(level, tokenId, askingPrice, id) {
    let result;
    const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });

    let db = 'nft_array';
    let col = 'materialNFT';
    let col_add = 'addList';

    await client.connect();
    const real_db = client.db(db);
    const real_col = real_db.collection(col);
    const real_col_add = real_db.collection(col_add);

    let nft_data = {
        level: level,
        tokenId: tokenId,
        askingPrice: askingPrice,
        id: id,
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


async function removematerialNFT(id) {
    let result;
    const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });

    let db = 'nft_array';
    let col = 'materialNFT';
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

async function filtermaterialNFT(level) {
    console.log('run filter function')
    let result;
    const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });

    let db = 'nft_array';
    let col = 'materialNFT';
    console.log(level);

    await client.connect();
    const real_db = client.db(db);
    const real_col = real_db.collection(col);
    let filters = [];
    let filter;
    if (level?.length > 0) {
        filters.push(filter_level(level));
        filter = {
            $and: filters
        }
    }

    console.log('filter', filter);

    const cursor = await real_col.find(filter).toArray();

    return cursor;
}

exports.insertmaterialNFT = insertmaterialNFT;
exports.removematerialNFT = removematerialNFT;
exports.filtermaterialNFT = filtermaterialNFT;
