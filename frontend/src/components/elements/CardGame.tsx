/* eslint-disable @typescript-eslint/return-await */
import React, { useEffect, useRef, useState } from "react";

import clsx from "clsx";
import { ethers } from "ethers";
import Modal from "react-modal";
import Web3 from "web3";

import { usePlayPause } from "../../context/PlayPauseAnimation";
import { useWeb3modal } from "../../context/Web3modal";
import CWolfTokenJSON from "../../contracts/CWolfToken.json";
import Market from "../../contracts/MarketPlace.json";
import MaterialsNFTJSON from "../../contracts/MaterialsNFT.json";
import VariablesJSON from "../../contracts/Variables.json";
import WolfsNFTJSON from "../../contracts/WolfsNFT.json";
import config from "../../utils/AppConfig";

type ICardGameProps = {
  ref?: any;
  tokenId?: string;
  askingPrice?: any;
  askingPriceInCWOLF?: any;
  id?: any;
  gender?: string;
  breed?: string;
  level?: string;
  attack: number | 0;
  defense: number | 0;
  size?: string;
  type?: string;
  nothover?: string;
  notburn?: string;
  notproperties?: string;
  toast?: any;
  isPack?: any;
  isMarketplace?: any;
  web3Provider?: any;
  burnItems?: any;
  setBurnItems?: any;
  deleteEvent?: any;
  isWolfPackCreate?: boolean;
  isWolfPackCreate2?: boolean;
  sellerAddress?: any;
};

