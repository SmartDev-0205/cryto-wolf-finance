var express = require('express');
var app = express();
const { insertwolfPackNFT, removewolfPackNFT ,filterwolfPackNFT} = require('../functions/function_wolfpack');
const { beautify, beautify_num } = require('../functions/utils');

app.post('/add', async function(req, res) {
  console.log('add wolf pack nft data');

  let id, tokenId, wolfPackLink, totalSlotsAvailable_, totalSlotsInWolfPack, pointsOfWolfPack, wolfPackLife, wolfPackEnergy, wolfPackInPromo, askingPrice;
  
  id = req.body.id;
  tokenId = req.body.tokenId;
  wolfPackLink = req.body.wolfPackLink;
  totalSlotsAvailable_ = req.body.totalSlotsAvailable_;
  totalSlotsInWolfPack = req.body.totalSlotsInWolfPack;
  pointsOfWolfPack = req.body.pointsOfWolfPack;
  wolfPackLife = req.body.wolfPackLife;
  wolfPackEnergy = req.body.wolfPackEnergy;
  wolfPackInPromo = req.body.wolfPackInPromo;
  askingPrice = req.body.askingPrice;
  

  let result = await insertwolfPackNFT(id, tokenId, wolfPackLink, totalSlotsAvailable_, totalSlotsInWolfPack, pointsOfWolfPack, wolfPackLife, wolfPackEnergy, wolfPackInPromo, askingPrice);
  
  if(result === true)
  {
    res.header(200).json({ status: "success" });
  }else{
    res.header(400).json({ status: "fail" });
  }
});

app.post('/remove', async function(req, res){	
  console.log('remove wolfpack nft data');

  let id;

  id = req.body.id;

  let result = await removewolfPackNFT(id);
  
  if(result === true)
  {
    res.header(200).json({ status: "success" });
  }else{
    res.header(400).json({ status: "fail" });
  }
});

// ADD NEW USER POST ACTION
app.post('/filter', async function(req, res){	
  console.log('wolfpack filter request');
  let pointsOfWolfPack, wolfPackLife;
  
  pointsOfWolfPack = req.body.pointsOfWolfPack;
  wolfPackLife = req.body.wolfPackLife;
  
  pointsOfWolfPack = beautify_num(pointsOfWolfPack);
  wolfPackLife = beautify_num(wolfPackLife);
  let result = await filterwolfPackNFT(pointsOfWolfPack, wolfPackLife);
  
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