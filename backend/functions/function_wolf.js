const { MongoClient } = require('mongodb');
const { filter_attack, filter_defense, filter_health, filter_gender, filter_breed, filter_level } = require('../functions/utils');

const env = require('../config');

async function insertwolfNFT(attack, defense, health, gender, level, breed, tokenId, askingPrice, id) {
  console.log('run wolf add function');
  let result;
  const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });

  let db = 'nft_array';
  let col = 'woflNFT';
  let col_add = 'addList';

  await client.connect();
  const real_db = client.db(db);
  const real_col = real_db.collection(col);
  const real_col_add = real_db.collection(col_add);

  let nft_data = {
    attack: attack,
    defense: defense,
    health: health,
    gender: gender,
    level: level,
    breed: breed,
    tokenId: tokenId,
    askingPrice: askingPrice,
    id: id
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

async function removewolfNFT(id) {
  let result;
  const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });

  let db = 'nft_array';
  let col = 'woflNFT';
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

async function filterwolfNFT(attack, defense, health, gender, breed, level) {
  console.log('run filter function')
  let result;
  const client = new MongoClient(env.database.url, { useNewUrlParser: true, useUnifiedTopology: true });

  let db = 'nft_array';
  let col = 'woflNFT';

  await client.connect();
  const real_db = client.db(db);
  const real_col = real_db.collection(col);

  let filters = [];

  console.log(attack, defense, health, gender, breed, level);

  if (attack) filters.push(filter_attack(attack));
  if (defense) filters.push(filter_defense(defense));
  if (health) filters.push(filter_health(health));
  if (gender?.length > 0)
    filters.push(filter_gender(gender));
  if (breed?.length > 0)
    filters.push(filter_breed(breed));
  if (level?.length > 0)
    filters.push(filter_level(level));
  let filter = {
    $and: filters
  }

  console.log('filter', filter);

  const cursor = await real_col.find(filter).toArray();

  return cursor;
}

exports.insertwolfNFT = insertwolfNFT;
exports.removewolfNFT = removewolfNFT;
exports.filterwolfNFT = filterwolfNFT;