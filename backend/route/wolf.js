var express = require('express');
var app = express();
const { insertwolfNFT, removewolfNFT, filterwolfNFT } = require('../functions/function_wolf');
const { beautify, beautify_num } = require('../functions/utils');

app.post('/add', async function(req, res) {
  console.log('wolf add request');
  let attack, defense, gender, level, breed, tokenId, askingPrice, id,health;
  
  attack = req.body.attack;
  defense = req.body.defense;
  health = req.body.health;
  gender = req.body.gender;
  level = req.body.level;
  breed = req.body.breed;
  tokenId = req.body.tokenId;
  askingPrice = req.body.askingPrice;
  id = req.body.id;

  let result = await insertwolfNFT(attack, defense,health, gender, level, breed, tokenId, askingPrice, id);
  
  if(result === true)
  {
    res.header(200).json({ status: "success" });
  }else{
    res.header(400).json({ status: "fail" });
  }
});

app.post('/remove', async function(req, res){	
  let id;

  id = req.body.id;

  let result = await removewolfNFT(id);
  
  if(result === true)
  {
    res.header(200).json({ status: "success" });
  }else{
    res.header(400).json({ status: "fail" });
  }
});

// ADD NEW USER POST ACTION
app.post('/filter', async function(req, res){	
  console.log('wolf filter request');
  let attack, defense, gender, breed,level,health;
  
  attack = req.body.attack;
  defense = req.body.defense;
  gender = req.body.gender;
  breed = req.body.breed;
  level = req.body.level;
  health = req.body.health;

  attack = beautify_num(attack);
  defense = beautify_num(defense);
  health = beautify_num(health);
  // gender = beautify(gender);
  // breed = beautify(breed);

  let result = await filterwolfNFT(attack, defense,health, gender,breed, level);
  
  console.log(result);
  if(result === false)
  {
    console.log('false')
    res.header(400).json({ status: "fail" });
  }else{
    console.log('true')
    res.header(200).json({ status: JSON.stringify(result) });
  }
})

module.exports = app;