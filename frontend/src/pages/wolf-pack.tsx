/* eslint-disable no-restricted-syntax */
import { useEffect, useState } from "react";

import { MultiCall } from "eth-multicall";
import { ethers } from "ethers";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import Modal from "react-modal";
import Web3 from "web3";

import WolfPackCreate from "../components/elements/WolfPackCreate";
import { useToast } from "../components/toast/ToastProvider";
import { useWeb3modal } from "../context/Web3modal";
import CWolfTokenJSON from "../contracts/CWolfToken.json";
import VariablesJSON from "../contracts/Variables.json";
import WolfPacksNFTJSON from "../contracts/WolfPacksNFT.json";
import Market from "../contracts/MarketPlace.json";
import CenteredFooter from "../footer/CenteredFooter";
import MainMenu from "../navigation/MainMenu";
import config from "../utils/AppConfig";
import moment from "moment";
import ClaimJSON from "../contracts/Claim.json";

const customStyles = {
  content: {
    width: "40%",
    height: "20%",
    margin: "auto",
  },
};

function WolfPack() {
  const [sellPrice, setSellPrice] = useState(1);
  const toast = useToast();
  const [priceBox, setPriceBox] = useState(10);
  const [wolfPacks, setWolfPacks] = useState([] as any);
  const [tokenPack, setTokenPack] = useState("");
  const [modalSellWolfpackIsOpen, setModalSellWolfpackIsOpen] = useState(false);
  const [modalBuyLinkIsOpen, setModalBuyLinkIsOpen] = useState(false);
  const [modalBuyEnergyIsOpen, setModalBuyEnergyIsOpen] = useState(false);
  const [amountOfDays, setAmountOfDays] = useState(1);
  const [linkPaymentMethod, setLinkPaymentMethod] = useState("wallet");
  const [amountCWOLF, setAmountCWOLF] = useState(1);
  const [amountEnergy, setAmountEnergy] = useState(1);
  const [energyPaymentMethod, setEnergyPaymentMethod] = useState("wallet");
  const [tokenSell, setTokenSell] = useState([] as any);
  const [tokenIdLink, setTokenIdLink] = useState("");
  const [numberWolves, setNumberWolves] = useState(0);
  const [tokenIdEnergy, setTokenIdEnergy] = useState("");
  const [minBuyEnergy, setMinBuyEnergy] = useState(0);
  const [stateCreatingWolfPack, setStateCreatingWolfPack] = useState(false);
  const [currentCreatingWolfPackStep, setCurrentCreatingWolfPackStep] =
    useState("0");
  const [maxCreatingWolfPackStep, setMaxCreatingWolfPackStep] = useState("1");
  const [modalCreatingIsOpen, setModalCreatingIsOpen] = useState(false);
  const [modalCreatingMessage, setModalCreatingMessage] = useState("");

  const { web3Provider, address, connect }: any = useWeb3modal();
  const { t } = useTranslation("wolfpack");

  const [isEditWolfPack, setIsEditWolfPack] = useState(false);
  const [editWolfPackItem, setEditWolfPackItem] = useState(null as any);

  const mintButton = async () => {
    setEditWolfPackItem(null);
    setIsEditWolfPack(false);
    setTokenPack("1");
  };

  const destroyWolfPackButton = async (_tokenId: string) => {
    if (web3Provider) {
      const signer = web3Provider.getSigner();
      const WolfPacksNFTInst = new ethers.Contract(
        WolfPacksNFTJSON.address,
        WolfPacksNFTJSON.abi,
        signer
      );
      await WolfPacksNFTInst.destroyWolfPack(_tokenId).then(
        (_result: any) => {
          toast?.pushInfo("Wolf pack successfully destroyed.", 8000);
          getWolfPacks();
        },
        (_error: any) => {
          toast?.pushError("Failed to destroy the wolf pack.", 8000);
        }
      );
    }
  };

  const editWolfPackButton = async (item: any) => {
    setIsEditWolfPack(true);
    setEditWolfPackItem(item);
    setTokenPack("1");
  };

  async function openModalSellWolfpack(item: any) {
    setTokenSell(item);
    setModalSellWolfpackIsOpen(true);
  }
  function afterOpenModalSellWolfpack() {}
  function closeModalSellWolfpack() {
    setModalSellWolfpackIsOpen(false);
  }

  async function openModalBuyLink(_tokenId: string, item: any) {
    setTokenIdLink(_tokenId);
    setNumberWolves(
      item.totalSlotsInWolfPack - item.totalSlotsAvailableInWolfPack
    );
    setModalBuyLinkIsOpen(true);
  }
  function afterOpenModalBuyLink() {}
  function closeModalBuyLink() {
    setModalBuyLinkIsOpen(false);
  }

  async function openModalBuyEnergy(_tokenId: string) {
    setTokenIdEnergy(_tokenId);
    setModalBuyEnergyIsOpen(true);
  }
  function afterOpenModalBuyEnergy() {}
  function closeModalBuyEnergy() {
    setModalBuyEnergyIsOpen(false);
  }

  function removeZeros(number: number) {
    let newNumber = ethers.utils.formatUnits(number, 18);

    return parseFloat(newNumber)
      .toFixed(2)
      .replace(/(\.0+|0+)$/, "");
  }

  const buyEnergyButton = async () => {
    if (web3Provider) {
      const signer = web3Provider.getSigner();
      const WolfPacksNFTInst = new ethers.Contract(
        WolfPacksNFTJSON.address,
        WolfPacksNFTJSON.abi,
        signer
      );
      const tokenInst = new ethers.Contract(
        CWolfTokenJSON.address,
        CWolfTokenJSON.abi,
        signer
      );
      const variablesInst = new ethers.Contract(
        VariablesJSON.address,
        VariablesJSON.abi,
        signer
      );
      const ClaimInst = new ethers.Contract(
        ClaimJSON.address,
        ClaimJSON.abi,
        signer
      );

      let energyCommission = await WolfPacksNFTInst.energyCommission();
      let [gas, balanceBNB, balanceCWOLF, userCWOLF] = await Promise.all([
        variablesInst.getDollarsInBNB(energyCommission),
        web3Provider.getBalance(address),
        tokenInst.balanceOf(address),
        ClaimInst.usersAmount(address),
      ]);

      userCWOLF = Number(removeZeros(userCWOLF));

      if (parseFloat((balanceBNB / 1e18).toFixed(6)) < 0.001) {
        toast?.pushError("Don't have enough BNB", 8000);
      }

      if (energyPaymentMethod === "wallet") {
        if (parseFloat((balanceCWOLF / 1e18).toFixed(6)) < amountCWOLF) {
          toast?.pushError("Don't have enough CWOLF", 8000);
        } else {
          closeModalBuyEnergy();

          const valueFinal = Math.round((110 * gas) / 100).toString();

          WolfPacksNFTInst.buyEnergy(
            tokenIdEnergy,
            (amountCWOLF * 1e18).toString(),
            {
              value: valueFinal,
            }
          ).then(
            (_result: any) => {
              toast?.pushInfo("Energy purchased with wallet balance", 8000);
              getWolfPacks();
            },
            (_error: any) => {
              toast?.pushError("Energy purchased was canceled", 8000);
            }
          );
        }
      } else {
        if (userCWOLF < amountCWOLF) {
          toast?.pushError("Don't have enough CWOLF", 8000);
        } else {
          closeModalBuyEnergy();

          const valueFinal = Math.round((110 * gas) / 100).toString();

          ClaimInst.buyEnergyWithClaim(
            tokenIdEnergy,
            (amountCWOLF * 1e18).toString(),
            {
              value: valueFinal,
            }
          ).then(
            (_result: any) => {
              toast?.pushInfo("Energy purchased with unclaimed balance", 8000);
              getWolfPacks();
            },
            (_error: any) => {
              toast?.pushError("Energy purchased was canceled", 8000);
            }
          );
        }
      }
    }
  };

  const buyWolfPackLinkButton = async () => {
    if (web3Provider) {
      const signer = web3Provider.getSigner();
      const WolfPacksNFTInst = new ethers.Contract(
        WolfPacksNFTJSON.address,
        WolfPacksNFTJSON.abi,
        signer
      );
      const tokenInst = new ethers.Contract(
        CWolfTokenJSON.address,
        CWolfTokenJSON.abi,
        signer
      );
      const variablesInst = new ethers.Contract(
        VariablesJSON.address,
        VariablesJSON.abi,
        signer
      );
      const ClaimInst = new ethers.Contract(
        ClaimJSON.address,
        ClaimJSON.abi,
        signer
      );

      let linkCommission = await WolfPacksNFTInst.linkCommission();
      let [gas, balanceBNB, balanceCWOLF, userCWOLF] = await Promise.all([
        variablesInst.getDollarsInBNB(linkCommission),
        web3Provider.getBalance(address),
        tokenInst.balanceOf(address),
        ClaimInst.usersAmount(address),
      ]);

      userCWOLF = Number(removeZeros(userCWOLF));

      if (parseFloat((balanceBNB / 1e18).toFixed(6)) < 0.001) {
        toast?.pushError("Don't have enough BNB", 8000);
      }

      if (linkPaymentMethod === "wallet") {
        if (
          parseFloat((balanceCWOLF / 1e18).toFixed(6)) <
          priceBox * numberWolves * amountOfDays * 2
        ) {
          toast?.pushError("Don't have enough CWOLF", 8000);
        } else {
          closeModalBuyLink();

          const valueFinal = Math.round((110 * gas) / 100).toString();

          WolfPacksNFTInst.buyWolfPackLink(tokenIdLink, amountOfDays, {
            value: valueFinal,
          }).then(
            (_result: any) => {
              toast?.pushInfo("Wolf bond purchased with wallet balance", 8000);
              getWolfPacks();
            },
            (_error: any) => {
              toast?.pushError("Minting was canceled", 8000);
            }
          );
        }
      } else {
        if (userCWOLF < priceBox * numberWolves * amountOfDays * 2) {
          toast?.pushError("Don't have enough CWOLF", 8000);
        } else {
          closeModalBuyLink();

          const valueFinal = Math.round((110 * gas) / 100).toString();

          ClaimInst.buyLinkWithClaim(tokenIdLink, amountOfDays, {
            value: valueFinal,
          }).then(
            (_result: any) => {
              toast?.pushInfo(
                "Wolf bond purchased with unclaimed balance",
                8000
              );
              getWolfPacks();
            },
            (_error: any) => {
              toast?.pushError("Wolf bond purchased was canceled", 8000);
            }
          );
        }
      }
    }
  };

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

  function creatingWolfPack(
    currentStep: string,
    maxStep: string,
    modalMessage: string = ""
  ) {
    setStateCreatingWolfPack(true);
    setCurrentCreatingWolfPackStep(currentStep);
    setMaxCreatingWolfPackStep(maxStep);
    setTokenPack("");

    if (modalMessage !== "") {
      setModalCreatingMessage(modalMessage);
      setModalCreatingIsOpen(true);
    }
  }

  const energyToCWOLF = async (usd: number) => {
    const signer = web3Provider.getSigner();
    const variablesInst = new ethers.Contract(
      VariablesJSON.address,
      VariablesJSON.abi,
      signer
    );

    let parI = parseInt("" + usd);

    if (isNaN(parI)) {
      return;
    }

    let energyInCWOLF = await variablesInst.getDollarsInCWOLF(
      parI + "000000000000000000"
    );
    energyInCWOLF = await ethers.utils.formatUnits(energyInCWOLF, 18);

    setAmountEnergy(parseInt("" + usd));
    setAmountCWOLF(energyInCWOLF);
  };

  function diffInDaysLink(timestamp: number) {
    let currentDate = moment.utc();
    let contractDate = moment.utc(timestamp * 1000);
    let diff = currentDate.diff(contractDate, "days");

    return diff;
  }

  function createdWolfPack() {
    setStateCreatingWolfPack(false);
    setCurrentCreatingWolfPackStep("0");
    setMaxCreatingWolfPackStep("1");
    setTokenPack("");
    setModalCreatingIsOpen(false);
    getWolfPacks();
  }

  function changeTokenPack(value: string) {
    setTokenPack(value);
  }

  const approveToken = async (tokenInst: any) => {
    tokenInst.methods
      .approve(WolfPacksNFTJSON.address, ethers.utils.parseEther("100000000"))
      .send({ from: address })
      .once("transactionHash", () => {
        toast?.pushInfo("Approving purchase of Wolf Pack with CWOLF", 8000);
      })
      .then((_tx: any) => {
        toast?.pushInfo(
          "You have approved the purchase of Wolf Pack with CWOLF",
          8000
        );
      })
      .catch((e: any) => {
        if (e.code === 4001) {
          toast?.pushError(
            "You need to approve the spending of CWOLF in your wallet",
            8000
          );
        }
      });
  };

  async function sellPack() {
    const item = tokenSell;
    console.log(item.tokenId?.toString());
    const web3 = new Web3(window.ethereum);
    const tokenInst = new web3.eth.Contract(
      WolfPacksNFTJSON.abi as [],
      WolfPacksNFTJSON.address as string
    );
    const allwaddress = await tokenInst.methods
      .getApproved(item.tokenId?.toString())
      .call();
    if (allwaddress !== Market.address) {
      await tokenInst.methods
        .approve(Market.address, item.tokenId?.toString())
        .send({ from: address })
        .once("transactionHash", () => {
          toast?.pushInfo("Approving purchase of Wolf Pack with CWOLF", 6000);
        })
        .then((_tx: any) => {
          toast?.pushInfo(
            "You have approved the purchase of Wolf Pack with CWOLF",
            6000
          );
          sellPack();
        })
        .catch((e: any) => {
          if (e.code === 4001) {
            toast?.pushError(
              "You need to approve the spending of CWOLF in your wallet",
              6000
            );
          }
        });
    } else {
      const MarketInst = new web3.eth.Contract(
        Market.abi as [],
        Market.address as string
      );
      const askingPrice = sellPrice * 10 ** 18;
      const id = await MarketInst.methods
        .addItemToMarket(
          WolfPacksNFTJSON.address,
          item.tokenId?.toString(),
          askingPrice.toString()
        )
        .send({ from: address })
        .once("transactionHash", function (hash: any) {
          closeModalSellWolfpack();
          // deleteEventWolfPack(item.tokenId); NO EXISTE
          // Send add wolfPack NFT requests
          const url = config.BACKEND_URL + "wolfpack/add";
          console.log("this is id====>", hash);
          const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pointsOfWolfPack: item.pointsOfWolfPack,
              tokenId: item.tokenId.toString(),
              totalSlotsAvailable_: item.totalSlotsAvailableInWolfPack,
              totalSlotsInWolfPack: item.totalSlotsInWolfPack,
              wolfPackEnergy: item.wolfPackEnergy,
              wolfPackInPromo: item.wolfPackInPromo,
              wolfPackLife: item.wolfPackLife,
              wolfPackLink: item.wolfPackLink,
              askingPrice,
              id: hash,
              // id: id.events.itemAdded.returnValues.id,
            }),
          };
          fetch(url, requestOptions)
            .then((response) => response.json())
            .catch((error) => {
              console.log(error);
              return false;
            });
        })
        .then((_tx: any) => {
          closeModalSellWolfpack();
        })
        .catch((e: any) => {
          if (e.code === 4001) {
            toast?.pushError(
              "You need to approve the spending of CWOLF in your wallet",
              6000
            );
          }
        });
    }
  }

  const getWolfPacks = async () => {
    const signer = web3Provider.getSigner();
    const WolfPacksNFTInst = new ethers.Contract(
      WolfPacksNFTJSON.address,
      WolfPacksNFTJSON.abi,
      signer
    );
    let arrayNFTs = await WolfPacksNFTInst.walletOfOwner(address);
    arrayNFTs = [...arrayNFTs].reverse();
    const itemsNFTs = [];

    const web3 = await new Web3(
      new Web3.providers.HttpProvider(config.RPC_URL!)
    );
    const contract = await new web3.eth.Contract(
      WolfPacksNFTJSON.abi as [],
      WolfPacksNFTJSON.address as string
    );
    const marketContract = await new web3.eth.Contract(
      Market.abi as [],
      Market.address as string
    );

    const calls = [];
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
        getInitialWolfPackLife: contract.methods.calculateInitialWolfPackLife(
          tokenId.toString()
        ),
      });
    }
    const multicall = new MultiCall(web3, config.MULTICALL);
    const results = await multicall.all([calls]);
    if (results[0]) {
      const callsItemsMarket = [];
      for (let index = 0; index < results[0]?.length; index += 1) {
        callsItemsMarket.push({
          sellerAddress: await marketContract.methods.getSellerAddress(
            WolfPacksNFTInst.address,
            arrayNFTs[index].toString()
          ),
        });
      }
      const resultsItemsMarket = await multicall.all([callsItemsMarket]);

      for (let index = 0; index < results[0]?.length; index += 1) {
        let inMarket = false;

        if (resultsItemsMarket[0]) {
          if (resultsItemsMarket[0][index].sellerAddress == address) {
            inMarket = true;
          }
        }

        if (inMarket == false) {
          itemsNFTs.push({
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
            initialWolfPackLife: results[0][index].getInitialWolfPackLife,
          });
        }
      }
      setWolfPacks(itemsNFTs);
    }
  };

  useEffect(() => {
    // Connect to the network
    if (web3Provider) {
      const getPriceBox = async () => {
        const web3 = new Web3(window.ethereum);
        const variablesInst = new web3.eth.Contract(
          VariablesJSON.abi as [],
          VariablesJSON.address as string
        );
        // sacar 0.25 $ en CWOLF
        const priceBoxCWOLF = await variablesInst.methods
          .getDollarsInCWOLF(1 * 1e6)
          .call();
        setMinBuyEnergy(priceBoxCWOLF / 1e6);
        setAmountCWOLF(priceBoxCWOLF / 1e6);
        setPriceBox(priceBoxCWOLF / 1e6 / 4);
      };

      const approveCWOLF = async () => {
        const web3 = new Web3(window.ethereum);
        const tokenInst = new web3.eth.Contract(
          CWolfTokenJSON.abi as [],
          CWolfTokenJSON.address as string
        );
        const allowanceBalance = await tokenInst.methods
          .allowance(address, WolfPacksNFTJSON.address)
          .call();
        if (Math.floor(allowanceBalance / 1e18) < 100) {
          approveToken(tokenInst);
        }
      };

      getPriceBox();
      approveCWOLF();
      getWolfPacks();
    }
  }, [web3Provider]);
  return (
    <div className="Home">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
        />
        <title>{t("wolf-pack")} | CryptoWolf</title>
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
        <main>
          <div>
            <div className="main-feast-section-wrapper">
              <div className="main-section p-4 md:p-16">
                <Modal
                  isOpen={modalCreatingIsOpen}
                  ariaHideApp={false}
                  contentLabel="Example Modal"
                >
                  <div className="modal-text">
                    <div className="text-center text-lg font-bold">
                      {modalCreatingMessage}
                    </div>
                  </div>
                </Modal>
                {tokenPack === "" ? (
                  <>
                    <div className="w-full flex justify-center">
                      <button
                        onClick={mintButton}
                        className="button button-regular w-full md:w-1/2 lg:w-1/3 flex justify-center items-center"
                        disabled={stateCreatingWolfPack}
                      >
                        {stateCreatingWolfPack === true ? (
                          <>
                            Creating wolf pack ... Step{" "}
                            {currentCreatingWolfPackStep}/
                            {maxCreatingWolfPackStep}
                          </>
                        ) : (
                          <>Create Wolf Pack</>
                        )}
                      </button>
                    </div>
                    <div className="mt-8 flex flex-wrap justify-center md:justify-around gap-4 lg:gap-8">
                      {wolfPacks.length > 0 &&
                        wolfPacks.map((item: any, index: any) => (
                          <>
                            {item.totalSlotsInWolfPack > 0 ? (
                              <div key={index}>
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
                                  <div
                                    className="wolfPack-buttons w-full gap-1 absolute flex flex-wrap justify-center z-10"
                                    style={{
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                    }}
                                  >
                                    {/* <button
                                      onClick={() =>
                                        openModalSellWolfpack(item)
                                      }
                                      className="button button-regular"
                                    >
                                      Sell Wolf Pack
                                    </button> */}
                                    <Modal
                                      isOpen={modalSellWolfpackIsOpen}
                                      onAfterOpen={afterOpenModalSellWolfpack}
                                      onRequestClose={closeModalSellWolfpack}
                                      ariaHideApp={false}
                                      contentLabel="Example Modal"
                                    >
                                      <div className="modal-text">
                                        <div className="w-full flex flex-col justify-center items-center">
                                          <div className="w-full text-center">
                                            <h1 className="text-2xl text-center">
                                              Sell NFT #
                                              {tokenSell.tokenId != undefined
                                                ? tokenSell.tokenId.toString()
                                                : null}
                                            </h1>
                                          </div>
                                          <div className="w-full mt-4">
                                            <label>
                                              How many CWOLF do you want to sell
                                              this NFT for?
                                            </label>
                                            <input
                                              type="number"
                                              min="0"
                                              onChange={(ev: any) => {
                                                setSellPrice(ev.target.value);
                                              }}
                                              className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                              value={sellPrice}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="modal-button-container">
                                        <button
                                          className="modal-cancel"
                                          onClick={closeModalSellWolfpack}
                                        >
                                          cancel
                                        </button>
                                        <button
                                          onClick={() => sellPack()}
                                          className="button button-primary"
                                        >
                                          SELL NFT
                                        </button>
                                      </div>
                                    </Modal>
                                    <button
                                      key={`destroy-${index}`}
                                      onClick={() =>
                                        destroyWolfPackButton(item.tokenId)
                                      }
                                      className="button button-regular"
                                    >
                                      Destroy Wolf Pack
                                    </button>
                                    <button
                                      key={`link-${index}`}
                                      onClick={() =>
                                        openModalBuyLink(item.tokenId, item)
                                      }
                                      className="button button-regular"
                                    >
                                      Buy Wolf Bond
                                    </button>
                                    <Modal
                                      isOpen={modalBuyLinkIsOpen}
                                      onAfterOpen={afterOpenModalBuyLink}
                                      onRequestClose={closeModalBuyLink}
                                      ariaHideApp={false}
                                      contentLabel="Example Modal"
                                    >
                                      <div className="modal-text">
                                        <div className="w-full flex flex-col justify-center items-center">
                                          <div className="w-full flex justify-center text-center font-bold text-xl">
                                            Buy Wolf Bond
                                          </div>
                                          <div className="mt-8 w-full flex flex-col justify-center">
                                            <label>
                                              How many days of wolf bond do you
                                              want to buy?
                                            </label>
                                            <select
                                              className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                              onChange={(event) =>
                                                setAmountOfDays(
                                                  parseInt(
                                                    event.target.value,
                                                    10
                                                  )
                                                )
                                              }
                                              value={amountOfDays}
                                            >
                                              <option value="1">1</option>
                                              <option value="3">3</option>
                                              <option value="7">7</option>
                                              <option value="14">14</option>
                                              <option value="30">30</option>
                                            </select>
                                          </div>
                                          <div className="w-full mt-2 flex text-lg">
                                            Price{" "}
                                            <span className="mx-1 text-xl text-green-500 font-bold">
                                              {(
                                                priceBox *
                                                numberWolves *
                                                amountOfDays *
                                                2
                                              ).toFixed(2)}
                                            </span>{" "}
                                            CWOLF
                                          </div>
                                          <div className="w-full mt-3 flex flex-col justify-center">
                                            <label>Payment method</label>
                                            <select
                                              className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                              onChange={(event) =>
                                                setLinkPaymentMethod(
                                                  event.target.value
                                                )
                                              }
                                              value={linkPaymentMethod}
                                            >
                                              <option value="wallet">
                                                Wallet
                                              </option>
                                              <option value="unclaimed">
                                                Unclaimed balance
                                              </option>
                                            </select>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="modal-button-container">
                                        <button
                                          className="modal-cancel"
                                          onClick={closeModalBuyLink}
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          className="modal-burn"
                                          onClick={() => {
                                            buyWolfPackLinkButton();
                                          }}
                                        >
                                          Buy Link
                                        </button>
                                      </div>
                                    </Modal>
                                    <button
                                      key={`energy-${index}`}
                                      onClick={() =>
                                        openModalBuyEnergy(item.tokenId)
                                      }
                                      className="button button-regular"
                                    >
                                      Buy Energy
                                    </button>
                                    <Modal
                                      isOpen={modalBuyEnergyIsOpen}
                                      onAfterOpen={afterOpenModalBuyEnergy}
                                      onRequestClose={closeModalBuyEnergy}
                                      ariaHideApp={false}
                                      contentLabel="Example Modal"
                                    >
                                      <div className="modal-text">
                                        <div className="w-full flex flex-col justify-center items-center">
                                          <div className="w-full flex justify-center text-center font-bold text-xl">
                                            Buy Energy
                                          </div>
                                          <div className="mt-8 w-full flex flex-col justify-center">
                                            <label>
                                              How much energy you want to buy?
                                            </label>
                                            <input
                                              type="number"
                                              min="0"
                                              onChange={(ev: any) => {
                                                setAmountEnergy(
                                                  ev.target.value
                                                );
                                                energyToCWOLF(ev.target.value);
                                              }}
                                              className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                              value={amountEnergy}
                                            />
                                          </div>
                                          <div className="w-full mt-2 flex text-lg">
                                            Price{" "}
                                            <span className="mx-1 text-xl text-green-500 font-bold">
                                              {Number(amountCWOLF).toFixed(2)}
                                            </span>{" "}
                                            CWOLF
                                          </div>
                                          <div className="w-full mt-3 flex flex-col justify-center">
                                            <label>Payment method</label>
                                            <select
                                              className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                              onChange={(event) =>
                                                setEnergyPaymentMethod(
                                                  event.target.value
                                                )
                                              }
                                              value={energyPaymentMethod}
                                            >
                                              <option value="wallet">
                                                Wallet
                                              </option>
                                              <option value="unclaimed">
                                                Unclaimed balance
                                              </option>
                                            </select>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="modal-button-container">
                                        <button
                                          className="modal-cancel"
                                          onClick={closeModalBuyEnergy}
                                        >
                                          Cancel
                                        </button>
                                        {Number(amountCWOLF) > 0 ? (
                                          <button
                                            className="button button-primary"
                                            onClick={() => {
                                              buyEnergyButton();
                                            }}
                                          >
                                            Buy Energy
                                          </button>
                                        ) : (
                                          <button
                                            className="button button-primary"
                                            disabled={true}
                                          >
                                            Buy Energy
                                          </button>
                                        )}
                                      </div>
                                    </Modal>
                                    {(item.totalMaterialsInWolfPack < 20 ||
                                      (item.totalMaterialsInWolfPack >= 20 &&
                                        item.totalSlotsAvailableInWolfPack >
                                          1)) &&
                                    item.wolfPackLife >=
                                      item.initialWolfPackLife &&
                                    item.wolfPackLinkDays == "0d" ? (
                                      <button
                                        key={`edit-${index}`}
                                        onClick={() => editWolfPackButton(item)}
                                        className="button button-regular"
                                      >
                                        Edit Wolf Pack
                                      </button>
                                    ) : null}
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
                                      <span>
                                        {item.wolfPackLinkRemainingDays}
                                      </span>
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
                                      <span>
                                        {(item.wolfPackEnergy / 1e18).toFixed(
                                          2
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 text-center">
                                      <svg
                                        viewBox="0 0 5480 4900"
                                        className="h-6"
                                      >
                                        <g fill="#FFFFFF">
                                          <path d="M2570 4729 c-678 -358 -1286 -879 -1695 -1451 -272 -382 -477 -829 -570 -1243 -47 -209 -58 -327 -52 -555 7 -288 41 -445 141 -655 120 -251 298 -436 528 -548 133 -65 234 -88 403 -94 164 -6 264 9 413 62 374 134 721 506 933 998 l33 79 15 -34 c274 -629 665 -1005 1137 -1094 67 -12 123 -15 229 -11 169 6 270 29 403 94 332 161 557 476 644 903 28 135 36 463 15 620 -77 582 -362 1192 -811 1737 -193 233 -536 554 -812 759 -279 208 -756 494 -821 494 -10 0 -70 -28 -133 -61z" />
                                        </g>
                                      </svg>
                                      <span>
                                        {item.wolfPackLife}/
                                        {item.initialWolfPackLife}
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
                              </div>
                            ) : (
                              <></>
                            )}
                          </>
                        ))}
                      {wolfPacks.length <= 0 ? (
                        <>
                          <div
                            style={{ background: "#061231", padding: "1.5rem" }}
                            className="rounded-lg"
                          >
                            <h2 className="text-3xl">NO WOLF PACK CREATED</h2>
                          </div>
                        </>
                      ) : (
                        <></>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full flex justify-center">
                      <button
                        onClick={() => {
                          setTokenPack("");
                          setEditWolfPackItem(null);
                          setIsEditWolfPack(false);
                        }}
                        className="button button-regular w-full md:w-1/2 lg:w-1/3 flex justify-center items-center"
                      >
                        Back to the list
                      </button>
                    </div>
                    <WolfPackCreate
                      priceBox={priceBox}
                      tokenPack={tokenPack}
                      toast={toast}
                      creatingWolfPack={creatingWolfPack}
                      createdWolfPack={createdWolfPack}
                      isEditWolfPack={isEditWolfPack}
                      editWolfPackItem={editWolfPackItem}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
        <CenteredFooter />
      </div>
    </div>
  );
}

export const getStaticProps = async ({ locale }: any) => ({
  props: {
    ...(await serverSideTranslations(locale, ["wolfpack", "common", "footer"])),
  },
});

export default WolfPack;