const CardGame = (props: ICardGameProps) => {
  const [sellPrice, setSellPrice] = useState(1);
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [modalIsOpenSell, setIsOpenSell] = React.useState(false);
  const [burnedCwolf, setBurnedCwolf] = React.useState(false);
  const { play }: any = usePlayPause();
  const divCard = useRef<HTMLDivElement>(null);
  const [cardTransform, setCardTransform] = useState("initial");
  const { address, web3Provider }: any = useWeb3modal();
  const [modalIsOpenStep, setModalIsOpenStep] = useState(false);
  const [modalIsOpenStepBuy, setModalIsOpenStepBuy] = useState(false);
  const [modalIsOpenRemove, setModalIsOpenRemove] = useState(false);
  const [modalIsOpenEditPrice, setModalIsOpenEditPrice] = useState(false);

  async function sellWolf() {
    const web3 = new Web3(window.ethereum);
    const tokenInst = new web3.eth.Contract(
      WolfsNFTJSON.abi as [],
      WolfsNFTJSON.address as string
    );

    setIsOpenSell(false);
    setModalIsOpenStep(true);

    const allowaddress = await tokenInst.methods
      .isApprovedForAll(address, Market.address)
      .call();
    if (allowaddress == false) {
      await tokenInst.methods
        .setApprovalForAll(Market.address, true)
        .send({ from: address })
        .once("transactionHash", () => {
          props.toast?.pushInfo(
            "Approving purchase of Wolves with CWOLF",
            6000
          );
        })
        .then((_tx: any) => {
          props.toast?.pushInfo(
            "You have approved the purchase of Wolves with CWOLF",
            6000
          );
          sellWolf();
        })
        .catch((e: any) => {
          if (e.code === 4001) {
            props.toast?.pushError(
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
      const id = await MarketInst.methods
        .addItemToMarket(
          WolfsNFTJSON.address,
          props.tokenId?.toString(),
          (sellPrice * 1e18).toString()
        )
        .send({ from: address })
        .once("transactionHash", function (hash: any) {
          setModalIsOpenStep(false);
          props.deleteEvent(props.tokenId);
        })
        .then((_tx: any) => {
          setModalIsOpenStep(false);
        })
        .catch((e: any) => {
          setModalIsOpenStep(false);
          if (e.code === 4001) {
            props.toast?.pushError(
              "You need to approve the spending of CWOLF in your wallet",
              6000
            );
          }
        });
    }
  }

  async function editPrice() {
    const web3 = new Web3(window.ethereum);
    const tokenInst = new web3.eth.Contract(
      MaterialsNFTJSON.abi as [],
      MaterialsNFTJSON.address as string
    );

    setModalIsOpenEditPrice(false);
    const MarketInst = new web3.eth.Contract(
      Market.abi as [],
      Market.address as string
    );
    const id = await MarketInst.methods
      .changePrice(props.id?.toString(), (sellPrice * 1e18).toString())
      .send({ from: address })
      .then((_tx: any) => {
        props.toast?.pushInfo("The NFT price has been edited correctly.", 6000);
      })
      .catch((e: any) => {
        if (e.code === 4001) {
          props.toast?.pushError("Error editing the NFT price.", 6000);
        }
      });
  }

  async function editPriceWolf() {
    const web3 = new Web3(window.ethereum);
    const tokenInst = new web3.eth.Contract(
      WolfsNFTJSON.abi as [],
      WolfsNFTJSON.address as string
    );

    setModalIsOpenEditPrice(false);
    const MarketInst = new web3.eth.Contract(
      Market.abi as [],
      Market.address as string
    );
    const id = await MarketInst.methods
      .changePrice(props.id?.toString(), (sellPrice * 1e18).toString())
      .send({ from: address })
      .then((_tx: any) => {
        props.toast?.pushInfo("The NFT price has been edited correctly.", 6000);
      })
      .catch((e: any) => {
        if (e.code === 4001) {
          props.toast?.pushError("Error editing the NFT price.", 6000);
        }
      });
  }

  async function sellMaterial() {
    const web3 = new Web3(window.ethereum);
    const tokenInst = new web3.eth.Contract(
      MaterialsNFTJSON.abi as [],
      MaterialsNFTJSON.address as string
    );

    setIsOpenSell(false);
    setModalIsOpenStep(true);
    const allowaddress = await tokenInst.methods
      .isApprovedForAll(address, Market.address)
      .call();
    if (allowaddress == false) {
      await tokenInst.methods
        .setApprovalForAll(Market.address, true)
        .send({ from: address })
        .once("transactionHash", () => {
          props.toast?.pushInfo(
            "Approving purchase of Materials with CWOLF",
            6000
          );
        })
        .then((_tx: any) => {
          props.toast?.pushInfo(
            "You have approved the purchase of Materials with CWOLF",
            6000
          );
          sellMaterial();
        })
        .catch((e: any) => {
          if (e.code === 4001) {
            props.toast?.pushError(
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
      const id = await MarketInst.methods
        .addItemToMarket(
          MaterialsNFTJSON.address,
          props.tokenId?.toString(),
          (sellPrice * 1e18).toString()
        )
        .send({ from: address })
        .once("transactionHash", function (hash: any) {
          setModalIsOpenStep(false);
          props.deleteEvent(props.tokenId);
        })
        .then((_tx: any) => {
          setModalIsOpenStep(false);
        })
        .catch((e: any) => {
          setModalIsOpenStep(false);
          if (e.code === 4001) {
            props.toast?.pushError(
              "You need to approve the spending of CWOLF in your wallet",
              6000
            );
          }
        });
    }
  }

  async function buyNFT() {
    const web3 = new Web3(window.ethereum);

    const signer = web3Provider.getSigner();
    const tokenInst = new ethers.Contract(
      CWolfTokenJSON.address,
      CWolfTokenJSON.abi,
      signer
    );
    const MarketInst = new web3.eth.Contract(
      Market.abi as [],
      Market.address as string
    );

    const [comission, balanceBNB, balanceCWOLF] = await Promise.all([
      MarketInst.methods.calculateCommission(props.id).call(),
      web3Provider.getBalance(address),
      tokenInst.balanceOf(address),
    ]);

    const variablesInst = new web3.eth.Contract(
      VariablesJSON.abi as [],
      VariablesJSON.address as string
    );
    const priceBoxCWOLF = await variablesInst.methods
      .getDollarsInCWOLF(props.askingPrice.toString())
      .call();

    if (parseInt(balanceBNB, 10) < 0.001) {
      props.toast?.pushError("Don't have enough BNB", 8000);
    } else if (parseInt(balanceCWOLF, 10) < priceBoxCWOLF) {
      props.toast?.pushError("Don't have enough CWOLF", 8000);
    } else {
      setModalIsOpenStepBuy(true);
      const id = await MarketInst.methods
        .buyItem(props.id)
        .send({ value: comission, from: address })
        .once("transactionHash", function (hash: any) {
          setModalIsOpenStepBuy(false);
        })
        .then((_tx: any) => {
          setModalIsOpenStepBuy(false);
        })
        .catch((e: any) => {
          setModalIsOpenStepBuy(false);
          if (e.code === 4001) {
            props.toast?.pushError(
              "You need to approve the spending of CWOLF in your wallet",
              6000
            );
          }
        });
    }
  }

  async function getBurnQuantity() {
    const signer = props.web3Provider.getSigner();
    const variablesJsonInst = new ethers.Contract(
      VariablesJSON.address,
      VariablesJSON.abi,
      signer
    );
    return await variablesJsonInst.getDollarsInCWOLF((2 * 1e18).toString());
  }

  function setBurnSelected(tokenId: string) {
    if (props.burnItems.length >= 80) return false;
    if (props.burnItems.includes(tokenId)) {
      props.setBurnItems(props.burnItems.filter((e: string) => e !== tokenId));
    } else {
      props.burnItems.push(tokenId);
      props.setBurnItems(props.burnItems.filter((e: string) => e !== "0"));
    }
  }

  async function openModalSell() {
    setIsOpenSell(true);
  }

  function afterOpenModalSell() {
    // references are now sync'd and can be accessed.
  }

  function closeModalSell() {
    setIsOpenSell(false);
  }

  async function openModal() {
    let burnQuantity = await getBurnQuantity();
    burnQuantity /= 1e18;
    setBurnedCwolf(burnQuantity);
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  function closeModalRemove() {
    setModalIsOpenRemove(false);
  }
  function closeModalEditPrice() {
    setModalIsOpenEditPrice(false);
  }
  function closeModal() {
    setIsOpen(false);
  }
  function closeModalStep() {
    setModalIsOpenStep(false);
  }
  async function burnMaterial(_tokenId: string) {
    const signer = props.web3Provider.getSigner();
    const materialsNFTInst = new ethers.Contract(
      MaterialsNFTJSON.address,
      MaterialsNFTJSON.abi,
      signer
    );
    props.setBurnItems([]);
    materialsNFTInst.burnMaterial(_tokenId.toString()).then(
      (_result: any) => {
        closeModal();

        let burnMaterials = [];
        if (localStorage.burnMaterials != null) {
          burnMaterials = JSON.parse(localStorage.burnMaterials);
        }
        burnMaterials.push(_tokenId);
        localStorage.burnMaterials = JSON.stringify(burnMaterials);

        props.deleteEvent(_tokenId);

        props.toast?.pushInfo("Burning NFT", 8000);
      },
      (_error: any) => {
        props.toast?.pushError("Burning NFT was canceled", 8000);
      }
    );
  }
  async function removeNFTMarket() {
    const web3 = new Web3(window.ethereum);
    const MarketInst = new web3.eth.Contract(
      Market.abi as [],
      Market.address as string
    );
    await MarketInst.methods
      .removeItem(props?.id)
      .send({ from: address })
      .then(
        (_result: any) => {
          closeModalRemove();
          props.toast?.pushInfo(
            "The NFT has been successfully removed from the marketplace.",
            8000
          );
          setTimeout(() => window.location.reload(), 1000);
        },
        (_error: any) => {
          props.toast?.pushError(
            "Error deleting the NFT from the marketplace",
            8000
          );
        }
      );
  }
  async function burnWolf(_tokenId: string) {
    const signer = props.web3Provider.getSigner();
    const wolvesNFTInst = new ethers.Contract(
      WolfsNFTJSON.address,
      WolfsNFTJSON.abi,
      signer
    );
    props.setBurnItems([]);
    wolvesNFTInst.burnWolf(_tokenId.toString()).then(
      (_result: any) => {
        closeModal();

        let burnWolfs = [];
        if (localStorage.burnWolfs != null) {
          burnWolfs = JSON.parse(localStorage.burnWolfs);
        }
        burnWolfs.push(_tokenId);
        localStorage.burnWolfs = JSON.stringify(burnWolfs);

        props.deleteEvent(_tokenId);

        props.toast?.pushInfo("Burning NFT", 8000);
      },
      (_error: any) => {
        props.toast?.pushError("Burning NFT was canceled", 8000);
      }
    );
  }
  const changeSellPrice = (ev: any) => {
    setSellPrice(ev.target.value);
  };

  function handleMouseMove(ev: any) {
    if (props.nothover !== "nothover") {
      const { x, width }: any = divCard.current?.getBoundingClientRect();
      const cx = x + width / 2;
      const dx = (cx - ev.pageX) / (width / 2);
      setCardTransform(`rotateY(${10 * dx * -1}deg)`);
    }
  }
  function handleMouseOut() {
    setCardTransform("initial");
  }

  useEffect(() => {
    setSellPrice(parseInt("" + Number(props.askingPrice / 1e18)));
  }, [web3Provider]);
  return (
    <div
      className={`cardgame-perspective ${
        !props.isWolfPackCreate ? "m-4" : "cardgame-perspective-iswolfpack"
      } ${props.size}`}
      ref={props.ref}
    >
      <Modal
        isOpen={modalIsOpenStepBuy}
        ariaHideApp={false}
        contentLabel="Example Modal"
      >
        <div className="modal-text">
          <div className="w-full flex flex-col justify-center items-center">
            <div className="w-full text-center font-bold text-2xl">
              Buying the NFT...
            </div>
            <div className="w-full mt-4 text-center">
              You will have to accept 1 transactions.
              <ul className="text-sm">
                <li>- A transaction to confirm the buy.</li>
              </ul>
            </div>
            <div className="w-full mt-2 text-center text-xs text-red-500">
              The process may take some time. Do not close the tab.
            </div>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={modalIsOpenStep}
        ariaHideApp={false}
        contentLabel="Example Modal"
      >
        <div className="modal-text">
          <div className="w-full flex flex-col justify-center items-center">
            <div className="w-full text-center font-bold text-2xl">
              Selling the NFT...
            </div>
            <div className="w-full mt-4 text-center">
              The first time you will need to accept 2 transactions.
              <ul className="text-sm">
                <li>- One transaction to confirm the movement of the NFT's.</li>
                <li>- A transaction to confirm the sale.</li>
              </ul>
            </div>
            <div className="w-full mt-2 text-center text-xs text-red-500">
              The process may take some time. Do not close the tab.
            </div>
          </div>
        </div>
      </Modal>
      <div
        ref={divCard}
        className={`cardgame ${
          props.isWolfPackCreate ? "cardgame-iswolfpack m-0" : ""
        } ${props.level} ${props.type} ${props.nothover} ${props.notburn} ${
          props.type !== "material" && !props.isWolfPackCreate ? "m-4" : ""
        }`}
        onMouseMove={(ev) => handleMouseMove(ev)}
        onMouseOut={() => handleMouseOut()}
        style={{
          transform: cardTransform,
        }}
      >
        {props.type === "material" ? (
          <>
            {props.isWolfPackCreate !== undefined &&
            props.isWolfPackCreate === true ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    right: "3.5rem",
                    top: "2.25rem",
                    background: "rgb(6, 18, 49)",
                    padding: "0.25rem",
                    fontSize: "10px",
                    fontWeight: "normal",
                    zIndex: "1",
                  }}
                  className="rounded-lg"
                >
                  #{props.tokenId?.toString()}
                </div>
              </>
            ) : (
              <div
                style={{
                  position: "absolute",
                  right: "0.25rem",
                  top: "4.5rem",
                  background: "#061231",
                  padding: "0.5rem",
                  fontSize: "10px",
                  fontWeight: "normal",
                }}
                className="rounded-lg"
              >
                #{props.tokenId?.toString()}
              </div>
            )}
            <span
              className={`${props.level} ${
                props.isWolfPackCreate ? "spanWolfPack w-full h-full" : ""
              }`}
            />
            {props.notburn === "notburn" ? (
              <>
                {props.isMarketplace == "yes" &&
                props.sellerAddress == address ? (
                  <>
                    <div
                      className={clsx(
                        "burn-container burn-container-cave flex flex-wrap justify-center items-center"
                      )}
                      style={{
                        height: "max-content",
                        gap: "0.5rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                      }}
                    >
                      <button
                        className="button button-regular button-market"
                        onClick={() => setModalIsOpenRemove(true)}
                        style={{ width: "80%" }}
                      >
                        Remove NFT
                      </button>
                      <Modal
                        isOpen={modalIsOpenRemove}
                        onRequestClose={closeModalRemove}
                        contentLabel="Example Modal"
                      >
                        <div className="modal-text">
                          Do you want to remove this NFT from the marketplace?
                        </div>
                        <div className="modal-button-container">
                          <button
                            className="modal-cancel"
                            onClick={closeModalRemove}
                          >
                            cancel
                          </button>
                          <button
                            className="button button-primary"
                            onClick={() => {
                              removeNFTMarket();
                            }}
                          >
                            Remove NFT
                          </button>
                        </div>
                      </Modal>
                      <button
                        className="button button-regular button-market"
                        onClick={() => setModalIsOpenEditPrice(true)}
                        style={{ width: "80%" }}
                      >
                        Edit Price
                      </button>
                    </div>
                    <Modal
                      isOpen={modalIsOpenEditPrice}
                      onRequestClose={closeModalEditPrice}
                      contentLabel="Example Modal"
                    >
                      <div className="modal-text">
                        <div className="w-full felx flex-col text-center justify-center items-center">
                          <div className="w-full text-lg font-bold">
                            Edit Price NFT
                          </div>
                          <div className="w-full mt-4">
                            <label>
                              How many BUSD in CWOLF do you want to sell this
                              NFT for?
                            </label>
                            <input
                              type="number"
                              min="0"
                              pattern="[0-9]*"
                              onChange={(ev: any) => {
                                changeSellPrice(ev);
                              }}
                              className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                              value={sellPrice}
                            />
                          </div>
                          <div className="w-full mt-2 text-center text-sm text-red-500">
                            Place the price in USD, you will receive in CWOLF
                            the corresponding amount of those dollars.
                          </div>
                        </div>
                      </div>
                      <div className="modal-button-container">
                        <button
                          className="modal-cancel"
                          onClick={closeModalEditPrice}
                        >
                          cancel
                        </button>
                        <button
                          className="button button-primary"
                          onClick={() => {
                            editPrice();
                          }}
                        >
                          Edit Price
                        </button>
                      </div>
                    </Modal>
                  </>
                ) : null}
              </>
            ) : (
              <div
                className={clsx(
                  "burn-container burn-container-cave flex justify-center items-center",
                  props.burnItems.includes(props.tokenId?.toString()) &&
                    "burn-container-selected"
                )}
              >
                {props.isMarketplace !== "yes" && props.isPack !== "yes" && (
                  <button
                    id="sell"
                    className="button button-regular"
                    onClick={openModalSell}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="40px"
                      id="Layer_1"
                      version="1.1"
                      viewBox="0 0 512 512"
                      width="40px"
                    >
                      <path
                        fill="#FFFFFF"
                        d="M232.627,268.19c-2.212,1.761-3.93,3.961-5.198,6.585c-1.248,2.602-1.889,5.671-1.889,9.217  c0,5.555,1.776,9.849,5.309,12.896c3.535,3.02,9.354,5.48,17.441,7.324v-41.201c-2.87,0-5.668,0.42-8.352,1.265  C237.256,265.121,234.798,266.416,232.627,268.19 M284.307,353.365c-4.14-3.277-11.15-6.264-21.091-8.954v48.507  c3.024-0.316,6.198-1.041,9.45-2.135c3.307-1.1,6.234-2.647,8.882-4.682c2.587-2.006,4.722-4.505,6.427-7.446  c1.679-2.953,2.527-6.45,2.527-10.49C290.502,361.599,288.423,356.655,284.307,353.365 M335.211,161.639l0.036,0.031  c-0.113-0.125-0.189-0.246-0.303-0.369c-4.839-6.736-9.676-13.212-14.397-19.37c-6.236-10.43-9.523-23.12-1.892-41.427v-0.012  l26.324-62.988l-41.325-18.834L307.884,0H204.072l5.442,23.789l-42.511,13.716l26.304,62.988v0.012  c13.018,31.139-5.615,46.01-16.556,61.166C122.598,236.552,61.98,343.759,61.98,408.389c0,107.167,83.237,103.598,194.02,103.598  c110.768,0,194.021,3.569,194.021-103.598C450.021,343.747,389.346,236.541,335.211,161.639 M229.926,109.053h52.982v33.434h-52.982  V109.053z M323.61,383.695"
                      />
                    </svg>
                  </button>
                )}
                <button
                  id="burn"
                  className="button button-regular"
                  onClick={openModal}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    id="Layer_1"
                    x="0px"
                    y="0px"
                    viewBox="0 0 388.219 388.219"
                  >
                    <path
                      d="M160.109,182.619c0.8,6.8-6,11.6-12,8c-22-12.8-32.8-36.4-47.2-56.8c-23.2,36.8-40.8,72.4-40.8,110.4  c0,77.2,54.8,136,132,136s136-58.8,136-136c0-96.8-101.2-113.6-100-236C187.309,37.019,148.909,101.419,160.109,182.619z"
                      style={{ fill: "white" }}
                    ></path>
                    <path
                      d="M192.109,388.219c-81.2,0-140-60.4-140-144c0-42,20.4-80,42-114.8c1.6-2.4,4-3.6,6.4-3.6  c2.8,0,5.2,1.2,6.8,3.2c3.6,4.8,6.8,10,10,15.2c10,15.6,19.6,30.4,34.8,39.2l0,0c-11.6-82.8,27.6-151.2,71.2-182  c2.4-1.6,5.6-2,8.4-0.4c2.8,1.2,4.4,4,4.4,7.2c-0.8,62,26.4,96,52.4,128.4c23.6,29.2,47.6,59.2,47.6,107.6  C336.109,326.219,274.109,388.219,192.109,388.219z M101.309,148.619c-18,29.6-33.2,61.6-33.2,95.6c0,74,52,128,124,128  c72.8,0,128-55.2,128-128c0-42.8-20.4-68-44-97.6c-24.4-30.4-51.6-64.4-55.6-122c-34.4,31.2-62,88.4-52.4,156.8l0,0  c0.8,6.4-2,12.4-7.2,15.6c-5.2,3.2-11.6,3.2-16.8,0c-18.4-10.8-29.2-28-40-44.4C102.909,151.419,102.109,150.219,101.309,148.619z"
                      style={{ fill: "white" }}
                    ></path>
                    <path
                      d="M278.109,304.219c14-21.6,22-47.6,22-76"
                      style={{ fill: "white" }}
                    ></path>
                    <path
                      d="M278.109,312.219c-1.6,0-3.2-0.4-4.4-1.2c-3.6-2.4-4.8-7.2-2.4-11.2c13.6-20.8,20.8-45.6,20.8-71.6  c0-4.4,3.6-8,8-8s8,3.6,8,8c0,29.2-8,56.8-23.2,80.4C283.309,311.019,280.909,312.219,278.109,312.219z"
                      style={{ fill: "white" }}
                    ></path>
                    <path
                      d="M253.709,332.219c2.8-2.4,6-5.2,8.4-8"
                      style={{ fill: "white" }}
                    ></path>
                    <path
                      d="M253.709,340.219c-2.4,0-4.4-0.8-6-2.8c-2.8-3.2-2.4-8.4,0.8-11.2c2.4-2.4,5.6-4.8,7.6-7.2  c2.8-3.2,8-3.6,11.2-0.8c3.2,2.8,3.6,8,0.8,11.2c-2.8,3.2-6.4,6.4-9.2,8.8C257.309,339.419,255.709,340.219,253.709,340.219z"
                      style={{ fill: "white" }}
                    ></path>
                  </svg>
                </button>
                <button id="burnSelect" className="button button-regular">
                  {props.burnItems.includes(props.tokenId?.toString()) ? (
                    <input
                      type="checkbox"
                      className="form-checkbox h-8 w-8"
                      checked
                      onClick={(_e) => {
                        if (props.tokenId != undefined) {
                          setBurnSelected(props.tokenId?.toString());
                        }
                      }}
                    />
                  ) : (
                    <input
                      type="checkbox"
                      className="form-checkbox h-8 w-8"
                      onClick={(_e) => {
                        if (props.tokenId != undefined) {
                          setBurnSelected(props.tokenId?.toString());
                        }
                      }}
                    />
                  )}
                </button>
              </div>
            )}
            <Modal
              isOpen={modalIsOpenSell}
              onAfterOpen={afterOpenModalSell}
              onRequestClose={closeModalSell}
              ariaHideApp={false}
              contentLabel="Example Modal"
            >
              <div className="modal-text">
                <div className="w-full flex flex-col justify-center items-center">
                  <div className="w-full text-center">
                    <h1 className="text-2xl text-center">
                      Sell NFT #
                      {props.tokenId != undefined
                        ? props.tokenId.toString()
                        : null}
                    </h1>
                  </div>
                  <div className="w-full mt-4">
                    <label>
                      How many BUSD in CWOLF do you want to sell this NFT for?
                    </label>
                    <input
                      type="number"
                      min="0"
                      pattern="[0-9]*"
                      onChange={(ev: any) => {
                        changeSellPrice(ev);
                      }}
                      className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                      value={sellPrice}
                    />
                  </div>
                  <div className="w-full mt-2 text-center text-sm text-red-500">
                    Place the price in USD, you will receive in CWOLF the
                    corresponding amount of those dollars.
                  </div>
                </div>
              </div>
              <div className="modal-button-container">
                <button className="modal-cancel" onClick={closeModalSell}>
                  cancel
                </button>
                <button
                  className="button button-primary"
                  onClick={() => {
                    sellMaterial();
                  }}
                >
                  SELL NFT
                </button>
              </div>
            </Modal>
            <Modal
              isOpen={modalIsOpen}
              onAfterOpen={afterOpenModal}
              onRequestClose={closeModal}
              ariaHideApp={false}
              contentLabel="Example Modal"
            >
              <div className="modal-text">
                Receive {burnedCwolf} CWOLF for burning your NFT
              </div>
              <div className="modal-button-container">
                <button className="modal-cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="modal-burn"
                  onClick={() => {
                    burnMaterial(props.tokenId!);
                  }}
                >
                  Burn
                </button>
              </div>
            </Modal>
          </>
        ) : (
          <></>
        )}
        {props.type !== "material" && props.type !== "wolfPack" ? (
          <>
            {props.isWolfPackCreate != undefined &&
            props.isWolfPackCreate == true ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    right: "50%",
                    top: "2rem",
                    background: "#061231",
                    padding: "0.5rem",
                    fontSize: "10px",
                    fontWeight: "normal",
                    zIndex: "1",
                    transform: "translateX(50%)",
                  }}
                  className="rounded-lg"
                >
                  #{props.tokenId?.toString()}
                </div>
              </>
            ) : (
              <></>
            )}
            {props.isWolfPackCreate2 != undefined &&
            props.isWolfPackCreate2 == true ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    right: "3rem",
                    top: "2rem",
                    background: "#061231",
                    padding: "0.5rem",
                    fontSize: "10px",
                    fontWeight: "normal",
                    zIndex: "5",
                  }}
                  className="rounded-lg"
                >
                  #{props.tokenId?.toString()}
                </div>
              </>
            ) : (
              <></>
            )}
            {props.isWolfPackCreate2 == undefined &&
            props.isWolfPackCreate == undefined ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    right: "0.25rem",
                    top: "4.5rem",
                    background: "#061231",
                    padding: "0.5rem",
                    fontSize: "10px",
                    fontWeight: "normal",
                    zIndex: "5",
                  }}
                  className="rounded-lg"
                >
                  #{props.tokenId?.toString()}
                </div>
              </>
            ) : (
              <></>
            )}
            <img
              src={`https://cdn.cryptowolf.finance/images/card/r-${props.level}.png`}
              alt="Card"
              className={`background ${
                props.isWolfPackCreate ? "background-wolfwolfpack" : ""
              }`}
            />

            {play === false ? (
              <span
                className={`wolf ${props.breed} ${props.breed}-static ${
                  props.isWolfPackCreate ? "spanWolfIsWolfPack" : ""
                }`}
              />
            ) : (
              <span
                className={`wolf ${props.breed} ${
                  props.isWolfPackCreate ? "spanWolfIsWolfPack" : ""
                }`}
              />
            )}
            {props.size === "small" ||
            props.notproperties === "notproperties" ? (
              <></>
            ) : (
              <div>
                {props.notburn === "notburn" ? (
                  <>
                    {console.log(props.isMarketplace, props.sellerAddress, address)}
                    {props.isMarketplace == "yes" &&
                    props.sellerAddress == address ? (
                      <>
                        <div
                          className={clsx(
                            "burn-container burn-container-wolf burn-container-cave flex flex-wrap justify-center items-center",
                          )}
                          style={{
                            height: "max-content",
                            gap: "0.5rem",
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                        >
                          <button
                            className="button button-regular button-market"
                            onClick={() => setModalIsOpenRemove(true)}
                            style={{ width: "80%" }}
                          >
                            Remove NFT
                          </button>
                          <Modal
                            isOpen={modalIsOpenRemove}
                            onRequestClose={closeModalRemove}
                            contentLabel="Example Modal"
                          >
                            <div className="modal-text">
                              Do you want to remove this NFT from the
                              marketplace?
                            </div>
                            <div className="modal-button-container">
                              <button
                                className="modal-cancel"
                                onClick={closeModalRemove}
                              >
                                cancel
                              </button>
                              <button
                                className="button button-primary"
                                onClick={() => {
                                  removeNFTMarket();
                                }}
                              >
                                Remove NFT
                              </button>
                            </div>
                          </Modal>
                          <button
                            className="button button-regular button-market"
                            onClick={() => setModalIsOpenEditPrice(true)}
                            style={{ width: "80%" }}
                          >
                            Edit Price
                          </button>
                        </div>
                        <Modal
                          isOpen={modalIsOpenEditPrice}
                          onRequestClose={closeModalEditPrice}
                          contentLabel="Example Modal"
                        >
                          <div className="modal-text">
                            <div className="w-full felx flex-col text-center justify-center items-center">
                              <div className="w-full text-lg font-bold">
                                Edit Price NFT
                              </div>
                              <div className="w-full mt-4">
                                <label>
                                  How many BUSD in CWOLF do you want to sell
                                  this NFT for?
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  pattern="[0-9]*"
                                  onChange={(ev: any) => {
                                    changeSellPrice(ev);
                                  }}
                                  className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                  value={sellPrice}
                                />
                              </div>
                              <div className="w-full mt-2 text-center text-sm text-red-500">
                                Place the price in USD, you will receive in
                                CWOLF the corresponding amount of those dollars.
                              </div>
                            </div>
                          </div>
                          <div className="modal-button-container">
                            <button
                              className="modal-cancel"
                              onClick={closeModalEditPrice}
                            >
                              cancel
                            </button>
                            <button
                              className="button button-primary"
                              onClick={() => {
                                editPrice();
                              }}
                            >
                              Edit Price
                            </button>
                          </div>
                        </Modal>
                      </>
                    ) : null}
                  </>
                ) : (
                  <div
                    className={clsx(
                      "burn-container burn-container-wolf burn-container-cave flex justify-center items-center",
                      props.burnItems.includes(props.tokenId?.toString()) &&
                        "burn-container-selected"
                    )}
                  >
                    {props.isMarketplace !== "yes" && props.isPack !== "yes" ? (
                      <button
                        id="sell"
                        className="button button-regular"
                        onClick={openModalSell}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="40px"
                          id="Layer_1"
                          version="1.1"
                          viewBox="0 0 512 512"
                          width="40px"
                        >
                          <path
                            fill="#FFFFFF"
                            d="M232.627,268.19c-2.212,1.761-3.93,3.961-5.198,6.585c-1.248,2.602-1.889,5.671-1.889,9.217  c0,5.555,1.776,9.849,5.309,12.896c3.535,3.02,9.354,5.48,17.441,7.324v-41.201c-2.87,0-5.668,0.42-8.352,1.265  C237.256,265.121,234.798,266.416,232.627,268.19 M284.307,353.365c-4.14-3.277-11.15-6.264-21.091-8.954v48.507  c3.024-0.316,6.198-1.041,9.45-2.135c3.307-1.1,6.234-2.647,8.882-4.682c2.587-2.006,4.722-4.505,6.427-7.446  c1.679-2.953,2.527-6.45,2.527-10.49C290.502,361.599,288.423,356.655,284.307,353.365 M335.211,161.639l0.036,0.031  c-0.113-0.125-0.189-0.246-0.303-0.369c-4.839-6.736-9.676-13.212-14.397-19.37c-6.236-10.43-9.523-23.12-1.892-41.427v-0.012  l26.324-62.988l-41.325-18.834L307.884,0H204.072l5.442,23.789l-42.511,13.716l26.304,62.988v0.012  c13.018,31.139-5.615,46.01-16.556,61.166C122.598,236.552,61.98,343.759,61.98,408.389c0,107.167,83.237,103.598,194.02,103.598  c110.768,0,194.021,3.569,194.021-103.598C450.021,343.747,389.346,236.541,335.211,161.639 M229.926,109.053h52.982v33.434h-52.982  V109.053z M323.61,383.695"
                          />
                        </svg>
                      </button>
                    ) : null}
                    <button
                      id="burn"
                      className="button button-regular"
                      onClick={openModal}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        version="1.1"
                        id="Layer_1"
                        x="0px"
                        y="0px"
                        viewBox="0 0 388.219 388.219"
                      >
                        <path
                          d="M160.109,182.619c0.8,6.8-6,11.6-12,8c-22-12.8-32.8-36.4-47.2-56.8c-23.2,36.8-40.8,72.4-40.8,110.4  c0,77.2,54.8,136,132,136s136-58.8,136-136c0-96.8-101.2-113.6-100-236C187.309,37.019,148.909,101.419,160.109,182.619z"
                          style={{ fill: "white" }}
                        ></path>
                        <path
                          d="M192.109,388.219c-81.2,0-140-60.4-140-144c0-42,20.4-80,42-114.8c1.6-2.4,4-3.6,6.4-3.6  c2.8,0,5.2,1.2,6.8,3.2c3.6,4.8,6.8,10,10,15.2c10,15.6,19.6,30.4,34.8,39.2l0,0c-11.6-82.8,27.6-151.2,71.2-182  c2.4-1.6,5.6-2,8.4-0.4c2.8,1.2,4.4,4,4.4,7.2c-0.8,62,26.4,96,52.4,128.4c23.6,29.2,47.6,59.2,47.6,107.6  C336.109,326.219,274.109,388.219,192.109,388.219z M101.309,148.619c-18,29.6-33.2,61.6-33.2,95.6c0,74,52,128,124,128  c72.8,0,128-55.2,128-128c0-42.8-20.4-68-44-97.6c-24.4-30.4-51.6-64.4-55.6-122c-34.4,31.2-62,88.4-52.4,156.8l0,0  c0.8,6.4-2,12.4-7.2,15.6c-5.2,3.2-11.6,3.2-16.8,0c-18.4-10.8-29.2-28-40-44.4C102.909,151.419,102.109,150.219,101.309,148.619z"
                          style={{ fill: "white" }}
                        ></path>
                        <path
                          d="M278.109,304.219c14-21.6,22-47.6,22-76"
                          style={{ fill: "white" }}
                        ></path>
                        <path
                          d="M278.109,312.219c-1.6,0-3.2-0.4-4.4-1.2c-3.6-2.4-4.8-7.2-2.4-11.2c13.6-20.8,20.8-45.6,20.8-71.6  c0-4.4,3.6-8,8-8s8,3.6,8,8c0,29.2-8,56.8-23.2,80.4C283.309,311.019,280.909,312.219,278.109,312.219z"
                          style={{ fill: "white" }}
                        ></path>
                        <path
                          d="M253.709,332.219c2.8-2.4,6-5.2,8.4-8"
                          style={{ fill: "white" }}
                        ></path>
                        <path
                          d="M253.709,340.219c-2.4,0-4.4-0.8-6-2.8c-2.8-3.2-2.4-8.4,0.8-11.2c2.4-2.4,5.6-4.8,7.6-7.2  c2.8-3.2,8-3.6,11.2-0.8c3.2,2.8,3.6,8,0.8,11.2c-2.8,3.2-6.4,6.4-9.2,8.8C257.309,339.419,255.709,340.219,253.709,340.219z"
                          style={{ fill: "white" }}
                        ></path>
                      </svg>
                    </button>
                    <button id="burnSelect" className="button button-regular">
                      {props.burnItems.includes(props.tokenId?.toString()) ? (
                        <input
                          type="checkbox"
                          className="form-checkbox h-8 w-8"
                          checked
                          onClick={(_e) => {
                            if (props.tokenId != undefined) {
                              setBurnSelected(props.tokenId?.toString());
                            }
                          }}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          className="form-checkbox h-8 w-8"
                          onClick={(_e) => {
                            if (props.tokenId != undefined) {
                              setBurnSelected(props.tokenId?.toString());
                            }
                          }}
                        />
                      )}
                    </button>
                  </div>
                )}
                <Modal
                  isOpen={modalIsOpenSell}
                  onAfterOpen={afterOpenModalSell}
                  onRequestClose={closeModalSell}
                  ariaHideApp={false}
                  contentLabel="Example Modal"
                >
                  <div className="modal-text">
                    <div className="w-full flex flex-col justify-center items-center">
                      <div className="w-full text-center">
                        <h1 className="text-2xl text-center">
                          Sell NFT #
                          {props.tokenId != undefined
                            ? props.tokenId.toString()
                            : null}
                        </h1>
                      </div>
                      <div className="w-full mt-4">
                        <label>
                          How many BUSD in CWOLF do you want to sell this NFT
                          for?
                        </label>
                        <input
                          type="number"
                          min="0"
                          pattern="[0-9]*"
                          onChange={(ev: any) => {
                            changeSellPrice(ev);
                          }}
                          className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                          value={sellPrice}
                        />
                      </div>
                      <div className="w-full mt-2 text-center text-sm text-red-500">
                        Place the price in USD, you will receive in CWOLF the
                        corresponding amount of those dollars.
                      </div>
                    </div>
                  </div>
                  <div className="modal-button-container">
                    <button className="modal-cancel" onClick={closeModalSell}>
                      cancel
                    </button>
                    <button
                      className="button button-primary"
                      onClick={() => {
                        sellWolf();
                      }}
                    >
                      SELL NFT
                    </button>
                  </div>
                </Modal>
                <Modal
                  isOpen={modalIsOpen}
                  onAfterOpen={afterOpenModal}
                  onRequestClose={closeModal}
                  contentLabel="Example Modal"
                >
                  <div className="modal-text">
                    Receive {burnedCwolf} CWOLF for burning your NFT
                  </div>
                  <div className="modal-button-container">
                    <button className="modal-cancel" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="modal-burn"
                      onClick={() => {
                        burnWolf(props.tokenId!);
                      }}
                    >
                      Burn
                    </button>
                  </div>
                </Modal>
                <div className="properties"></div>
                <div className="heartContainer">
                  {props.gender == "Male" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      version="1.1"
                      id="Capa_1"
                      x="0px"
                      y="0px"
                      viewBox="0 0 393.739 393.739"
                    >
                      <g fill="#FFFFFF">
                        <path d="M370.907,0h-93.048c-9.091,0-16.455,7.365-16.455,16.45c0,9.085,7.364,16.453,16.455,16.453h43.19L217.25,136.704   c-21.049-12.879-45.768-20.318-72.194-20.318c-76.468,0-138.679,62.208-138.679,138.676c0,76.474,62.211,138.678,138.679,138.678   s138.678-62.204,138.678-138.678c0-33.07-11.655-63.455-31.037-87.314L354.462,65.985v49.231c0,9.085,7.365,16.452,16.444,16.452   c9.09,0,16.455-7.367,16.455-16.452V16.45C387.362,7.365,379.997,0,370.907,0z M145.056,346.737   c-50.546,0-91.673-41.127-91.673-91.676c0-50.543,41.121-91.667,91.673-91.667c50.546,0,91.664,41.124,91.664,91.667   C236.72,305.61,195.602,346.737,145.056,346.737z" />
                      </g>
                    </svg>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        version="1.1"
                        id="Capa_1"
                        x="0px"
                        y="0px"
                        viewBox="0 0 40.249 40.249"
                      >
                        <g fill="#FFFFFF">
                          <path d="M26.875,27.999h-4.25v-4.646c5.315-1.15,9.312-5.887,9.312-11.542C31.937,5.298,26.638,0,20.125,0   S8.312,5.299,8.312,11.812c0,5.655,3.996,10.391,9.312,11.542v4.646h-4.25c-1.381,0-2.5,1.119-2.5,2.5s1.119,2.5,2.5,2.5h4.25v4.75   c0,1.381,1.119,2.5,2.5,2.5c1.381,0,2.5-1.119,2.5-2.5v-4.75h4.25c1.381,0,2.5-1.119,2.5-2.5S28.256,27.999,26.875,27.999z    M13.312,11.812C13.312,8.056,16.37,5,20.125,5c3.755,0,6.813,3.057,6.813,6.812c0,3.758-3.058,6.813-6.813,6.813   C16.37,18.625,13.312,15.567,13.312,11.812z" />
                        </g>
                      </svg>
                    </>
                  )}
                  <svg viewBox="0 0 5480 4900" className="heart ml-2">
                    <g fill="#FFFFFF">
                      <path d="M2570 4729 c-678 -358 -1286 -879 -1695 -1451 -272 -382 -477 -829 -570 -1243 -47 -209 -58 -327 -52 -555 7 -288 41 -445 141 -655 120 -251 298 -436 528 -548 133 -65 234 -88 403 -94 164 -6 264 9 413 62 374 134 721 506 933 998 l33 79 15 -34 c274 -629 665 -1005 1137 -1094 67 -12 123 -15 229 -11 169 6 270 29 403 94 332 161 557 476 644 903 28 135 36 463 15 620 -77 582 -362 1192 -811 1737 -193 233 -536 554 -812 759 -279 208 -756 494 -821 494 -10 0 -70 -28 -133 -61z" />
                    </g>
                  </svg>
                  <span className="heartNumber">
                    {Number(props.defense) + Number(props.attack)}
                  </span>
                </div>
                <div className="defenseAttackContainer">
                  <div className="attackContainer flex">
                    <span className="attackNumber">{props.attack}</span>
                    <svg viewBox="0 0 320.66 320.66" className="attack">
                      <g transform="translate(274.62 -583.47)">
                        <g fill="#FFFFFF">
                          <path d="m-231.5 611.06c-3.9731 0-7.9374 1.5311-10.969 4.5625-6.0627 6.0627-6.0627 15.875 0 21.938 3.2523 3.2524 7.5864 4.7683 11.844 4.5312l39.375 39.406-39.188 39.188 34.75-11.781 9.6562-9.6562 44.531 44.5-95.375 95.375-5.5 32.625 32.656-5.4688 95.344-95.344 95.438 95.406 32.656 5.4688-5.48-32.7-95.406-95.406 44.5-44.5 9.6875 9.6875 34.75 11.781-39.25-39.25 39.375-39.344c4.2574 0.23709 8.5914-1.2789 11.844-4.5312 6.0627-6.0627 6.0627-15.875 0-21.938-3.0314-3.0314-6.9957-4.5625-10.969-4.5625-3.9731 0-7.9374 1.5311-10.969 4.5625-3.2523 3.2524-4.7683 7.5864-4.5312 11.844l-39.375 39.344-39.188-39.219 11.781 34.781 9.6875 9.6875-44.5 44.5-44.5-44.5 9.625-9.6562 11.781-34.75-39.16 39.16-39.44-39.43c0.21019-4.2275-1.2713-8.5213-4.5-11.75-3.0314-3.0314-7.0269-4.5625-11-4.5625z"></path>
                        </g>
                      </g>
                    </svg>
                  </div>
                  <div className="defenseContainer flex">
                    <svg viewBox="0 0 8.5 11" className="defense">
                      <g fill="#FFFFFF">
                        <path d="m4.25 1.3382l-3.7545 1.128c0.09209 2.7926 0.7929 6.1993 3.7545 7.1956 2.9942-0.9678 3.6274-4.4327 3.7545-7.1956l-3.7545-1.128z" />
                      </g>
                    </svg>
                    <span className="defenseNumber">{props.defense}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <></>
        )}
      </div>
      {props.isMarketplace === "yes" && (
        <>
          <div className="btn btn--small" onClick={buyNFT}>
            {props.askingPriceInCWOLF.toFixed(2)} CWOLF
          </div>
        </>
      )}
    </div>
  );
};

export default CardGame;
