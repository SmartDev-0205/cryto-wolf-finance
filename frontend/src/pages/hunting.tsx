/* eslint-disable no-await-in-loop */
import { useEffect, useState } from "react";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";

import CenteredFooter from "../footer/CenteredFooter";
import MainMenu from "../navigation/MainMenu";
import Modal from "react-modal";
import { useWeb3modal } from "../context/Web3modal";
import WolfPacksNFTJSON from "../contracts/WolfPacksNFT.json";
import HuntingNFTJSON from "../contracts/HuntingNFT.json";
import { ethers } from "ethers";
import Web3 from "web3";
import config from "../utils/AppConfig";
import { MultiCall } from "eth-multicall";
import { useTranslation } from "next-i18next";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";
import { useToast } from "../components/toast/ToastProvider";
import Link from "next/link";
import VariablesJSON from "../contracts/Variables.json";
import moment from "moment";

function Home() {
  const toast = useToast();
  const { web3Provider, address, connect }: any = useWeb3modal();

  const [modalHuntIsOpen, setModalHuntIsOpen] = useState(false);
  const [modalHuntStep, setModalHuntStep] = useState(1);
  const [wolfPackList, setWolfPackList] = useState([] as any);
  const [wolfPackActiveList, setWolfPackActiveList] = useState([] as any);
  const [huntList, setHuntList] = useState([] as any);
  const [animalsList, setAnimalsList] = useState([] as any);
  const [selectedWolfPack, setSelectedWolfPack] = useState(0); // index del array para obtener manada wolfPackList[selectedWolfPack].tokenId.toString()
  const [selectedAnimal, setSelectedAnimal] = useState(0); // index del array
  const [selectedAnimalStats, setSelectedAnimalStats] = useState([] as any);
  const [probabilityWin, setProbabilityWin] = useState(0);

  const { t } = useTranslation("hunting");

  function openModalHunt() {
    setModalHuntIsOpen(true);
    calculateProbabilityWin();
  }
  function closeModalHunt() {
    setModalHuntIsOpen(false);
  }

  function removeZeros(number: number) {
    let newNumber = ethers.utils.formatUnits(number, 18);

    return parseFloat(newNumber)
      .toFixed(2)
      .replace(/(\.0+|0+)$/, "");
  }

  const calculateProbabilityWin = async () => {
    let probability = 0;

    if (selectedAnimalStats[0]) {
      probability = parseInt(selectedAnimalStats[0].probability);
    }

    const signer = web3Provider.getSigner();
    const HuntingNFTJSONInst = new ethers.Contract(
      HuntingNFTJSON.address,
      HuntingNFTJSON.abi,
      signer
    );

    if (selectedWolfPack != null && wolfPackList[selectedWolfPack] != null) {
      const contractProbability = await HuntingNFTJSONInst.getWinProbability(
        wolfPackList[selectedWolfPack].tokenId,
        selectedAnimal
      );

      if (contractProbability != null) {
        probability = contractProbability.toString();
      }
    }

    setProbabilityWin(probability);
  };

  const changeAnimal = async (_animalId: number) => {
    const signer = web3Provider.getSigner();

    const HuntingNFTJSONInst = new ethers.Contract(
      HuntingNFTJSON.address,
      HuntingNFTJSON.abi,
      signer
    );

    const [animalsPoints, animalsProbability, animalsRewards] =
      await Promise.all([
        HuntingNFTJSONInst.animalsPoints(_animalId),
        HuntingNFTJSONInst.animalsProbability(_animalId),
        HuntingNFTJSONInst.animalsRewards(_animalId),
      ]);

    setSelectedAnimal(_animalId);

    const variablesInst = new ethers.Contract(
      VariablesJSON.address,
      VariablesJSON.abi,
      signer
    );

    let cwolf = await variablesInst.getDollarsInCWOLF(animalsRewards);

    if (cwolf != null) {
      cwolf = removeZeros(cwolf.toString());
    } else {
      cwolf = 0;
    }

    setSelectedAnimalStats([
      {
        points: animalsPoints.toString(),
        probability: animalsProbability.toString(),
        reward: removeZeros(animalsRewards),
        reward_cwolf: cwolf,
      },
    ]);

    calculateProbabilityWin();
  };

  function diffInDaysLink(timestamp: number) {
    let currentDate = moment
      .utc()
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    let contractDate = moment
      .utc(timestamp * 1000)
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    let diff = currentDate.diff(contractDate, "days");

    return diff;
  }

  function timeDifferenceNow(date2: number) {
    let difference =
      date2 - parseInt("" + parseInt("" + new Date().getTime(), 10) / 1000, 10);

    if (difference <= 0) {
      return "0d";
    }

    const daysDifference = Math.floor(difference / 60 / 60 / 24);
    difference -= daysDifference * 60 * 60 * 24;

    const hoursDifference = Math.floor(difference / 60 / 60);
    difference -= hoursDifference * 60 * 60;

    return daysDifference + "d " + hoursDifference + "h ";
  }

  const goHunting = async () => {
    closeModalHunt();
    const signer = web3Provider.getSigner();

    const HuntingNFTJSONInst = new ethers.Contract(
      HuntingNFTJSON.address,
      HuntingNFTJSON.abi,
      signer
    );

    const gas = await HuntingNFTJSONInst.calculateGasAndCommissions(
      selectedAnimal
    );
    HuntingNFTJSONInst.mintWithCWOLF(
      wolfPackList[selectedWolfPack].tokenId.toString(),
      selectedAnimal,
      { value: gas[2] }
    ).then(
      (_result: any) => {
        toast?.pushInfo("Wolf pack sent to hunt.", 8000);
      },
      (_error: any) => {
        if (_error.code === -32603) {
          toast?.pushError(
            _error.data.message.replace("execution reverted:", "Error:"),
            8000
          );
        } else {
          toast?.pushError("Error to send the wolf pack to hunt.", 8000);
        }
      }
    );

    HuntingNFTJSONInst.on("MintedNFT", (to, _tokenId) => {
      if (address === to) {
        toast?.pushInfo("The wolf pack has finished the hunt.", 8000);
        getHunt();
        // TODO API: http://localhost:3000/api/huntValuesTest/?huntId=_tokenId
      }
    });
  };

  const getWolfPacks = async () => {
    const signer = web3Provider.getSigner();

    const WolfPacksNFTInst = new ethers.Contract(
      WolfPacksNFTJSON.address,
      WolfPacksNFTJSON.abi,
      signer
    );

    const web3 = await new Web3(
      new Web3.providers.HttpProvider(config.RPC_URL!)
    );

    const contract = await new web3.eth.Contract(
      WolfPacksNFTJSON.abi as [],
      WolfPacksNFTJSON.address as string
    );

    let arrayNFTs = await WolfPacksNFTInst.walletOfOwner(address);
    arrayNFTs = [...arrayNFTs].reverse();

    const calls = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const tokenId of arrayNFTs) {
      calls.push({
        wolfPackLinkDate: contract.methods.wolfPackLinkDate(tokenId.toString()),
        wolfPackLinkDays: contract.methods.wolfPackLinkDays(tokenId.toString()),
        getTotalSlotsAvailableInWolfPack:
          contract.methods.getTotalSlotsAvailableInWolfPack(tokenId.toString()),
        getTotalSlotsInWolfPack: contract.methods.getTotalSlotsInWolfPack(
          tokenId.toString()
        ),
        pointsOfWolfPack: contract.methods.pointsOfWolfPack(tokenId.toString()),
        wolfPackLife: contract.methods.wolfPackLife(tokenId.toString()),
        wolfPackEnergy: contract.methods.wolfPackEnergy(tokenId.toString()),
        wolfPackInPromo: contract.methods.wolfPackInPromo(tokenId.toString()),
        getTotalMaterialsInWolfPack:
          contract.methods.getTotalMaterialsInWolfPack(tokenId.toString()),
        getLastHunting: contract.methods.lastHunting(tokenId.toString()),
      });
    }

    const multicall = new MultiCall(web3, config.MULTICALL);
    const results = await multicall.all([calls]);

    const arrayItems = [];
    if (results[0]) {
      for (let index = 0; index < results[0]?.length; index += 1) {
        arrayItems.push({
          id: index,
          tokenId: arrayNFTs[index],
          wolfPackLinkDate: results[0][index].wolfPackLinkDate,
          wolfPackLinkDays: results[0][index].wolfPackLinkDays,
          //wolfPackLinkRemainingDays: diffInDaysLink(results[0][index].wolfPackLinkDate),
          wolfPackLinkRemainingDays: results[0][index].wolfPackLinkDays,
          totalSlotsAvailableInWolfPack:
            results[0][index].getTotalSlotsAvailableInWolfPack,
          totalSlotsInWolfPack: results[0][index].getTotalSlotsInWolfPack,
          pointsOfWolfPack: results[0][index].pointsOfWolfPack,
          wolfPackLife: results[0][index].wolfPackLife,
          wolfPackEnergy: results[0][index].wolfPackEnergy,
          wolfPackInPromo: results[0][index].wolfPackInPromo,
          totalMaterialsInWolfPack:
            results[0][index].getTotalMaterialsInWolfPack,
          wolfPackLink: timeDifferenceNow(
            parseInt(results[0][index].wolfPackLinkDate, 10) +
              parseInt(results[0][index].wolfPackLinkDays, 10) * 86400
          ),
          lastHunting: results[0][index].getLastHunting,
        });
      }

      const arrayItemsActive = arrayItems.filter((item: any) => {
        return true;
        //return item.wolfPackEnergy > 0 || item.wolfPackLink != "0d";
      });

      setWolfPackList(arrayItems);
      setWolfPackActiveList(arrayItemsActive);
    }
  };

  const getHunt = async () => {
    const signer = web3Provider.getSigner();

    const HuntingNFTInst = new ethers.Contract(
      HuntingNFTJSON.address,
      HuntingNFTJSON.abi,
      signer
    );

    const web3 = await new Web3(
      new Web3.providers.HttpProvider(config.RPC_URL!)
    );

    const contract = await new web3.eth.Contract(
      HuntingNFTJSON.abi as [],
      HuntingNFTJSON.address as string
    );

    const contractWolfPacksNFT = await new web3.eth.Contract(
      WolfPacksNFTJSON.abi as [],
      WolfPacksNFTJSON.address as string
    );

    let arrayNFTs = await HuntingNFTInst.walletOfOwner(address);
    arrayNFTs = [...arrayNFTs].reverse();

    const calls = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const tokenId of arrayNFTs) {
      calls.push({
        wolfPackId: contract.methods.wolfPackId(tokenId.toString()),
        positionToAttack: contract.methods.positionToAttack(tokenId.toString()),
        rewards: contract.methods.rewards(tokenId.toString()),
        isGenerated: contract.methods.isGenerated(tokenId.toString()),
        dateOfHunting: contract.methods.dateOfHunting(tokenId.toString()),
      });
    }

    const multicall = new MultiCall(web3, config.MULTICALL);
    const results = await multicall.all([calls]);

    const calls2 = [];
    if (results[0]) {
      for (let index = 0; index < results[0]?.length; index += 1) {
        calls2.push({
          dateOfHuntingWolfPack: contractWolfPacksNFT.methods.lastHunting(
            results[0][index].wolfPackId.toString()
          ),
        });
      }
    }

    const results2 = await multicall.all([calls2]);

    const arrayItems = [];
    if (results[0] && results2[0]) {
      for (let index = 0; index < results[0]?.length; index += 1) {
        arrayItems.push({
          id: index,
          tokenId: arrayNFTs[index],
          wolfPackId: results[0][index].wolfPackId,
          positionToAttack: results[0][index].positionToAttack,
          dateOfHunting: results[0][index].dateOfHunting,
          dateOfHuntingWolfPack: results2[0][index].dateOfHuntingWolfPack,
          rewards: results[0][index].rewards,
          isGenerated: results[0][index].isGenerated,
        });
        // TODO API: http://localhost:3000/api/huntValuesTest/?huntId=arrayNFTs[index]
      }
      setHuntList(arrayItems);
    }
  };

  useEffect(() => {
    if (web3Provider) {
      getWolfPacks();
      getHunt();
      changeAnimal(0);
    }

    setAnimalsList([
      "Chicken",
      "Duck",
      "Rabbit",
      "Toucan",
      "Hyena",
      "Penguin",
      "Fox",
      "Goat",
      "Sheep",
      "Pig",
      "Panda",
      "Cow",
      "Horse",
      "Golden Eagle",
      "Boar",
      "Deer",
      "Camel",
      "Bull",
      "Leopard",
      "Cocodrile",
      "Zebra",
      "Longhorn Cattle",
      "Tiger",
      "Comodo Dragon",
      "Buffalo",
      "Lion",
      "Bear",
      "Hippopotamus",
      "Rhino",
      "Elephant",
    ]);
  }, [web3Provider]);

  return (
    <div className="Home">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
        />
        <title>Hunting | CryptoWolf</title>
        <meta name="description" content="CryptoWolf" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className="feast-wrapper">
        <img
          className="bg-web"
          src="https://cdn.cryptowolf.finance/images/background-wolf.jpg"
          alt="BACKGROUND"
        ></img>
        <header className="header">
          <MainMenu />
        </header>
        <Modal
          isOpen={modalHuntIsOpen}
          onRequestClose={closeModalHunt}
          ariaHideApp={false}
          className="modal-hunting"
        >
          <div className="modal-text">
            <div className="w-full flex flex-col">
              {modalHuntStep == 1 ? (
                <div className="w-full">
                  <span>{t("wolfpack")}</span>
                  <select
                    onChange={(event) => {
                      setSelectedWolfPack(parseInt(event.target.value));
                      calculateProbabilityWin();
                    }}
                    value={selectedWolfPack}
                    className="my-2 w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  >
                    {wolfPackActiveList.map((item: any, index: any) => (
                      <>
                        <option
                          id={"WolfPack" + index}
                          key={index}
                          value={index}
                        >
                          {"#" + item.tokenId.toString()} |{" "}
                          {t("life") + " " + item.wolfPackLife} |{" "}
                          {t("attack") + " " + item.pointsOfWolfPack} |{" "}
                          {t("energy") + " " + removeZeros(item.wolfPackEnergy)}{" "}
                          | {"Wolf Bond " + item.wolfPackLinkRemainingDays + "d"}
                        </option>
                      </>
                    ))}
                  </select>
                  <Carousel
                    showIndicators={false}
                    selectedItem={selectedWolfPack}
                    onClickItem={(event) => {
                      setSelectedWolfPack(event);
                      calculateProbabilityWin();
                    }}
                    onChange={(event) => {
                      setSelectedWolfPack(event);
                      calculateProbabilityWin();
                    }}
                  >
                    {wolfPackActiveList.map((item: any, index: any) => {
                      return (
                        <div key={`wolfPackList-${index}`}>
                          <div className="relative wolfPack-main">
                            {item.wolfPackInPromo ? (
                              <>
                                <div
                                  style={{
                                    position: "absolute",
                                    left: "2rem",
                                    top: "2rem",
                                    background: "rgb(6, 18, 49)",
                                    padding: "0.5rem",
                                    fontSize: "10px",
                                    fontWeight: "bold",
                                  }}
                                  className="rounded-lg"
                                >
                                  20% BONUS
                                </div>
                              </>
                            ) : (
                              <></>
                            )}
                            <div
                              style={{
                                position: "absolute",
                                right: "2rem",
                                top: "2rem",
                                background: "rgb(6, 18, 49)",
                                padding: "0.5rem",
                                fontSize: "10px",
                                fontWeight: "normal",
                              }}
                              className="rounded-lg"
                            >
                              #{item.tokenId?.toString()}
                            </div>
                            <img
                              src={`https://cdn.cryptowolf.finance/images/wolfpack/wolfpack.jpg`}
                              alt="Card"
                              className="background"
                            />
                            <div className="w-full h-full absolute top-0 left-0 flex justify-end items-end gap-3 wolfPacks-item-bg">
                              <div className="flex gap-1 text-center">
                                <svg width="24" height="24">
                                  <path
                                    fill="#FFFFFF"
                                    d="M14.851 11.923c-.179-.641-.521-1.246-1.025-1.749-1.562-1.562-4.095-1.563-5.657 0l-4.998 4.998c-1.562 1.563-1.563 4.095 0 5.657 1.562 1.563 4.096 1.561 5.656 0l3.842-3.841.333.009c.404 0 .802-.04 1.189-.117l-4.657 4.656c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-1.952-1.951-1.952-5.12 0-7.071l4.998-4.998c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464.493.493.861 1.063 1.105 1.672l-.787.784zm-5.703.147c.178.643.521 1.25 1.026 1.756 1.562 1.563 4.096 1.561 5.656 0l4.999-4.998c1.563-1.562 1.563-4.095 0-5.657-1.562-1.562-4.095-1.563-5.657 0l-3.841 3.841-.333-.009c-.404 0-.802.04-1.189.117l4.656-4.656c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464 1.951 1.951 1.951 5.119 0 7.071l-4.999 4.998c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-.494-.495-.863-1.067-1.107-1.678l.788-.785z"
                                  />
                                </svg>
                                <span>{item.wolfPackLinkRemainingDays + "d"}</span>
                              </div>
                              <div className="flex gap-1 text-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  version="1.0"
                                  className="h-6"
                                  viewBox="0 0 1230.000000 1280.000000"
                                  preserveAspectRatio="xMidYMid meet"
                                >
                                  <g
                                    transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                                    fill="#ffffff"
                                    stroke="none"
                                  >
                                    <path d="M10122 12729 l-2123 -66 -82 -80 c-75 -72 -3682 -3574 -4649 -4513 l-406 -395 70 -10 70 -10 -54 -52 -55 -51 101 -6 c56 -3 317 -13 581 -21 264 -8 615 -20 780 -25 165 -6 488 -17 719 -25 230 -8 420 -15 422 -17 2 -2 -866 -827 -1928 -1833 -1062 -1007 -2022 -1917 -2134 -2022 l-203 -193 74 0 c41 0 75 -2 75 -4 0 -2 -26 -29 -57 -59 l-57 -55 200 -6 c109 -3 494 -11 854 -17 360 -6 656 -12 657 -13 0 0 -665 -702 -1479 -1559 -814 -857 -1478 -1560 -1476 -1561 2 -2 59 27 128 65 69 37 129 68 135 69 5 0 -31 -42 -80 -92 -50 -51 -106 -110 -125 -132 l-35 -38 75 40 c41 22 1135 604 2430 1292 1295 689 2936 1561 3646 1938 l1292 687 -120 5 -119 5 101 54 c56 29 99 55 97 57 -4 4 -1463 -9 -2234 -20 -178 -2 -323 -1 -322 2 0 4 460 356 1022 783 562 427 1517 1154 2122 1614 605 461 1370 1043 1699 1294 l600 456 -89 5 -88 5 72 55 72 55 -1213 6 c-667 3 -1311 7 -1430 8 l-217 1 52 48 c29 27 939 838 2022 1803 2778 2473 2775 2470 2775 2475 0 2 -37 1 -82 -2 l-83 -5 64 60 c36 33 63 62 60 64 -2 2 -959 -27 -2127 -64z" />
                                  </g>
                                </svg>
                                <span>{removeZeros(item.wolfPackEnergy)}</span>
                              </div>
                              <div className="flex gap-1 text-center">
                                <svg viewBox="0 0 5480 4900" className="h-6">
                                  <g fill="#FFFFFF">
                                    <path d="M2570 4729 c-678 -358 -1286 -879 -1695 -1451 -272 -382 -477 -829 -570 -1243 -47 -209 -58 -327 -52 -555 7 -288 41 -445 141 -655 120 -251 298 -436 528 -548 133 -65 234 -88 403 -94 164 -6 264 9 413 62 374 134 721 506 933 998 l33 79 15 -34 c274 -629 665 -1005 1137 -1094 67 -12 123 -15 229 -11 169 6 270 29 403 94 332 161 557 476 644 903 28 135 36 463 15 620 -77 582 -362 1192 -811 1737 -193 233 -536 554 -812 759 -279 208 -756 494 -821 494 -10 0 -70 -28 -133 -61z" />
                                  </g>
                                </svg>
                                <span>{item.wolfPackLife}</span>
                              </div>
                              <div className="flex gap-1 text-center">
                                <svg viewBox="0 0 8.5 11" className="h-6">
                                  <g fill="#FFFFFF">
                                    <path d="m4.25 1.3382l-3.7545 1.128c0.09209 2.7926 0.7929 6.1993 3.7545 7.1956 2.9942-0.9678 3.6274-4.4327 3.7545-7.1956l-3.7545-1.128z" />
                                  </g>
                                </svg>
                                <span>
                                  {item.wolfPackLife - item.pointsOfWolfPack}
                                </span>
                              </div>
                              <div className="flex gap-1 text-center">
                                <svg
                                  viewBox="0 0 223.24 294.42"
                                  className="h-6"
                                >
                                  <g
                                    fill="#FFFFFF"
                                    transform="translate(-260.22 -345.13)"
                                  >
                                    <path
                                      id="path4352"
                                      d="m434.08 345.13c-0.97 0-6.14 7.04-11.47 15.62-14.36 23.1-38.51 54.1-43.69 56.09-2.49 0.96-7.43 2.01-10.97 2.32-6.51 0.57-14.52 7.47-32.31 27.81-7.69 8.79-12.88 12.1-26.1 16.66-10.16 3.49-19.04 8.38-23.09 12.71-6.03 6.45-6.31 7.48-3.37 12.41 1.76 2.96 8.93 8.5 15.93 12.28l12.72 6.88-3.19 11.28c-1.76 6.21-3.23 14.68-3.25 18.81-0.01 4.13-2.4 12.33-5.31 18.19-5.61 11.3-13.59 41.66-14.75 56.12-0.41 5.07-20.6 27.24-25.01 27.24h195.33c-0.03-7.72-1.92-18.71-2.94-19.39-2.81-1.86 0.03-30.73 3.62-36.88 4.77-8.14 3.78-22.99-2.5-37.4-4.66-10.7-5.67-16.68-5.69-34.29-0.01-13.62 1.15-23.69 3.19-27.9 1.76-3.63 4.3-13.01 5.66-20.85 2.6-15.02 11.05-32.97 18.03-38.25 7-5.28 10.65-19.47 7.25-28.25-4.01-10.34-8.31-13.84-12.47-10.15-2.41 2.14-4.45 2.19-7.91 0.22-4.08-2.34-4.6-2.02-4.12 2.59 0.3 2.89-0.81 5.8-2.5 6.44-2.39 0.9-2.78-1.05-1.78-8.72 0.71-5.43 0.15-13.45-1.22-17.84-2.42-7.78-14.58-23.75-18.09-23.75z"
                                    ></path>
                                  </g>
                                </svg>
                                <span>
                                  {item.totalSlotsInWolfPack -
                                    item.totalSlotsAvailableInWolfPack}
                                </span>
                              </div>
                              <div className="flex gap-1 text-center">
                                <svg
                                  viewBox="0 0 320.66 320.66"
                                  className="h-6"
                                >
                                  <g transform="translate(274.62 -583.47)">
                                    <g fill="#FFFFFF">
                                      <path d="m-231.5 611.06c-3.9731 0-7.9374 1.5311-10.969 4.5625-6.0627 6.0627-6.0627 15.875 0 21.938 3.2523 3.2524 7.5864 4.7683 11.844 4.5312l39.375 39.406-39.188 39.188 34.75-11.781 9.6562-9.6562 44.531 44.5-95.375 95.375-5.5 32.625 32.656-5.4688 95.344-95.344 95.438 95.406 32.656 5.4688-5.48-32.7-95.406-95.406 44.5-44.5 9.6875 9.6875 34.75 11.781-39.25-39.25 39.375-39.344c4.2574 0.23709 8.5914-1.2789 11.844-4.5312 6.0627-6.0627 6.0627-15.875 0-21.938-3.0314-3.0314-6.9957-4.5625-10.969-4.5625-3.9731 0-7.9374 1.5311-10.969 4.5625-3.2523 3.2524-4.7683 7.5864-4.5312 11.844l-39.375 39.344-39.188-39.219 11.781 34.781 9.6875 9.6875-44.5 44.5-44.5-44.5 9.625-9.6562 11.781-34.75-39.16 39.16-39.44-39.43c0.21019-4.2275-1.2713-8.5213-4.5-11.75-3.0314-3.0314-7.0269-4.5625-11-4.5625z"></path>
                                    </g>
                                  </g>
                                </svg>
                                <span>{item.pointsOfWolfPack}</span>
                              </div>
                            </div>
                          </div>
                          <p
                            className="legend"
                            style={{ bottom: "25%", opacity: 1 }}
                          >
                            {"#" + item.tokenId.toString()} |{" "}
                            {t("life") + " " + item.wolfPackLife} |{" "}
                            {t("attack") + " " + item.pointsOfWolfPack} |{" "}
                            {t("energy") +
                              " " +
                              removeZeros(item.wolfPackEnergy)}{" "}
                            |{" "}
                            {"Wolf Bond" + " " + item.wolfPackLinkRemainingDays + "d"}
                          </p>
                        </div>
                      );
                    })}
                  </Carousel>
                  {wolfPackActiveList[selectedWolfPack] != null &&
                  wolfPackActiveList[selectedWolfPack].wolfPackEnergy != null &&
                  parseFloat(
                    removeZeros(
                      wolfPackActiveList[selectedWolfPack].wolfPackEnergy
                    )
                  ) <= 0 ? (
                    <div className="w-full text-center text-red-500">
                      This wolf pack is too tired.{" "}
                      <Link href="/wolf-pack">
                        <span className="cursor-pointer font-bold">
                          Buy energy!
                        </span>
                      </Link>
                    </div>
                  ) : null}
                  {wolfPackActiveList[selectedWolfPack] != null &&
                  wolfPackActiveList[selectedWolfPack]
                    .wolfPackLinkRemainingDays != null &&
                  wolfPackActiveList[selectedWolfPack]
                    .wolfPackLinkRemainingDays <= 0 ? (
                    <div className="w-full text-center text-red-500">
                      This wolf pack has a low wolf bond.{" "}
                      <Link href="/wolf-pack">
                        <span className="cursor-pointer font-bold">
                          Buy wolf bond!
                        </span>
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {modalHuntStep == 2 ? (
                <div className="w-full">
                  <span>{t("animal_to_hunt")}</span>
                  <select
                    onChange={(event) =>
                      changeAnimal(parseInt(event.target.value))
                    }
                    value={selectedAnimal}
                    className="my-2 w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  >
                    {animalsList.map((item: any, index: any) => (
                      <option key={index} value={index}>
                        {t("animals." + item.toLowerCase())}
                      </option>
                    ))}
                  </select>
                  <Carousel
                    showIndicators={false}
                    selectedItem={selectedAnimal}
                    onClickItem={(event) => changeAnimal(event)}
                    onChange={(event) => changeAnimal(event)}
                  >
                    {animalsList.map((item: any, index: any) => {
                      let src =
                        "https://cdn.cryptowolf.finance/images/hunting/" +
                        item.replaceAll(" ", "") +
                        "Env.png";

                      return (
                        <div>
                          <img src={src} />
                          <p
                            className="legend"
                            style={{ bottom: "0", opacity: 1 }}
                          >
                            {" "}
                            {t("animals." + item.toLowerCase())} |{" "}
                            {t("life") + " " + selectedAnimalStats[0].points} |{" "}
                            {t("reward") + " " + selectedAnimalStats[0].reward}
                            {"$ "}|{" "}
                            {t("energy_cost") +
                              " " +
                              selectedAnimalStats[0].reward * 0.025}{" "}
                          </p>
                        </div>
                      );
                    })}
                  </Carousel>
                  {parseFloat(selectedAnimalStats[0].points) >
                  parseFloat(
                    wolfPackActiveList[selectedWolfPack].pointsOfWolfPack
                  ) ? (
                    <div className="w-full mt-4 text-center text-red-500">
                      You do not have enough attack power for this animal.
                    </div>
                  ) : null}
                  {parseFloat(
                    removeZeros(
                      wolfPackActiveList[selectedWolfPack].wolfPackEnergy
                    )
                  ) < parseFloat(selectedAnimalStats[0].reward * 0.025 + "") ? (
                    <div className="w-full mt-4 text-center text-red-500">
                      You don't have enough energy for this animal.
                    </div>
                  ) : null}
                </div>
              ) : null}
              {modalHuntStep == 3 ? (
                <div className="w-full">
                  <div className="w-full flex flex-wrap items-center">
                    <div
                      className="w-full text-center text-xl font-bold mb-4"
                      style={{ color: "#cf3464" }}
                    >
                      {t("hunting_data")}
                    </div>
                    <div className="w-full flex flex-col justify-center items-center">
                      <div className="w-full">
                        {wolfPackList[selectedWolfPack].wolfPackInPromo ? (
                          <>
                            <div
                              style={{
                                background: "#050f28",
                                padding: "0.5rem",
                                fontSize: "1rem",
                                fontWeight: "bold",
                              }}
                              className="w-full text-center rounded-lg"
                            >
                              20% BONUS
                            </div>
                          </>
                        ) : (
                          <></>
                        )}
                      </div>
                      <div className="w-full text-center mt-4">
                        <ul className="flex flex-wrap justify-center items-center gap-2">
                          <li>
                            {t("life")}:{" "}
                            <span className="font-bold">
                              {wolfPackList[selectedWolfPack].wolfPackLife}
                            </span>
                          </li>
                          <li>
                            {t("attack")}:{" "}
                            <span className="font-bold">
                              {wolfPackList[selectedWolfPack].pointsOfWolfPack}
                            </span>
                          </li>
                          <li>
                            {t("energy")}:{" "}
                            <span className="font-bold">
                              {removeZeros(
                                wolfPackList[selectedWolfPack].wolfPackEnergy
                              )}
                            </span>
                          </li>
                          <li>
                            Wolf Bond:{" "}
                            <span className="font-bold">
                              {
                                wolfPackList[selectedWolfPack]
                                  .wolfPackLinkRemainingDays + "d"
                              }
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="relative w-full grid grid-cols-2 items-center">
                      <div>
                        <div className="p-4 rounded-lg flex flex-col justify-center items-center">
                          <img
                            style={{
                              maxWidth: "none",
                              width: "150%",
                              height: "auto",
                            }}
                            src="https://cdn.cryptowolf.finance/images/hunting/LoboWin.png"
                            alt="Wolf"
                          />
                        </div>
                      </div>
                      <div
                        className="absolute top-1/2 left-1/2"
                        style={{
                          transform: "translate(-50%, -50%)",
                          fontSize: "2rem",
                          fontWeight: "bold",
                          color: "#cf3464",
                        }}
                      >
                        VS
                      </div>
                      <div>
                        <img
                          src={
                            "https://cdn.cryptowolf.finance/images/hunting/" +
                            animalsList[selectedAnimal].replaceAll(" ", "") +
                            "Env.png"
                          }
                        />
                      </div>
                    </div>
                    <div className="w-full text-center">
                      <span className="text-red-500 text-lg font-bold">
                        -
                        {Number(selectedAnimalStats[0].reward * 0.025).toFixed(
                          2
                        )}
                      </span>{" "}
                      Energy,
                      <span
                        className={`ml-1 text-2xl ${
                          probabilityWin > 70
                            ? "text-green-500"
                            : probabilityWin > 50
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}
                      >
                        {probabilityWin}%
                      </span>{" "}
                      chance of a successful hunt.
                    </div>
                    <div className="w-full mt-1 text-center">
                      If the hunt is successful the wolf pack will lose{" "}
                      <span className="text-lg text-red-500 font-bold">
                        {(4 * selectedAnimalStats[0].points) / 100}
                      </span>{" "}
                      life, if the hunt is lost, the wolf pack will lose{" "}
                      <span className="text-lg text-red-500 font-bold">
                        {(10 * selectedAnimalStats[0].points) / 100}
                      </span>{" "}
                      life.
                    </div>
                    <div className="w-full flex justify-center items-center mt-2 text-xl text-center font-bold text-green-500">
                      REWARD{" "}
                      <div className="flex justify-center items-center text-center">
                        {!wolfPackList[selectedWolfPack].wolfPackInPromo ? (
                          <>
                            <span className="ml-1 text-2xl">
                              {Number(
                                selectedAnimalStats[0].reward_cwolf
                              ).toFixed(2)}
                            </span>
                            <small className="ml-1">CWOLF</small>
                          </>
                        ) : (
                          <>
                            <span
                              className="ml-1 text-sm"
                              style={{ textDecoration: "line-through" }}
                            >
                              {selectedAnimalStats[0].reward_cwolf}
                            </span>
                            <span className="ml-1 text-2xl">
                              {Number(
                                selectedAnimalStats[0].reward_cwolf * 1.2
                              ).toFixed(2)}
                            </span>
                            <small className="ml-1">CWOLF</small>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex w-full mt-8">
            <button
              className="modal-cancel float-left"
              onClick={closeModalHunt}
            >
              Cancel
            </button>
            <div className="ml-auto">
              {modalHuntStep == 3 ? (
                <>
                  <button
                    className="button button-regular mr-4"
                    onClick={() => {
                      setModalHuntStep(modalHuntStep - 1);
                      calculateProbabilityWin();
                    }}
                  >
                    Previous Step
                  </button>
                  <button
                    className="button button-primary"
                    onClick={() => {
                      goHunting();
                    }}
                  >
                    Go hunting
                  </button>
                </>
              ) : (
                <>
                  {modalHuntStep == 2 ? (
                    <>
                      <button
                        className="button button-regular mr-4"
                        onClick={() => {
                          setModalHuntStep(modalHuntStep - 1);
                          calculateProbabilityWin();
                        }}
                      >
                        Previous Step
                      </button>
                      {parseFloat(selectedAnimalStats[0].points) >
                        parseFloat(
                          wolfPackActiveList[selectedWolfPack].pointsOfWolfPack
                        ) ||
                      parseFloat(
                        removeZeros(
                          wolfPackActiveList[selectedWolfPack].wolfPackEnergy
                        )
                      ) <
                        parseFloat(
                          selectedAnimalStats[0].reward * 0.025 + ""
                        ) ? (
                        <button
                          className="button button-primary"
                          disabled={true}
                        >
                          Next step
                        </button>
                      ) : (
                        <button
                          className="button button-primary"
                          onClick={() => {
                            setModalHuntStep(modalHuntStep + 1);
                            calculateProbabilityWin();
                          }}
                        >
                          Next step
                        </button>
                      )}
                    </>
                  ) : null}
                  {modalHuntStep == 1 ? (
                    <>
                      {(wolfPackActiveList[selectedWolfPack] != null &&
                        wolfPackActiveList[selectedWolfPack].wolfPackEnergy !=
                          null &&
                        parseFloat(
                          removeZeros(
                            wolfPackActiveList[selectedWolfPack].wolfPackEnergy
                          )
                        ) <= 0) ||
                      (wolfPackActiveList[selectedWolfPack] != null &&
                        wolfPackActiveList[selectedWolfPack].wolfPackLinkRemainingDays !=
                          null &&
                        wolfPackActiveList[selectedWolfPack]
                          .wolfPackLinkRemainingDays <= 0) ? (
                        <button
                          className="button button-primary"
                          disabled={true}
                        >
                          Next step
                        </button>
                      ) : (
                        <button
                          className="button button-primary"
                          onClick={() => {
                            setModalHuntStep(modalHuntStep + 1);
                            calculateProbabilityWin();
                          }}
                        >
                          Next step
                        </button>
                      )}
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </Modal>
        <main className="w-full h-full flex flex-col p-4 md:p-8 lg:p-16 lg:pt-8">
          <div className="w-full flex justify-center mb-8 md:mb-12">
            <button
              onClick={() => openModalHunt()}
              className="button button-regular w-full md:w-1/2 lg:w-1/3 flex justify-center items-center"
            >
              <>Hunt</>
            </button>
          </div>
          <div className="w-full grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-8">
            <div className="px-2 py-1 rounded-lg flex flex-col justify-center items-center border border-solid border-green-500">
              <div className="w-full flex justify-center items-center font-bold text-lg text-uppercase">
                <div>{t("hunts_won")}</div>
                <div className="text-2xl ml-2">
                  #
                  {[...huntList].filter((item: any) => item.rewards > 0).length}
                </div>
              </div>
            </div>
            <div className="px-2 py-1 rounded-lg flex flex-col justify-center items-center border border-solid border-red-500">
              <div className="w-full flex justify-center items-center font-bold text-lg text-uppercase">
                <div>{t("hunts_lost")}</div>
                <div className="text-2xl ml-2">
                  #
                  {
                    [...huntList].filter(
                      (item: any) =>
                        item.rewards <= 0 &&
                        item.isGenerated != null &&
                        item.isGenerated == true
                    ).length
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="w-full mt-4 md:mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 lg:gap-12">
            {huntList.map((item: any, index: any) => {
              return (
                <div
                  className={`rounded-lg flex flex-col justify-center items-center`}
                >
                  <div
                    className="text-xl font-bold text-primary"
                    style={{ color: "#cf3464" }}
                  >
                    {t("hunting")} #{item.tokenId.toString()}
                  </div>
                  {item.isGenerated ? (
                    <>
                      <div className="w-full flex justify-center text-center">
                        {item.dateOfHunting != 0 ? (
                          <>
                            {new Date(
                              item.dateOfHunting * 1000
                            ).toLocaleString()}
                          </>
                        ) : (
                          "02/01/2022"
                        )}
                      </div>
                      <div className="w-full flex justify-center text-center">
                        {t("reward")}:{" "}
                        {item.tokenId.toString() < 12574 ? (
                          <>LOADING</>
                        ) : (
                          <>
                            {item.rewards > 0 ? (
                              <span className="ml-1 text-lg font-bold text-green-500">
                                {removeZeros(item.rewards)} CWOLF
                              </span>
                            ) : (
                              <span className="ml-1 text-lg font-bold text-red-500">
                                {removeZeros(item.rewards)} CWOLF
                              </span>
                            )}
                          </>
                        )}
                        <span className="ml-4">
                          {t("wolfpack")}: #{item.wolfPackId}
                        </span>
                      </div>
                      <div className="relative w-full grid grid-cols-2 items-center">
                        <div>
                          <div className="p-4 rounded-lg flex flex-col justify-center items-center">
                            <img
                              className={`${
                                item.rewards > 0
                                  ? "hunting-blur-win"
                                  : "hunting-blur-lose"
                              }`}
                              style={{
                                maxWidth: "none",
                                width: "150%",
                                height: "auto",
                              }}
                              src={
                                item.rewards > 0
                                  ? "https://cdn.cryptowolf.finance/images/hunting/LoboWin.png"
                                  : "https://cdn.cryptowolf.finance/images/hunting/LoboLose.png"
                              }
                              alt="Wolf"
                            />
                          </div>
                        </div>
                        <div
                          className="absolute top-1/2 left-1/2"
                          style={{
                            transform: "translate(-50%, -50%)",
                            fontSize: "1.25rem",
                            fontWeight: "bold",
                            color: "#cf3464",
                            zIndex: 1,
                          }}
                        >
                          VS
                        </div>
                        <div>
                          <img
                            className={`${
                              item.rewards <= 0
                                ? "hunting-blur-win"
                                : "hunting-blur-lose"
                            }`}
                            style={{
                              position: "relative",
                              left: "-25%",
                              maxWidth: "none",
                              width: "135%",
                              height: "auto",
                            }}
                            src={
                              item.rewards > 0
                                ? "https://cdn.cryptowolf.finance/images/hunting/" +
                                  animalsList[item.positionToAttack].replaceAll(
                                    " ",
                                    ""
                                  ) +
                                  "Lose.png"
                                : "https://cdn.cryptowolf.finance/images/hunting/" +
                                  animalsList[item.positionToAttack].replaceAll(
                                    " ",
                                    ""
                                  ) +
                                  "Win.png"
                            }
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    "The wolf pack is returning to its cave."
                  )}
                </div>
              );
            })}
          </div>
        </main>
        <CenteredFooter />
      </div>
    </div>
  );
}

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ["hunting"])),
  },
});

export default Home;
