/* eslint-disable array-callback-return */
/* eslint-disable func-names */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/return-await */
import React, { useEffect, useState } from "react";

import { MultiCall } from "eth-multicall";
import { ethers } from "ethers";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Modal from "react-modal";
import Web3 from "web3";

import { useWeb3modal } from "../../context/Web3modal";
import CWolfTokenJSON from "../../contracts/CWolfToken.json";
import MaterialsNFTJSON from "../../contracts/MaterialsNFT.json";
import WolfPacksNFTJSON from "../../contracts/WolfPacksNFT.json";
import WolfsNFTJSON from "../../contracts/WolfsNFT.json";
import { wolvesData, materialsData } from "../../lib/nftsData";
import config from "../../utils/AppConfig";
import Tab from "../tabs/Tab";
import Tabs from "../tabs/Tabs";
import { useToast } from "../toast/ToastProvider";
import CardGame from "./CardGame";

type IWolfPackCreateProps = {
  priceBox: number;
  tokenPack: string;
  toast: any;
  creatingWolfPack?: any;
  createdWolfPack?: any;
  isEditWolfPack?: boolean;
  editWolfPackItem?: any;
};

const customStyles = {
  content: {
    width: "40%",
    height: "20%",
    margin: "auto",
  },
};

const WolfPackCreate = (props: IWolfPackCreateProps) => {
  const toast = useToast();
  const [priceCWOLF, setPriceCWOLF] = useState(0);
  const [initialItemsMaterials, setInitialItemsMaterials] = useState([] as any);
  const [initialItemsWolves, setInitialItemsWolves] = useState([] as any);
  const [filtersMaterialsActive, setFiltersMaterialsActive] = useState(
    [] as any
  );
  const [filtersWolvesActive, setFiltersWolvesActive] = useState([] as any);
  const [filtersMaterialsSelected, setFiltersMaterialsSelected] = useState([
    "button-primary",
  ] as any);
  const [filtersWolvesSelected, setFiltersWolvesSelected] = useState([
    "button-primary",
  ] as any);
  const [itemsMaterialsShow, setItemsMaterialsShow] = useState([] as any);
  const [itemsWolvesShow, setItemsWolvesShow] = useState([] as any);
  const [itemsMaterials, setItemsMaterials] = useState([] as any);
  const [itemsWolves, setItemsWolves] = useState([] as any);
  const [wolfPackName, setWolfPackName] = useState("");
  const [maxWolves, setMaxWolves] = useState(0);
  const [attackWolfPack, setAttackWolfPack] = useState(0);
  const [modalIsOpen, setModalIsOpen] = React.useState(false);
  const [modalEditIsOpen, setModalEditIsOpen] = React.useState(false);
  const [maxMaterials, setMaxMaterials] = useState(20);

  const { web3Provider, address }: any = useWeb3modal();

  function sumProp(items: any, prop: any) {
    return items.reduce(function sumAux(a: any, b: any) {
      return parseInt(a, 10) + parseInt(b[prop], 10);
    }, 0);
  }

  function calculateMaxWolves(itemsArray: any) {
    let maxSlots = sumProp(itemsArray, "slot");

    if (props.isEditWolfPack == true) {
      maxSlots =
        maxSlots +
        parseInt(props.editWolfPackItem.totalSlotsAvailableInWolfPack);
    }

    setMaxWolves(maxSlots);
  }

  function calculateAttackWolfPack(itemsArray: any) {
    let maxSlots = sumProp(itemsArray, "attack");

    if (props.isEditWolfPack == true) {
      maxSlots =
        parseInt(maxSlots) + parseInt(props.editWolfPackItem.pointsOfWolfPack);
    }

    setAttackWolfPack(maxSlots);
  }

  function range(size: number, startAt: number = 0): ReadonlyArray<number> {
    const rangeArray = [];
    for (let i = startAt; i <= size; i += 1) {
      rangeArray.push(i);
    }
    return rangeArray;
  }

  async function openModalEdit() {
    setModalEditIsOpen(true);
  }
  function closeModalEdit() {
    setModalEditIsOpen(false);
  }

  async function openModal() {
    setModalIsOpen(true);
  }
  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }
  function closeModal() {
    setModalIsOpen(false);
  }

  function chunkArray(arr: any, n: any) {
    const chunkLength = Math.max(arr.length / n, 1);
    const chunks = [];

    for (let i = 0; i < n; i++) {
      if (chunkLength * (i + 1) <= arr.length)
        chunks.push(arr.slice(chunkLength * i, chunkLength * (i + 1)));
    }

    return chunks;
  }

  const editWolfPack = async () => {
    closeModalEdit();

    if (itemsWolves.length > maxWolves) {
      props.toast?.pushError(
        "You exceed the maximum capacity of this pack, add more material or remove wolves",
        8000
      );
    } else if (itemsMaterials.length > maxMaterials) {
      props.toast?.pushError(
        `It has more than ${maxMaterials} materials, which is the maximum allowed.`,
        8000
      );
    } else {
      const signer = web3Provider.getSigner();
      // Your current metamask account;
      const wolfPacksInst = new ethers.Contract(
        WolfPacksNFTJSON.address,
        WolfPacksNFTJSON.abi,
        signer
      );
      const itemsWolvesArray = [] as any;
      itemsWolves.map(function (item: any) {
        itemsWolvesArray.push(item.tokenId.toString());
      });
      const itemsMaterialsArray = [] as any;
      itemsMaterials.map(function (item: any) {
        itemsMaterialsArray.push(item.tokenId.toString());
      });

      let currentStep = "1";
      let maxStep = "1";

      const finalItemsMaterialsArray = [...itemsMaterialsArray];
      let finalItemsWolvesArray = [...itemsWolvesArray];
      let itemsWolvesArrayRemaining = [] as any;

      if (itemsMaterialsArray.length + itemsWolvesArray.length > 70) {
        maxStep = "2";

        finalItemsWolvesArray = chunkArray([...itemsWolvesArray], 2)[0];
        itemsWolvesArrayRemaining = chunkArray([...itemsWolvesArray], 2)[1];
      }

      wolfPacksInst
        .addMultipleMaterialsAndWolfsToWolfPack(
          props.editWolfPackItem.tokenId,
          finalItemsMaterialsArray,
          finalItemsWolvesArray
        )
        .then(
          (_result: any) => {
            props.toast?.pushInfo("Editing Wolf Pack.", 8000);
            if (props.creatingWolfPack != null) {
              props.creatingWolfPack(
                currentStep,
                maxStep,
                `Executing step 1/${maxStep}... This may take a few minutes.`
              );
            }
            if (
              currentStep == maxStep &&
              itemsWolvesArrayRemaining.length < 1
            ) {
              props.toast?.pushInfo(
                "Soon you will see the changes in the wolf pack",
                8000
              );

              if (props.createdWolfPack != null) {
                props.createdWolfPack();
              }
            } else {
              props.toast?.pushInfo("Step 1 finished. Executing step 2.", 8000);

              currentStep = "2";
              props.creatingWolfPack(
                currentStep,
                maxStep,
                "Running step 2/2... This may take a few minutes."
              );

              wolfPacksInst
                .addMultipleWolfsToWolfPack(
                  props.editWolfPackItem.tokenId,
                  itemsWolvesArrayRemaining
                )
                .then(
                  (_result: any) => {
                    props.toast?.pushInfo(
                      "The wolves will be visible in the wolf pack, in the next few minutes.",
                      8000
                    );
                    if (props.createdWolfPack != null) {
                      props.createdWolfPack();
                    }
                  },
                  (_error: any) => {
                    props.toast?.pushError(
                      'An error occurred while executing step 2. Dont worry, you can add the remaining wolves in the "Edit wolf pack" option.',
                      8000
                    );
                    if (props.createdWolfPack != null) {
                      props.createdWolfPack();
                    }
                  }
                );
            }
          },
          (_error: any) => {
            props.toast?.pushError("Minting was canceled", 8000);
          }
        );
    }
  };

  const createWolfPack = async () => {
    closeModal();
    if (itemsWolves.length > maxWolves) {
      props.toast?.pushError(
        "You exceed the maximum capacity of this pack, add more material or remove wolves",
        8000
      );
    } else if (itemsMaterials.length > 20) {
      props.toast?.pushError(
        `It has more than ${maxMaterials} materials, which is the maximum allowed.`,
        8000
      );
    } else {
      const signer = web3Provider.getSigner();
      // Your current metamask account;
      const wolfPacksInst = new ethers.Contract(
        WolfPacksNFTJSON.address,
        WolfPacksNFTJSON.abi,
        signer
      );
      const itemsWolvesArray = [] as any;
      itemsWolves.map(function (item: any) {
        itemsWolvesArray.push(item.tokenId.toString());
      });
      const itemsMaterialsArray = [] as any;
      itemsMaterials.map(function (item: any) {
        itemsMaterialsArray.push(item.tokenId.toString());
      });
      const tokenInst = new ethers.Contract(
        CWolfTokenJSON.address,
        CWolfTokenJSON.abi,
        signer
      );

      const [gas, balanceBNB, balanceCWOLF] = await Promise.all([
        wolfPacksInst.calculateGasAndCommissions(),
        web3Provider.getBalance(address),
        tokenInst.balanceOf(address),
      ]);
      if (parseFloat((balanceBNB / 1e18).toFixed(6)) < 0.001) {
        toast?.pushError("Don't have enough BNB", 8000);
      } else if (parseFloat((balanceCWOLF / 1e18).toFixed(6)) < priceCWOLF) {
        toast?.pushError("Don't have enough CWOLF", 8000);
      } else {
        const valueFinal = Math.round((110 * gas[2]) / 100).toString();

        var currentStep = "1";
        var maxStep = "1";

        const finalItemsMaterialsArray = [...itemsMaterialsArray];
        let finalItemsWolvesArray = [...itemsWolvesArray];
        let itemsWolvesArrayRemaining = [] as any;

        if (itemsMaterialsArray.length + itemsWolvesArray.length > 70) {
          maxStep = "2";

          finalItemsWolvesArray = chunkArray([...itemsWolvesArray], 2)[0];
          itemsWolvesArrayRemaining = chunkArray([...itemsWolvesArray], 2)[1];
        }

        wolfPacksInst
          .createWolfPackAndAddWolfsAndMaterials(
            finalItemsMaterialsArray,
            finalItemsWolvesArray,
            {
              value: valueFinal,
            }
          )
          .then(
            (_result: any) => {
              props.toast?.pushInfo("Creating Wolf Pack.", 8000);
              if (props.creatingWolfPack != null) {
                props.creatingWolfPack(
                  currentStep,
                  maxStep,
                  `Executing step 1/${maxStep}... This may take a few minutes.`
                );
              }
            },
            (_error: any) => {
              props.toast?.pushError("Minting was canceled", 8000);
            }
          );

        const addMultipleWolf = async (_tokenId: any) => {
          currentStep = "2";
          props.creatingWolfPack(
            currentStep,
            maxStep,
            "Running step 2/2... This may take a few minutes."
          );

          wolfPacksInst
            .addMultipleWolfsToWolfPack(_tokenId, itemsWolvesArrayRemaining)
            .then(
              (_result: any) => {
                props.toast?.pushInfo(
                  "The wolves will be visible in the wolf pack, in the next few minutes.",
                  8000
                );
                if (props.createdWolfPack != null) {
                  props.createdWolfPack();
                }
              },
              (_error: any) => {
                props.toast?.pushError(
                  'An error occurred while executing step 2. Dont worry, you can add the remaining wolves in the "Edit wolf pack" option.',
                  8000
                );
                if (props.createdWolfPack != null) {
                  props.createdWolfPack();
                }
              }
            );
        };

        wolfPacksInst.on("MintedNFT", (to, _tokenId) => {
          if (address === to) {
            if (
              currentStep == maxStep &&
              itemsWolvesArrayRemaining.length < 1
            ) {
              if (props.createdWolfPack != null) {
                props.createdWolfPack();
              }
            } else {
              props.toast?.pushInfo("Step 1 finished. Executing step 2.", 8000);

              addMultipleWolf(_tokenId);
            }
          }
        });
      }
    }
  };
  const removeElementAt = (arr: any, index: number) => {
    const frontPart = arr.slice(0, index);
    const lastPart = arr.slice(index + 1); // index to end of array
    return [...frontPart, ...lastPart];
  };

  function onClickAdd(type: string, tokenId: any) {
    if (type === "materials") {
      let newInitialItemsMaterials = [...initialItemsMaterials];
      const newItemsArray = [...itemsMaterials];
      newInitialItemsMaterials = newInitialItemsMaterials.filter(
        (item: any) => {
          if (item.tokenId.toString() !== tokenId.toString()) {
            return true;
          }

          newItemsArray.push(item);
          return false;
        }
      );
      setInitialItemsMaterials(newInitialItemsMaterials);
      setItemsMaterialsShow(newInitialItemsMaterials);
      let filterNumber = 0;
      for (let i = 0; i < filtersMaterialsSelected.length; i += 1) {
        if (filtersMaterialsSelected[i] === "button-primary") {
          filterNumber = i;
        }
      }
      selectFilterMaterials(filterNumber, newInitialItemsMaterials);
      setItemsMaterials(newItemsArray);
      calculateMaxWolves(newItemsArray);
      setPriceCWOLF(
        (newItemsArray.length + itemsWolves.length) * props.priceBox
      );
    } else if (type === "wolves") {
      let newInitialItemsWolves = [...initialItemsWolves];
      const newItemsArray = [...itemsWolves];
      newInitialItemsWolves = newInitialItemsWolves.filter((item: any) => {
        if (item.tokenId.toString() != tokenId.toString()) {
          return true;
        }

        newItemsArray.push(item);
        return false;
      });
      setInitialItemsWolves(newInitialItemsWolves);
      setItemsWolvesShow(newInitialItemsWolves);
      let filterNumber = 0;
      for (let i = 0; i < filtersWolvesSelected.length; i += 1) {
        if (filtersWolvesSelected[i] === "button-primary") {
          filterNumber = i;
        }
      }
      selectFilterWolves(filterNumber, newInitialItemsWolves);
      setItemsWolves(newItemsArray);
      calculateAttackWolfPack(newItemsArray);
      setPriceCWOLF(
        (itemsMaterials.length + newItemsArray.length) * props.priceBox
      );
    }
  }

  const onDragEnd = (result: any) => {
    const { source, destination } = result;
    if (destination?.droppableId === "items") {
      if (source.droppableId === "droppableMaterials") {
        let newInitialItemsMaterials = [...initialItemsMaterials];
        const newItemsArray = [...itemsMaterials];
        newInitialItemsMaterials = newInitialItemsMaterials.filter(
          (item: any) => {
            if (
              item.tokenId.toString() !=
              itemsMaterialsShow[source.index].tokenId.toString()
            ) {
              return true;
            }

            newItemsArray.push(item);
            return false;
          }
        );
        setInitialItemsMaterials(newInitialItemsMaterials);
        setItemsMaterialsShow(newInitialItemsMaterials);
        let filterNumber = 0;
        for (let i = 0; i < filtersMaterialsSelected.length; i += 1) {
          if (filtersMaterialsSelected[i] === "button-primary") {
            filterNumber = i;
          }
        }
        selectFilterMaterials(filterNumber, newInitialItemsMaterials);
        setItemsMaterials(newItemsArray);
        calculateMaxWolves(newItemsArray);
        setPriceCWOLF(
          (newItemsArray.length + itemsWolves.length) * props.priceBox
        );
      } else if (source.droppableId === "droppableWolves") {
        let newInitialItemsWolves = [...initialItemsWolves];
        const newItemsArray = [...itemsWolves];
        newInitialItemsWolves = newInitialItemsWolves.filter((item: any) => {
          if (
            item.tokenId.toString() !=
            itemsWolvesShow[source.index].tokenId.toString()
          ) {
            return true;
          }

          newItemsArray.push(item);
          return false;
        });
        setInitialItemsWolves(newInitialItemsWolves);
        setItemsWolvesShow(newInitialItemsWolves);
        let filterNumber = 0;
        for (let i = 0; i < filtersWolvesSelected.length; i += 1) {
          if (filtersWolvesSelected[i] === "button-primary") {
            filterNumber = i;
          }
        }
        selectFilterWolves(filterNumber, newInitialItemsWolves);
        setItemsWolves(newItemsArray);
        calculateAttackWolfPack(newItemsArray);
        setPriceCWOLF(
          (itemsMaterials.length + newItemsArray.length) * props.priceBox
        );
      }
    }
    if (result[0] === "removeWolves") {
      const i = result[1];

      const itemsArray = [
        itemsWolves.filter((_item: any, index: any) => index === i)[0],
        ...initialItemsWolves,
      ];
      setInitialItemsWolves(itemsArray);
      setItemsWolvesShow(itemsArray);
      const newList = itemsWolves.filter(
        (item: any, index: any) => index !== i && item.id !== ""
      );
      setItemsWolves(newList);
      calculateAttackWolfPack(newList);
      setPriceCWOLF((itemsMaterials.length + newList.length) * props.priceBox);
    }
    if (result[0] === "removeMaterials") {
      const i = result[1];

      const itemsArray = [
        itemsMaterials.filter((_item: any, index: any) => index === i)[0],
        ...initialItemsMaterials,
      ];
      setInitialItemsMaterials(itemsArray);
      setItemsMaterialsShow(itemsArray);

      const newList = itemsMaterials.filter(
        (item: any, index: any) => index !== i && item.id !== ""
      );

      setItemsMaterials(newList);
      calculateMaxWolves(newList);
      setPriceCWOLF((newList.length + itemsWolves.length) * props.priceBox);
    }
  };

  const selectFilterMaterials = async (filter: number, itemsNFTs: any = []) => {
    const filterArray = [];
    for (let i = 0; i < filter; i += 1) {
      filterArray.push("");
    }
    filterArray.push("button-primary");
    setFiltersMaterialsSelected(filterArray);

    let items = [] as any;
    if (filter === 0) {
      if (itemsNFTs.length > 0) {
        items = itemsNFTs;
      } else {
        items = initialItemsMaterials;
      }
    } else if (itemsNFTs.length > 0) {
      items = itemsNFTs.filter(
        (item: any) => item.level === wolvesData.Level[filter - 1]
      );
    } else {
      items = initialItemsMaterials.filter(
        (item: any) => item.level === wolvesData.Level[filter - 1]
      );
    }
    setItemsMaterialsShow(items);
  };

  const selectFilterWolves = async (filter: number, itemsNFTs: any = []) => {
    const filterArray = [];
    for (let i = 0; i < filter; i += 1) {
      filterArray.push("");
    }
    filterArray.push("button-primary");
    setFiltersWolvesSelected(filterArray);

    let items = [] as any;
    if (filter === 0) {
      if (itemsNFTs.length > 0) {
        items = itemsNFTs;
      } else {
        items = initialItemsWolves;
      }
    } else if (itemsNFTs.length > 0) {
      items = itemsNFTs.filter(
        (item: any) => item.level === wolvesData.Level[filter - 1]
      );
    } else {
      items = initialItemsWolves.filter(
        (item: any) => item.level === wolvesData.Level[filter - 1]
      );
    }
    setItemsWolvesShow(items);
  };

  useEffect(() => {
    // Connect to the network
    if (web3Provider) {
      const signer = web3Provider.getSigner();
      const getWolvesNFTs = async () => {
        // Your current metamask account;
        const wolfsNFTInst = new ethers.Contract(
          WolfsNFTJSON.address,
          WolfsNFTJSON.abi,
          signer
        );
        let arrayNFTs = await wolfsNFTInst.walletOfOwner(address);
        arrayNFTs = [...arrayNFTs].reverse();
        const itemsNFTs = [];

        const web3 = await new Web3(
          new Web3.providers.HttpProvider(config.RPC_URL!)
        );
        const contract = await new web3.eth.Contract(
          WolfsNFTJSON.abi as [],
          WolfsNFTJSON.address as string
        );
        const contractWolfPacks = await new web3.eth.Contract(
          WolfPacksNFTJSON.abi as [],
          WolfPacksNFTJSON.address as string
        );

        /* const calls = [];
        for await (const tokenId of arrayNFTs) {
          calls.push({
            getUsedWolf: await contractWolfPacks.methods.wolfsUsed(
              tokenId.toString()
            ),
          });
        } */

        // instancia multicall el address multicall lo puedes guardar en .env ya que luego cambia en mainnet.
        const multicall = new MultiCall(web3, config.MULTICALL);

        /* const arrayNFTsnotUsed = [] as any;
        const results = await multicall.all([calls]);
        if (results[0]) {
          for (let index = 0; index < results[0]?.length; index += 1) {
            if (results[0][index].getUsedWolf === false) {
              arrayNFTsnotUsed.push(arrayNFTs[index]);
            }
          }
        } */

        const callsItems = [] as any;
        for await (const tokenId of arrayNFTs) {
          callsItems.push({
            getWolfProperties: await contract.methods.getWolfProperties(
              tokenId.toString()
            ),
          });
        }

        const resultsItems = await multicall.all([callsItems]);
        if (resultsItems[0]) {
          const callsItemsUsed = [];
          for (let index = 0; index < resultsItems[0]?.length; index += 1) {
            callsItemsUsed.push({
              getUsedWolf: await contractWolfPacks.methods.wolfsUsed(
                arrayNFTs[index].toString()
              ),
            });
          }
          const resultsItemsUsed = await multicall.all([callsItemsUsed]);

          const filtersItems = [] as any;
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
              const breed =
                wolvesData.Breed[resultsItems[0][index].getWolfProperties[0]];
              const gender =
                wolvesData.Gender[resultsItems[0][index].getWolfProperties[1]];
              const level =
                wolvesData.Level[resultsItems[0][index].getWolfProperties[2]];
              filtersItems[
                parseInt(resultsItems[0][index].getWolfProperties[2], 10) + 1
              ] = "active";

              if (attack === 0 && defense === 0) {
              } else {
                itemsNFTs.push({
                  id: index,
                  tokenId: arrayNFTs[index],
                  defense,
                  attack,
                  gender,
                  level,
                  breed,
                  type: "wolf",
                });
              }
            }
          }
          setFiltersWolvesActive(filtersItems);
          setInitialItemsWolves(itemsNFTs);
          setItemsWolvesShow(itemsNFTs);
        }
      };
      const getMaterialsNFTs = async () => {
        // Your current metamask account;
        const materialsNFTInst = new ethers.Contract(
          MaterialsNFTJSON.address,
          MaterialsNFTJSON.abi,
          signer
        );
        let arrayNFTs = await materialsNFTInst.walletOfOwner(address);
        arrayNFTs = [...arrayNFTs].reverse();
        const itemsNFTs = [];

        const web3 = await new Web3(
          new Web3.providers.HttpProvider(config.RPC_URL!)
        );
        const contract = await new web3.eth.Contract(
          MaterialsNFTJSON.abi as [],
          MaterialsNFTJSON.address as string
        );
        const contractWolfPacks = await new web3.eth.Contract(
          WolfPacksNFTJSON.abi as [],
          WolfPacksNFTJSON.address as string
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
        const multicall = new MultiCall(web3, config.MULTICALL);

        /* const arrayNFTsnotUsed = [] as any;
        const results = await multicall.all([calls]);
        if (results[0]) {
          for (let index = 0; index < results[0]?.length; index += 1) {
            if (results[0][index].getUsedMaterial === false) {
              arrayNFTsnotUsed.push(arrayNFTs[index]);
            }
          }
        } */

        const callsItems = [];
        for await (const tokenId of arrayNFTs) {
          callsItems.push({
            getMaterialProperties: await contract.methods.getMaterialSlots(
              tokenId.toString()
            ),
          });
        }

        const resultsItems = await multicall.all([callsItems]);
        if (resultsItems[0]) {
          const callsItemsUsed = [];
          for (let index = 0; index < resultsItems[0]?.length; index += 1) {
            callsItemsUsed.push({
              getUsedMaterial: await contractWolfPacks.methods.materialsUsed(
                arrayNFTs[index].toString()
              ),
            });
          }
          const resultsItemsUsed = await multicall.all([callsItemsUsed]);

          const filtersItems = [] as any;
          for (let index = 0; index < resultsItems[0]?.length; index += 1) {
            let used = false;
            if (resultsItemsUsed[0]) {
              used = resultsItemsUsed[0][index].getUsedMaterial;
            }

            if (used === false) {
              let materialProp = null;
              if (resultsItems[0]) {
                materialProp = parseInt(
                  resultsItems[0][index].getMaterialProperties,
                  10
                );
              }

              let level = null;
              if (materialProp !== null) {
                level = materialsData.Level[materialProp - 1];
              }

              if (materialProp == 0 || materialProp == null) {
              } else {
                itemsNFTs.push({
                  id: index,
                  tokenId: arrayNFTs[index],
                  slot: materialProp,
                  level,
                  type: "material",
                });
                filtersItems[resultsItems[0][index].getMaterialProperties] =
                  "active";
              }
            }
          }
          setFiltersMaterialsActive(filtersItems);
          setInitialItemsMaterials(itemsNFTs);
          setItemsMaterialsShow(itemsNFTs);
        }
      };
      getWolvesNFTs();
      getMaterialsNFTs();

      if (props.isEditWolfPack == true) {
        calculateMaxWolves([]);
        calculateAttackWolfPack([]);

        setMaxMaterials(
          20 - parseInt(props.editWolfPackItem.totalMaterialsInWolfPack)
        );
      }
    }
  }, [web3Provider, address]);
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-wrap">
        <div className="content w-full md:w-2/3">
          <div className="item-box item-box-wolfpackcreate p-4 md:p-8">
            <Tabs>
              <Tab title="Materials">
                <Droppable droppableId="droppableMaterials">
                  {(provided) => (
                    <div>
                      <div className="flex filters justify-center">
                        {range(6, 0).map((item: number) => (
                          <div key={item}>
                            {item === 0 ? (
                              <button
                                className={`filter ${filtersMaterialsSelected[item]}`}
                                onClick={() => selectFilterMaterials(item)}
                              >
                                All
                              </button>
                            ) : (
                              <>
                                {filtersMaterialsActive[item] === "active" ? (
                                  <button
                                    className={`filter ${
                                      wolvesData.Level[item - 1]
                                    } ${filtersMaterialsSelected[item]}`}
                                    onClick={() => selectFilterMaterials(item)}
                                  >
                                    {wolvesData.Level[item - 1]}
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="filter button-disabled cursor-not-allowed"
                                  >
                                    {wolvesData.Level[item - 1]}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <div
                        className="flex flex-wrap justify-around items-center mt-16 wolfpack"
                        ref={provided.innerRef}
                        style={{
                          overflowY: "scroll",
                          maxHeight: "60vh",
                          margin: "0",
                        }}
                      >
                        {itemsMaterialsShow.map((item: any, index: number) => (
                          <Draggable
                            key={`${item.type}-${item.id}`}
                            draggableId={`${item.type}-${item.id}`}
                            index={index}
                          >
                            {(draggableProvided) => (
                              <div
                                {...draggableProvided.draggableProps}
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.dragHandleProps}
                                onClick={() =>
                                  onClickAdd("materials", item.tokenId)
                                }
                              >
                                <CardGame
                                  tokenId={item.tokenId}
                                  defense={0}
                                  attack={0}
                                  level={item.level}
                                  type="material"
                                  nothover=""
                                  notburn="notburn"
                                  isWolfPackCreate={true}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </Tab>
              <Tab title="Wolves">
                <Droppable droppableId="droppableWolves">
                  {(provided) => (
                    <div>
                      <div className="flex filters justify-center">
                        {range(6, 0).map((item: number) => (
                          <div key={item}>
                            {item === 0 ? (
                              <button
                                className={`filter ${filtersWolvesSelected[item]}`}
                                onClick={() => selectFilterWolves(item)}
                              >
                                All
                              </button>
                            ) : (
                              <>
                                {filtersWolvesActive[item] === "active" ? (
                                  <button
                                    className={`filter ${
                                      wolvesData.Level[item - 1]
                                    } ${filtersWolvesSelected[item]}`}
                                    onClick={() => selectFilterWolves(item)}
                                  >
                                    {wolvesData.Level[item - 1]}
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="filter button-disabled cursor-not-allowed"
                                  >
                                    {wolvesData.Level[item - 1]}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <div
                        className="flex flex-wrap justify-around items-center mt-16 wolfpack"
                        ref={provided.innerRef}
                        style={{
                          overflowY: "scroll",
                          maxHeight: "60vh",
                          margin: "0",
                        }}
                      >
                        {itemsWolvesShow.map((item: any, index: number) => (
                          <Draggable
                            key={`${item.type}-${item.id}`}
                            draggableId={`${item.type}-${item.id}`}
                            index={index}
                          >
                            {(draggableProvided) => (
                              <div
                                {...draggableProvided.draggableProps}
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.dragHandleProps}
                                onClick={() =>
                                  onClickAdd("wolves", item.tokenId)
                                }
                              >
                                <CardGame
                                  tokenId={item.tokenId}
                                  attack={parseInt(item.attack, 10)}
                                  defense={parseInt(item.defense, 10)}
                                  gender={item.gender}
                                  level={item.level}
                                  breed={item.breed}
                                  nothover=""
                                  notburn="notburn"
                                  isWolfPackCreate2={true}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </Tab>
            </Tabs>
          </div>
        </div>
        <div className="column w-full md:w-1/3">
          <div className="item-box p-4 md:p-8">
            {false && (
              <div className="input">
                <label>
                  Wolf Pack name
                  <span data-tip="Field requiered">*</span>
                </label>
                <input
                  name="wolfPackName"
                  placeholder="Name your Wolf Pack"
                  maxLength={40}
                  value={wolfPackName}
                  onChange={(e) => setWolfPackName(e.target.value)}
                />
              </div>
            )}
            {attackWolfPack !== 0 ? (
              <div>
                <div className="flex space-between">
                  {props.isEditWolfPack ? (
                    <>
                      <div className="info-box pointer" onClick={openModalEdit}>
                        <svg viewBox="20 100 210 107">
                          <g>
                            <path d="m31.669 182.13c0-10.574-3.1868-37.082-3.1868-37.082 0.7967 8.8356 4.7798 18.855 7.1948 27.087 0.9248-1.3625 1.5839-3.6722 2.0517-6.453-0.5174-2.2275-3.0177-11.413-3.0177-12.957 0-1.5935-0.2419-14.871-0.2419-16.899 0-2.0281 1.4009-5.3833 2.3423-8.1114 0.9414-2.6799 2.2447-4.9493 3.2831-6.301 1.062-1.3764 1.4245-1.5451 1.786-1.9071 0.3871-0.3625 0.9903-0.8935 0.9903-0.8935l2.7038 0.0481-1.8828-0.5309 2.8487 0.1205-2.0522-0.6031h3.2834l-2.4142-0.6762 3.6935 0.0239-1.1585-0.4827h3.8382l-3.0417-0.8207 3.0417 0.1446-0.9413-1.0138 2.9211 0.5791-1.6654-1.4724 2.8963 0.7484s-3.5243-1.714-2.5586-1.5453c0.9893 0.1933 3.1142 0.8937 3.1142 0.8937l-1.6657-1.8597 1.4243 1.0146-0.5553-1.1349 2.6072 0.9176-1.0624-1.7384 2.2212 1.4729-0.9896-1.6659 2.5351 1.2068-0.9902-1.617 1.9318 1.0858-0.3865-1.2552 1.2552 1.2552 0.0486-1.6656 1.062 0.8937-0.3139-0.5317 1.0623 0.821-0.1445-1.0138 2.1245 0.7245-0.5072-0.8456 0.9898 0.8456v-0.7245l0.6277 0.628-0.1933-0.7972 0.8694 0.99-0.1935-1.4247 0.8211 1.0867-0.1452-0.7481 0.9416 1.4724s-0.6277-2.0279-0.3617-1.5932c0.2411 0.3861 1.0376 1.2069 1.0376 1.2069l-0.1928-0.9419 0.8206 0.8935s-0.3856-1.5451-0.1928-1.2312c0.1928 0.2896 0.7964 1.1344 0.7964 1.1344l0.1693-0.7967-0.6519-0.7481 1.3518 0.6278s-1.3518-1.3037-1.0384-1.2315c0.3144 0.073 1.3277 0.5315 1.3277 0.5315s-0.893-1.0865-0.4099-0.8451c0.5067 0.2414 0.869 0.531 0.869 0.531l0.0486-0.4826v-0.459s0.4588 0.1692 0.2895-0.2174c-0.097-0.4101-0.1451-1.3275-0.1451-1.6897 0-0.338-0.1444-1.7136 0.2414-2.2455 0.3623-0.5308 0.7967-1.3997 1.159-1.9309 0.3863-0.5312 1.1828-1.1106 1.1828-1.1106s0.7967 0.169 1.1349 0.4826c0.2898 0.266 1.3518 1.714 1.5932 2.0281 0.2414 0.2653 0.3136-0.386 0.3136-0.386s0.2898-0.6762 0.6764-0.4829c0.362 0.2655 1.0622 0.6757 1.231 1.0138 0.1689 0.3859 1.1108 1.4967 1.3041 1.9796 0.1925 0.4585 0.8205 1.1344 0.8205 1.1344l0.1692-0.7 0.3137 0.7486v-0.3866l0.4344 0.6759s0.169 0.3387 0.6037 0.5074c0.4588 0.1447 1.5451 0.8933 1.9314 1.0382 0.362 0.193 1.8349 0.6034 2.3415 0.9654 0.5072 0.3866 0.5072 0.1211 1.0625 0.7005 0.555 0.6272 1.3761 1.2793 1.3761 1.2793l0.1689-0.4826 0.3134 0.9173 0.1936-0.7488 0.0965 1.0143s0.3377 0.5312 0.5553 1.0136c0.2652 0.4588 0.7721 1.2071 0.8689 1.4728 0.1208 0.3382 0.3866 1.3521 0.3866 1.3521s1.2071 1.3274 1.714 1.6902c0.4829 0.3617 1.2548 0.7485 1.8828 1.0135 0.6036 0.3137 2.8246 1.3761 3.3077 1.8106 0.5069 0.4106 0.7483 0.5312 0.7483 0.5312s0.4588-0.0484 0.7484 0.0486c0.3136 0.1204 1.1349 0.5305 1.352 0.8444 0.2652 0.2901 0.7729 0.8211 0.7729 0.8211s-0.3385 0.5312-0.6521 1.0622c-0.2662 0.5314-0.8448 1.0138-1.1592 1.2073-0.3136 0.1688-0.6032 0.2896-0.6032 0.2896s0.362 0-0.4588 0.5315c-0.7967 0.5307-1.9793 1.1584-2.5829 1.255-0.604 0.1208-3.1385 0-3.5732 0h-2.4145c-0.8449 0-1.4965-0.0482-2.3175-0.0482-0.7724 0-1.7865 0-2.2931 0.5794-0.4831 0.6032-0.7486-0.1449-1.4729 0.7724-0.7483 0.9416-1.3518 1.4247-1.5451 1.8351-0.1932 0.4342-1.5453 3.138-2.0279 4.4898-0.4828 1.3525-1.183 3.5975-1.183 3.5975s-0.5067 3.1628-0.5067 4.5146 0.241 2.7038 0 3.8385c-0.1084 0.5083-0.1685 1.6916-0.2015 2.8421 0.7213 2.0651 1.996 5.4849 0.8529-2.8903-0.0961-0.7245 1.6177-0.9897 2.2209-1.545 0.7967 1.8589 2.3423 21.848 3.139 23.707 1.3758 3.0658 1.6413-11.975 3.2586-8.981 0.266 0.5553 0-1.1831 0-1.7624 0-24.721-0.8206-1.7622 4.0082 8.812 0-4.9663 0.0097-8.2088 0.0729-10.199-0.3484 0.3095-0.6526 0.5903-0.6526 0.5903l0.6791-1.2907c0.0007-0.0173 0.0019-0.0328 0.0027-0.0498l-1.0199 0.8575 0.5074-1.6416-0.8695 0.7967 0.9896-1.8108-1.0618 0.9176 0.5794-1.2553 1.3999-2.0765-0.6272 0.5066 1.9795-2.5827 1.8105-1.811-0.5793 0.3139 0.917-1.2312 0.5799-0.8208 0.4342-2.511-0.5067-0.4821 0.4102-0.6764-1.1826 0.1692s1.2791-1.9071 1.593-2.4867c0.3141-0.5798 2.5105-2.6559 2.5105-2.6559v-0.4826s0.459-0.917 0.6523-1.9073c0.1449-1.0141 1.062-2.5832 1.062-2.5832l-0.5551 0.0965 0.6275-0.8205-0.9173-0.3623 1.0138-1.5691s0.6759-2.076 1.0625-3.066c0.3866-0.9898 1.1347-2.4867 1.5691-3.0658 0.4107-0.5799 2.3177-2.1245 2.7281-2.487 0.4102-0.3379 1.2314-0.9175 1.2314-0.9175l1.6655-0.7238-0.8206-0.435 4.0556-0.2168-2.8244-0.604 3.3313-0.5071-1.6654-0.1687 1.9071-0.6278s1.4966-0.5071 2.2455-0.5794c0.7481-0.1208 0.8927-0.917 2.4621-1.2071 1.5691-0.2171 2.9936 0.2901 3.573 0.0966 0.5791-0.1693 7.6292-1.7381 8.0394-1.8104 0.4104-0.0727 1.9792-0.3381 2.414-0.4344 0.4347-0.0486 1.7381-0.5556 1.7381-0.5556s0.6763-0.2655 1.4971-0.3622c0.8208-0.0725 0.6032-0.4826 0.6032-0.4826l1.7867-0.4104 0.5796-0.3144 0.9171-0.2898 0.5072-0.6511 2.6554 0.5065 0.1933-1.1588 1.2071 1.1588v-1.3275l2.0033 1.5691 0.266-1.8827 1.0622 1.3034-0.1687-0.9176 1.8101 0.9898 0.2657-1.3034 1.2314 1.1103-0.0727-1.1103 0.7732 1.5448-0.073-1.8103 0.8692 1.5443s-0.0241-1.2788-0.0963-1.5925c-0.0481-0.2662 0.9655 2.5103 0.9655 2.5103s0-0.8689-0.1206-1.5451c-0.1206-0.6515 1.3034 2.318 1.3034 2.318s0-2.8246-0.0482-3.0904c-0.0481-0.3138 0.4107 1.8592 0.4826 2.5108 0.0246 0.628 0-0.821-0.1206-1.6175-0.1449-0.7724 1.2312 1.7381 1.2312 1.7381s0.0482-0.8206 0-1.0858c-0.0722-0.3144 0.8694 2.6308 0.8694 2.6308l0.0482-1.0376 0.5553 0.8205-0.0484-2.0522 0.7483 3.1626 0.1209-1.4242 0.3861 1.6899 0.3863-0.5071 1.6172 1.014 0.3387-0.893 0.5065 1.4724 0.3141-0.7727 0.7242 1.1831 0.3866-0.7724 0.5067 1.0627 0.7002-0.822-0.1206 1.087 0.4583-0.9176 0.3141 1.0384 0.4345-1.0865v1.0865l0.4585-1.0384 0.3866 1.4488 0.7242-1.8105s-0.0967 1.617-0.1449 1.907c-0.0724 0.2898 0.5067-0.5069 0.6516-0.7967 0.1208-0.2895 0 1.0865 0 1.0865l0.6278-1.0865 0.1449 0.8933 0.3622-0.5315 0.2657 1.1349 0.6514-0.7965 0.266 0.8933 0.5071-0.7002 0.4099 0.7729 0.3623-0.4591v0.7002l0.5553-0.8208-0.0968 0.8933 0.7729-0.8449 0.1687 1.4486 0.4591-0.7245-0.0482 0.7726 0.6032-0.6277 0.1452 0.7481 0.651-0.6278 0.7486 0.7491s2.052-0.3866 2.4629-0.5796c0.4104-0.1695 2.4383-0.797 2.8005-0.8935 0.3621-0.1449 0.893-0.1931 1.6173-0.3137 0.6518-0.0965 1.7627-0.5069 1.7627-0.5069s0.4828 0.1206 0.4828 0.6275c0 0.507-0.5317 0.6519-0.9173 1.0866-0.3144 0.4583-0.5317 0.7964-0.5317 0.7964s-0.2655 0.9657-0.6032 1.9071c-0.3136 0.9173-0.4347 0.8215-0.4347 0.8215l0.0724 0.5303-0.5553 0.4349v0.6037l-0.6761 0.5067 0.3139 0.8451-0.3139-0.1206 0.3139 0.8935-0.4345-0.3141 0.3136 0.555h-0.6515l0.4101 0.3623-0.7721 0.1692s0.6036 0.7483 0.8205 1.2069c0.2417 0.4585 0.4345 0.8451 0.5796 1.3034 0.1687 0.4587 0.8933 1.9313 0.9655 2.5593 0.0486 0.6275 0.29 2.3418 0.29 2.3418s-0.4104 1.3037-0.5069 1.6416c-0.0968 0.3623-1.0143 0.8692-1.0143 0.8692s-0.3623 0.8448-0.5308 1.3758c-0.1932 0.5069-0.4347 0.9659-0.4347 0.9659l-0.3865 0.7243s0.2657 1.2555 0.2176 1.6657c-0.0725 0.4106 0.2414 0.9654 0.4104 1.6659 0.1932 0.6758 1.9552 3.4762 2.2452 3.9349 0.2896 0.4586 0.5791 1.3521 0.6275 1.7624 0.0482 0.3864-0.0965 0.2899-0.0965 0.2899l0.3625 0.2895 0.4345 0.7245s-0.1933 0.4586-0.5313 0.7481c-0.3143 0.2898-1.7142 1.3761-2.1973 1.7624-0.5551 0.4104-0.7243 0.4588-1.0861 0.6278-0.4347 0.1687-2.0038 0.4104-2.4869 0.459-0.4585 0.072-1.6411-0.2178-2.0033-0.3382-0.3385-0.1208-0.604-0.2898-0.604-0.2898l-0.4831-0.1206-0.2168-0.4344-0.7486-0.1211-1.0136-0.9657-2.1247-1.3275-0.7245-0.3863-0.3861-0.6761-0.6518 0.2659-0.5793-0.7488-0.5553 0.8208-0.531-0.2895-0.0484 0.8451-0.5069-0.6759 0.1206 1.0138-0.6273-0.6761v0.9657l-0.5317-0.5551 0.4588 0.9655-1.2555-0.5308 0.2416 1.2548s-1.4244-0.4342-1.7864-0.6757c-0.3137-0.1932-0.0484 0.869-0.0484 0.869l-0.6757-0.7484v0.8451l-0.4108-0.6277 0.1208 0.7965-0.4588-0.7243v1.159s-0.5791-0.4826-0.8446-0.9417c-0.2898-0.4582 0 1.3039 0 1.3039l-0.7-1.1346v1.0865l-0.8212-1.2558-0.0723 0.9417-0.5796-0.9893-0.1205 0.6751-0.4586-0.8448-0.266 0.5071-0.6999-0.748s0.2898 2.2204 0.3382 2.5827c0.0479 0.3379-0.7241-1.6654-0.7241-1.6654l0.5308 2.0519-0.5308-0.1689 0.7241 2.1003-0.5794-0.628 0.6273 2.5832-0.6273-0.8689 0.5794 1.9557s-0.4104-0.2417-0.2901 0.2174c0.1449 0.4585 0.1449 0.7724 0.1449 1.8586 0 1.0623 0.1452 3.935 0.1452 5.1905 0 1.2312 0.1933 4.4662 0.3865 5.8909 0.1688 1.4243 1.5932 4.1278 1.5932 4.1278s0.7241 1.4247 1.6173 2.4867l0.5752 0.1335c0.7479-1.4002 0.318-7.9733 0.318-14.04 0.8211 2.3422 2.4143 5.2875 2.4143 7.6533 0.6275-0.6999-0.4347 11.25-0.2174 10.598 3.4281-9.5847 2.8971-14.292 4.9977-9.4155 0-28.849 0.8205 1.7624 2.3897 10.599 0-4.7317 0.8456-9.4394 0-13.544 6.4457 1.7622 3.2109-3.5489 3.2109-10.019 2.414 4.7076 3.2348 10.019 4.0077 14.726 0-2.3658 1.5934-5.8904 1.5934-8.8359 0 7.6529 0 30.612 3.1867-0.5793 1.6418 13.52 0 16.465 3.2109 2.3422 0.7484-3.8875 0.7967 4.3211 1.4967 8.7151v0.6017c-2.2367 6.5561-5.2179 12.77-8.8349 18.55l-17.697 0.3061h-134.23c-1.5159-2.4012-2.9212-4.8779-4.2085-7.4239 0.4714-1.8754 1.1453-3.9046 1.1453-5.444 0 1.183 0.797 3.5248 2.4143 4.7076 0-12.361-1.6173-5.8904 3.1868-2.3415v-3.5489zm-11.564-4.8051v-4.6104c0.3382 1.7865 0.7241 3.404 1.1106 4.756 1.6414-8.1843 1.8347-5.7455 1.9314-0.6761 0.0669 2.6498 0.1126 6.0183 0.3363 8.9805-1.2636-2.7456-2.3934-5.5646-3.3783-8.45zm76.011-19.77c0.0112 0.027 0.0226 0.054 0.034 0.0809l0.0506-0.1553-0.0846 0.0744zm0.157 2.0449c0.0161 0.1872 0.0338 0.3795 0.0533 0.5772l0.7191-1.1274-0.7724 0.5502zm0.0652 0.6961c0.5801 5.727 2.5178 15.489 2.5178 19.492 0-3.5253-1.6175-10.019 0.8208-5.3111l1.5694 4.128c-0.2899-5.2147-1.1831-10.936-1.5694-15.306 0.6034 4.0558 2.0279 8.7151 3.2831 13.085 0.6035 2.0036 0.6035 4.104 1.4974 5.7458-0.8455-5.9872-1.5693-10.84-2.1492-14.727-0.4758-3.2842-0.8516-5.863-1.1415-7.8515-0.1799 0.5353-0.4033 1.8159-0.4033 1.8159l0.2653-1.4969-1.762 1.7383 0.7724-1.0622 0.5794-1.086-1.9798 0.0962-0.9416 1.0627-0.7481 0.3377 0.6035-1.6656-1.2142 1.0046zm4.9806-0.9616c0.5211 2.9178 1.1991 6.5656 1.8828 9.7345 0.724 3.6213 1.5212 6.6147 2.0279 7.1936 0-5.3106-1.545-11.781-3.1628-16.488 0.4831 1.2796 1.4485 1.0381 2.2934 3.6695 0.4349 1.3765 0.8208 3.5489 1.0865 7.1221 0.1333 1.8455 0.6895 3.749 1.0547 5.5909 0.1058-0.5845 0.2008-1.1605 0.2008-1.3421 0-0.0449 0.0034-0.1016 0.0107-0.1699-0.3673-6.9575-1.4415-11.311 0.2969-6.9962 0.2429-1.5601 0.7247-3.9962 0.7787-4.3736 0.0968-0.4828 1.2555-1.9075 1.9071-2.3177 0.6761-0.4106 1.8351-1.4966 1.7383-1.9792-0.0722-0.5077-0.0722-0.6764-0.1692-1.4972-0.0722-0.8451-1.1587-5.9872-1.3275-6.3971-0.1446-0.4106-1.1587 0.0958-1.1587 0.0958l0.9171 3.6454s0-0.9895-0.072-1.424c-0.0968-0.4109-0.2657 2.4381-0.2657 2.4381l-0.5794-2.6068v2.1001s-0.1692-1.0865-0.1692-1.5932c0-0.5069 0 1.8346-0.1447 2.317-0.1689 0.5069-0.5066-2.6552-0.6761-3.1383-0.169-0.5069 0.0968 3.3077 0.0968 3.3077s-0.4347-2.7281-0.5072-3.6459c-0.0963-0.917-0.0963 3.4048-0.2414 3.9834-0.1687 0.5798-0.338-3.8139-0.5067-4.5622-0.1692-0.7486 0 4.6349 0 4.6349s-0.4109-3.307-0.5796-3.9834c-0.1692-0.6515 0.3382 5.6493 0.3382 5.6493s-0.8456-2.4626-0.9176-2.8971c-0.0962-0.4101-0.0962 2.1485-0.1692 2.5591-0.0722 0.4104-0.2412-1.0619-0.3136-1.4971-0.073-0.4104-0.1687 1.7629-0.1687 1.7629l-0.4107-1.159-0.0722 2.3177-0.4109-1.3279-0.6759 1.4004-0.5069-0.9176 0.2655 1.8346-0.9659-1.1587-0.2893 1.4969s-0.2174-0.8453-0.4102-1.3277c-0.0073-0.0253-0.0155-0.0425-0.0241-0.0535zm5.4164 18.233c0.0437 0.3496 0.0746 0.6956 0.0875 1.0374 0-0.353-0.0032-0.7026-0.0085-1.0485l-0.079 0.0111zm9.584-1.3002l0.112 0.5752-0.0354-0.5771-0.0766 0.0019zm0.4668-8.0929l3.6045 13.376c3.2351-3.5244 0-6.4701 6.446-7.6531l-0.8451-14.123 2.6328 11.214c0.2764-0.6526 0.417-1.546 0.6506-1.9917 0.2171-0.4831 0.1452-0.4831 0.3382-0.9893 0.1687-0.5076 0.1687-2.246 0.0722-2.9945-0.0722-0.7481-0.3377-5.8905-0.3377-6.88 0-0.9898-0.2417-0.9898-0.2417-0.9898l0.5794-1.4969-0.821 0.5796 0.4833-1.7383-0.5798 0.7486s0.1453-1.2553 0.3381-2.0036c0.169-0.7248-0.3381-2.1485-0.3381-2.1485l-0.8454 0.4099-0.0722-0.8205-0.6516 1.3999 0.0725-1.2312-0.6521 0.1687s-0.4101 1.2317-0.6756 1.6418c-0.2417 0.4347-2.0763 3.742-2.2212 4.3213-0.1931 0.5794-0.7724 1.159-1.859 1.8349-1.0379 0.6521-3.6933 3.4767-3.6933 3.4767s-0.5074 1.5691-0.6761 1.9793c-0.1228 0.2757-0.4597 2.0799-0.7077 3.9099zm13.341 8.7656c2.3756 1.8327 5.5019 6.446 7.0908 10.501 0-5.8904 2.3904-10.598 2.3904-16.488 0.8205 3.5248 2.3892 7.6528 3.9828 11.178 0-11.178-5.6008-52.943 1.6175-4.104 0 3.5244-0.7724-13.544 0-10.019 1.6178 6.4698 2.3905 20.013 2.3905 4.1278 0 0.5794 1.5932 6.47 1.5932 8.2325l-0.7727-12.36c8.0153 27.087 3.1871 7.073 1.5691-1.7629-0.7964-3.5246 0.8449 3.5249 0.8449 7.0735 6.3738 34.137-4.0072-34.74 3.1871 5.2872l-1.2156-12.118c-0.0657-0.2616-0.1201-0.4789-0.1602-0.629-0.2176-1.014-0.3139-2.9211-0.3139-2.9211l-0.4106 0.9173s0-1.4006-0.1933-2.1485c-0.1692-0.7486-1.2312-2.6559-1.3764-3.2355-0.1928-0.5789-1.0138-1.3999-1.0138-1.3999l-0.4826 0.3139s-0.193-1.1588-0.1206-1.6416c0.1206-0.5069-0.0724-3.5005-0.0724-3.5005l-0.9178 0.99v-0.7248l-1.231 0.6521-0.0724-0.7486-0.99 0.7486v-0.7486l-1.159 0.5791-1.7619 0.9176 0.2655-0.9898-2.752 1.159v-0.8446l-1.014 1.086v-1.086l-0.7248 1.255v-1.3277l-0.8446 1.0863s-0.5064 1.4001-0.9895 2.8246c-0.5072 1.3999-1.1349 8.9567-1.1349 8.9567l-0.0966 3.8864s-0.5791 2.0765-1.1833 2.9938c-0.5793 0.9176-1.0622 1.9798-1.7137 2.7281-0.5337 0.6127-1.4882 0.9993-2.2142 1.3046zm24.236-5.1688l1.024 5.3149 0.3958-1.3539s-0.6515-1.6654-0.9895-2.9214c-0.1784-0.7007-0.3032-0.8925-0.4303-1.0396zm-111.81 14.564c0.1028 1.131 0.2064 2.2671 0.3146 3.4475 0-1.1825-0.0338-2.3398-0.0824-3.4662l-0.2322 0.0187zm2.3097-14.847c0.139 1.2198 0.2796 2.2518 0.4191 2.9887 1.6897-1.2314 1.3763-4.1042 1.4242-7.1948 0.0168-1.456-0.0595-2.9588-0.1726-4.3594l-0.576-2.5451-0.4823 2.2453-0.2176-4.7315-0.4826 2.7036v2.704s0.7002 1.352 0.4826 2.7038c-0.2071 1.1631-0.2368 4.007-0.3948 5.4854zm2.8073-7.7579c0.2373 0.9249 0.503 1.953 0.7987 3.0935 0-0.5023 0.0639-1.1001 0.1566-1.7534l-0.8327-3.1234-0.1226 1.7833zm1.2446 0.5235c-0.0484 3.4647 0.3508 6.5539 0.3508 9.0639 0-8.8361-0.7967-13.544 0.7727-2.3656 0-4.9768-0.0003-7.9371 0.0544-9.3839l-0.1514-0.9732v4.7319l-0.7-3.8144-0.3265 2.7413zm1.5917-2.8222c0.4238 2.184 1.2302 7.7785 2.7665 13.648 0.4138-2.9474 0.4411-7.4919 0.3752-11.8-0.0649-0.6756-0.1352-1.3418-0.2062-2.0094-0.2417-2.245-0.4588-7.1943-0.4588-7.1943v-3.8385l-0.2416 3.8385-0.2412 4.0558-0.6997-3.1628v4.0563l-0.9657-2.0282 0.2412 4.2732-0.4591-2.0279-0.1106 2.1884zm8.3317 11.048c0.4736-2.1626 0.7201-4.7026 0.8254-7.3186-0.0516 0.3295-0.0978 0.6168-0.1381 0.8422-0.1965 1.2217-0.6095 4.651-0.6873 6.4764zm1.9644-17.213c0.5295 2.653 1.2103 6.0733 2.079 10.398h0.7965c0-6.4701-0.7965-8.8357 0.7967-1.1833 0-4.7074-0.7967-9.3907 1.5934-0.5791 0-1.7865-0.2898-7.6288 0.797-2.9453 0.0488 0.1955 0.0834 0.2816 0.1065 0.2706 0.0051-0.3177 0.0116-0.6029 0.0204-0.8431-0.0426-0.9718-0.1794-2.7143-0.362-4.8691-0.3158-1.9097-0.6679-3.8572-0.5381-4.8185 0.0224-0.1665 0.0421-0.3559 0.0603-0.5628-0.2363-2.5844-0.4869-5.3057-0.7058-7.7905l-0.2956-0.6759-1.8587 1.5932s-1.883 0.8933-1.883 2.2453c0 1.3518 0.6995 2.2691 0 5.1907-0.3153 1.3139-0.4892 2.9951-0.6066 4.5693zm9.884 13.162c0.1133 0.6672 0.186 1.3185 0.186 1.9445l-0.1972-1.9425 0.0112-0.002zm-0.1522-7.6217c0.1111 0.5293 0.2242 1.0625 0.3382 1.599 0.531 2.4629 1.0617 4.9736 1.5694 7.3636 0-11.178-3.9598-30.008 3.2345-3.5249 0-6.5126-4.7801-30.618 0.7931-12.436-0.098-1.3056-0.142-2.3323-0.0686-2.6771 0.2415-1.0862-0.4585-4.7314-0.7004-6.0834-0.2412-1.3523-0.9652-4.2732-0.9652-4.2732l-3.7184-0.893s0.2419 2.0277 0.2419 4.49c0 2.4865-0.7245 6.0838-0.7245 7.8945v8.5403z"></path>
                          </g>
                        </svg>
                        <span>Edit</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="info-box pointer" onClick={openModal}>
                        <svg viewBox="20 100 210 107">
                          <g>
                            <path d="m31.669 182.13c0-10.574-3.1868-37.082-3.1868-37.082 0.7967 8.8356 4.7798 18.855 7.1948 27.087 0.9248-1.3625 1.5839-3.6722 2.0517-6.453-0.5174-2.2275-3.0177-11.413-3.0177-12.957 0-1.5935-0.2419-14.871-0.2419-16.899 0-2.0281 1.4009-5.3833 2.3423-8.1114 0.9414-2.6799 2.2447-4.9493 3.2831-6.301 1.062-1.3764 1.4245-1.5451 1.786-1.9071 0.3871-0.3625 0.9903-0.8935 0.9903-0.8935l2.7038 0.0481-1.8828-0.5309 2.8487 0.1205-2.0522-0.6031h3.2834l-2.4142-0.6762 3.6935 0.0239-1.1585-0.4827h3.8382l-3.0417-0.8207 3.0417 0.1446-0.9413-1.0138 2.9211 0.5791-1.6654-1.4724 2.8963 0.7484s-3.5243-1.714-2.5586-1.5453c0.9893 0.1933 3.1142 0.8937 3.1142 0.8937l-1.6657-1.8597 1.4243 1.0146-0.5553-1.1349 2.6072 0.9176-1.0624-1.7384 2.2212 1.4729-0.9896-1.6659 2.5351 1.2068-0.9902-1.617 1.9318 1.0858-0.3865-1.2552 1.2552 1.2552 0.0486-1.6656 1.062 0.8937-0.3139-0.5317 1.0623 0.821-0.1445-1.0138 2.1245 0.7245-0.5072-0.8456 0.9898 0.8456v-0.7245l0.6277 0.628-0.1933-0.7972 0.8694 0.99-0.1935-1.4247 0.8211 1.0867-0.1452-0.7481 0.9416 1.4724s-0.6277-2.0279-0.3617-1.5932c0.2411 0.3861 1.0376 1.2069 1.0376 1.2069l-0.1928-0.9419 0.8206 0.8935s-0.3856-1.5451-0.1928-1.2312c0.1928 0.2896 0.7964 1.1344 0.7964 1.1344l0.1693-0.7967-0.6519-0.7481 1.3518 0.6278s-1.3518-1.3037-1.0384-1.2315c0.3144 0.073 1.3277 0.5315 1.3277 0.5315s-0.893-1.0865-0.4099-0.8451c0.5067 0.2414 0.869 0.531 0.869 0.531l0.0486-0.4826v-0.459s0.4588 0.1692 0.2895-0.2174c-0.097-0.4101-0.1451-1.3275-0.1451-1.6897 0-0.338-0.1444-1.7136 0.2414-2.2455 0.3623-0.5308 0.7967-1.3997 1.159-1.9309 0.3863-0.5312 1.1828-1.1106 1.1828-1.1106s0.7967 0.169 1.1349 0.4826c0.2898 0.266 1.3518 1.714 1.5932 2.0281 0.2414 0.2653 0.3136-0.386 0.3136-0.386s0.2898-0.6762 0.6764-0.4829c0.362 0.2655 1.0622 0.6757 1.231 1.0138 0.1689 0.3859 1.1108 1.4967 1.3041 1.9796 0.1925 0.4585 0.8205 1.1344 0.8205 1.1344l0.1692-0.7 0.3137 0.7486v-0.3866l0.4344 0.6759s0.169 0.3387 0.6037 0.5074c0.4588 0.1447 1.5451 0.8933 1.9314 1.0382 0.362 0.193 1.8349 0.6034 2.3415 0.9654 0.5072 0.3866 0.5072 0.1211 1.0625 0.7005 0.555 0.6272 1.3761 1.2793 1.3761 1.2793l0.1689-0.4826 0.3134 0.9173 0.1936-0.7488 0.0965 1.0143s0.3377 0.5312 0.5553 1.0136c0.2652 0.4588 0.7721 1.2071 0.8689 1.4728 0.1208 0.3382 0.3866 1.3521 0.3866 1.3521s1.2071 1.3274 1.714 1.6902c0.4829 0.3617 1.2548 0.7485 1.8828 1.0135 0.6036 0.3137 2.8246 1.3761 3.3077 1.8106 0.5069 0.4106 0.7483 0.5312 0.7483 0.5312s0.4588-0.0484 0.7484 0.0486c0.3136 0.1204 1.1349 0.5305 1.352 0.8444 0.2652 0.2901 0.7729 0.8211 0.7729 0.8211s-0.3385 0.5312-0.6521 1.0622c-0.2662 0.5314-0.8448 1.0138-1.1592 1.2073-0.3136 0.1688-0.6032 0.2896-0.6032 0.2896s0.362 0-0.4588 0.5315c-0.7967 0.5307-1.9793 1.1584-2.5829 1.255-0.604 0.1208-3.1385 0-3.5732 0h-2.4145c-0.8449 0-1.4965-0.0482-2.3175-0.0482-0.7724 0-1.7865 0-2.2931 0.5794-0.4831 0.6032-0.7486-0.1449-1.4729 0.7724-0.7483 0.9416-1.3518 1.4247-1.5451 1.8351-0.1932 0.4342-1.5453 3.138-2.0279 4.4898-0.4828 1.3525-1.183 3.5975-1.183 3.5975s-0.5067 3.1628-0.5067 4.5146 0.241 2.7038 0 3.8385c-0.1084 0.5083-0.1685 1.6916-0.2015 2.8421 0.7213 2.0651 1.996 5.4849 0.8529-2.8903-0.0961-0.7245 1.6177-0.9897 2.2209-1.545 0.7967 1.8589 2.3423 21.848 3.139 23.707 1.3758 3.0658 1.6413-11.975 3.2586-8.981 0.266 0.5553 0-1.1831 0-1.7624 0-24.721-0.8206-1.7622 4.0082 8.812 0-4.9663 0.0097-8.2088 0.0729-10.199-0.3484 0.3095-0.6526 0.5903-0.6526 0.5903l0.6791-1.2907c0.0007-0.0173 0.0019-0.0328 0.0027-0.0498l-1.0199 0.8575 0.5074-1.6416-0.8695 0.7967 0.9896-1.8108-1.0618 0.9176 0.5794-1.2553 1.3999-2.0765-0.6272 0.5066 1.9795-2.5827 1.8105-1.811-0.5793 0.3139 0.917-1.2312 0.5799-0.8208 0.4342-2.511-0.5067-0.4821 0.4102-0.6764-1.1826 0.1692s1.2791-1.9071 1.593-2.4867c0.3141-0.5798 2.5105-2.6559 2.5105-2.6559v-0.4826s0.459-0.917 0.6523-1.9073c0.1449-1.0141 1.062-2.5832 1.062-2.5832l-0.5551 0.0965 0.6275-0.8205-0.9173-0.3623 1.0138-1.5691s0.6759-2.076 1.0625-3.066c0.3866-0.9898 1.1347-2.4867 1.5691-3.0658 0.4107-0.5799 2.3177-2.1245 2.7281-2.487 0.4102-0.3379 1.2314-0.9175 1.2314-0.9175l1.6655-0.7238-0.8206-0.435 4.0556-0.2168-2.8244-0.604 3.3313-0.5071-1.6654-0.1687 1.9071-0.6278s1.4966-0.5071 2.2455-0.5794c0.7481-0.1208 0.8927-0.917 2.4621-1.2071 1.5691-0.2171 2.9936 0.2901 3.573 0.0966 0.5791-0.1693 7.6292-1.7381 8.0394-1.8104 0.4104-0.0727 1.9792-0.3381 2.414-0.4344 0.4347-0.0486 1.7381-0.5556 1.7381-0.5556s0.6763-0.2655 1.4971-0.3622c0.8208-0.0725 0.6032-0.4826 0.6032-0.4826l1.7867-0.4104 0.5796-0.3144 0.9171-0.2898 0.5072-0.6511 2.6554 0.5065 0.1933-1.1588 1.2071 1.1588v-1.3275l2.0033 1.5691 0.266-1.8827 1.0622 1.3034-0.1687-0.9176 1.8101 0.9898 0.2657-1.3034 1.2314 1.1103-0.0727-1.1103 0.7732 1.5448-0.073-1.8103 0.8692 1.5443s-0.0241-1.2788-0.0963-1.5925c-0.0481-0.2662 0.9655 2.5103 0.9655 2.5103s0-0.8689-0.1206-1.5451c-0.1206-0.6515 1.3034 2.318 1.3034 2.318s0-2.8246-0.0482-3.0904c-0.0481-0.3138 0.4107 1.8592 0.4826 2.5108 0.0246 0.628 0-0.821-0.1206-1.6175-0.1449-0.7724 1.2312 1.7381 1.2312 1.7381s0.0482-0.8206 0-1.0858c-0.0722-0.3144 0.8694 2.6308 0.8694 2.6308l0.0482-1.0376 0.5553 0.8205-0.0484-2.0522 0.7483 3.1626 0.1209-1.4242 0.3861 1.6899 0.3863-0.5071 1.6172 1.014 0.3387-0.893 0.5065 1.4724 0.3141-0.7727 0.7242 1.1831 0.3866-0.7724 0.5067 1.0627 0.7002-0.822-0.1206 1.087 0.4583-0.9176 0.3141 1.0384 0.4345-1.0865v1.0865l0.4585-1.0384 0.3866 1.4488 0.7242-1.8105s-0.0967 1.617-0.1449 1.907c-0.0724 0.2898 0.5067-0.5069 0.6516-0.7967 0.1208-0.2895 0 1.0865 0 1.0865l0.6278-1.0865 0.1449 0.8933 0.3622-0.5315 0.2657 1.1349 0.6514-0.7965 0.266 0.8933 0.5071-0.7002 0.4099 0.7729 0.3623-0.4591v0.7002l0.5553-0.8208-0.0968 0.8933 0.7729-0.8449 0.1687 1.4486 0.4591-0.7245-0.0482 0.7726 0.6032-0.6277 0.1452 0.7481 0.651-0.6278 0.7486 0.7491s2.052-0.3866 2.4629-0.5796c0.4104-0.1695 2.4383-0.797 2.8005-0.8935 0.3621-0.1449 0.893-0.1931 1.6173-0.3137 0.6518-0.0965 1.7627-0.5069 1.7627-0.5069s0.4828 0.1206 0.4828 0.6275c0 0.507-0.5317 0.6519-0.9173 1.0866-0.3144 0.4583-0.5317 0.7964-0.5317 0.7964s-0.2655 0.9657-0.6032 1.9071c-0.3136 0.9173-0.4347 0.8215-0.4347 0.8215l0.0724 0.5303-0.5553 0.4349v0.6037l-0.6761 0.5067 0.3139 0.8451-0.3139-0.1206 0.3139 0.8935-0.4345-0.3141 0.3136 0.555h-0.6515l0.4101 0.3623-0.7721 0.1692s0.6036 0.7483 0.8205 1.2069c0.2417 0.4585 0.4345 0.8451 0.5796 1.3034 0.1687 0.4587 0.8933 1.9313 0.9655 2.5593 0.0486 0.6275 0.29 2.3418 0.29 2.3418s-0.4104 1.3037-0.5069 1.6416c-0.0968 0.3623-1.0143 0.8692-1.0143 0.8692s-0.3623 0.8448-0.5308 1.3758c-0.1932 0.5069-0.4347 0.9659-0.4347 0.9659l-0.3865 0.7243s0.2657 1.2555 0.2176 1.6657c-0.0725 0.4106 0.2414 0.9654 0.4104 1.6659 0.1932 0.6758 1.9552 3.4762 2.2452 3.9349 0.2896 0.4586 0.5791 1.3521 0.6275 1.7624 0.0482 0.3864-0.0965 0.2899-0.0965 0.2899l0.3625 0.2895 0.4345 0.7245s-0.1933 0.4586-0.5313 0.7481c-0.3143 0.2898-1.7142 1.3761-2.1973 1.7624-0.5551 0.4104-0.7243 0.4588-1.0861 0.6278-0.4347 0.1687-2.0038 0.4104-2.4869 0.459-0.4585 0.072-1.6411-0.2178-2.0033-0.3382-0.3385-0.1208-0.604-0.2898-0.604-0.2898l-0.4831-0.1206-0.2168-0.4344-0.7486-0.1211-1.0136-0.9657-2.1247-1.3275-0.7245-0.3863-0.3861-0.6761-0.6518 0.2659-0.5793-0.7488-0.5553 0.8208-0.531-0.2895-0.0484 0.8451-0.5069-0.6759 0.1206 1.0138-0.6273-0.6761v0.9657l-0.5317-0.5551 0.4588 0.9655-1.2555-0.5308 0.2416 1.2548s-1.4244-0.4342-1.7864-0.6757c-0.3137-0.1932-0.0484 0.869-0.0484 0.869l-0.6757-0.7484v0.8451l-0.4108-0.6277 0.1208 0.7965-0.4588-0.7243v1.159s-0.5791-0.4826-0.8446-0.9417c-0.2898-0.4582 0 1.3039 0 1.3039l-0.7-1.1346v1.0865l-0.8212-1.2558-0.0723 0.9417-0.5796-0.9893-0.1205 0.6751-0.4586-0.8448-0.266 0.5071-0.6999-0.748s0.2898 2.2204 0.3382 2.5827c0.0479 0.3379-0.7241-1.6654-0.7241-1.6654l0.5308 2.0519-0.5308-0.1689 0.7241 2.1003-0.5794-0.628 0.6273 2.5832-0.6273-0.8689 0.5794 1.9557s-0.4104-0.2417-0.2901 0.2174c0.1449 0.4585 0.1449 0.7724 0.1449 1.8586 0 1.0623 0.1452 3.935 0.1452 5.1905 0 1.2312 0.1933 4.4662 0.3865 5.8909 0.1688 1.4243 1.5932 4.1278 1.5932 4.1278s0.7241 1.4247 1.6173 2.4867l0.5752 0.1335c0.7479-1.4002 0.318-7.9733 0.318-14.04 0.8211 2.3422 2.4143 5.2875 2.4143 7.6533 0.6275-0.6999-0.4347 11.25-0.2174 10.598 3.4281-9.5847 2.8971-14.292 4.9977-9.4155 0-28.849 0.8205 1.7624 2.3897 10.599 0-4.7317 0.8456-9.4394 0-13.544 6.4457 1.7622 3.2109-3.5489 3.2109-10.019 2.414 4.7076 3.2348 10.019 4.0077 14.726 0-2.3658 1.5934-5.8904 1.5934-8.8359 0 7.6529 0 30.612 3.1867-0.5793 1.6418 13.52 0 16.465 3.2109 2.3422 0.7484-3.8875 0.7967 4.3211 1.4967 8.7151v0.6017c-2.2367 6.5561-5.2179 12.77-8.8349 18.55l-17.697 0.3061h-134.23c-1.5159-2.4012-2.9212-4.8779-4.2085-7.4239 0.4714-1.8754 1.1453-3.9046 1.1453-5.444 0 1.183 0.797 3.5248 2.4143 4.7076 0-12.361-1.6173-5.8904 3.1868-2.3415v-3.5489zm-11.564-4.8051v-4.6104c0.3382 1.7865 0.7241 3.404 1.1106 4.756 1.6414-8.1843 1.8347-5.7455 1.9314-0.6761 0.0669 2.6498 0.1126 6.0183 0.3363 8.9805-1.2636-2.7456-2.3934-5.5646-3.3783-8.45zm76.011-19.77c0.0112 0.027 0.0226 0.054 0.034 0.0809l0.0506-0.1553-0.0846 0.0744zm0.157 2.0449c0.0161 0.1872 0.0338 0.3795 0.0533 0.5772l0.7191-1.1274-0.7724 0.5502zm0.0652 0.6961c0.5801 5.727 2.5178 15.489 2.5178 19.492 0-3.5253-1.6175-10.019 0.8208-5.3111l1.5694 4.128c-0.2899-5.2147-1.1831-10.936-1.5694-15.306 0.6034 4.0558 2.0279 8.7151 3.2831 13.085 0.6035 2.0036 0.6035 4.104 1.4974 5.7458-0.8455-5.9872-1.5693-10.84-2.1492-14.727-0.4758-3.2842-0.8516-5.863-1.1415-7.8515-0.1799 0.5353-0.4033 1.8159-0.4033 1.8159l0.2653-1.4969-1.762 1.7383 0.7724-1.0622 0.5794-1.086-1.9798 0.0962-0.9416 1.0627-0.7481 0.3377 0.6035-1.6656-1.2142 1.0046zm4.9806-0.9616c0.5211 2.9178 1.1991 6.5656 1.8828 9.7345 0.724 3.6213 1.5212 6.6147 2.0279 7.1936 0-5.3106-1.545-11.781-3.1628-16.488 0.4831 1.2796 1.4485 1.0381 2.2934 3.6695 0.4349 1.3765 0.8208 3.5489 1.0865 7.1221 0.1333 1.8455 0.6895 3.749 1.0547 5.5909 0.1058-0.5845 0.2008-1.1605 0.2008-1.3421 0-0.0449 0.0034-0.1016 0.0107-0.1699-0.3673-6.9575-1.4415-11.311 0.2969-6.9962 0.2429-1.5601 0.7247-3.9962 0.7787-4.3736 0.0968-0.4828 1.2555-1.9075 1.9071-2.3177 0.6761-0.4106 1.8351-1.4966 1.7383-1.9792-0.0722-0.5077-0.0722-0.6764-0.1692-1.4972-0.0722-0.8451-1.1587-5.9872-1.3275-6.3971-0.1446-0.4106-1.1587 0.0958-1.1587 0.0958l0.9171 3.6454s0-0.9895-0.072-1.424c-0.0968-0.4109-0.2657 2.4381-0.2657 2.4381l-0.5794-2.6068v2.1001s-0.1692-1.0865-0.1692-1.5932c0-0.5069 0 1.8346-0.1447 2.317-0.1689 0.5069-0.5066-2.6552-0.6761-3.1383-0.169-0.5069 0.0968 3.3077 0.0968 3.3077s-0.4347-2.7281-0.5072-3.6459c-0.0963-0.917-0.0963 3.4048-0.2414 3.9834-0.1687 0.5798-0.338-3.8139-0.5067-4.5622-0.1692-0.7486 0 4.6349 0 4.6349s-0.4109-3.307-0.5796-3.9834c-0.1692-0.6515 0.3382 5.6493 0.3382 5.6493s-0.8456-2.4626-0.9176-2.8971c-0.0962-0.4101-0.0962 2.1485-0.1692 2.5591-0.0722 0.4104-0.2412-1.0619-0.3136-1.4971-0.073-0.4104-0.1687 1.7629-0.1687 1.7629l-0.4107-1.159-0.0722 2.3177-0.4109-1.3279-0.6759 1.4004-0.5069-0.9176 0.2655 1.8346-0.9659-1.1587-0.2893 1.4969s-0.2174-0.8453-0.4102-1.3277c-0.0073-0.0253-0.0155-0.0425-0.0241-0.0535zm5.4164 18.233c0.0437 0.3496 0.0746 0.6956 0.0875 1.0374 0-0.353-0.0032-0.7026-0.0085-1.0485l-0.079 0.0111zm9.584-1.3002l0.112 0.5752-0.0354-0.5771-0.0766 0.0019zm0.4668-8.0929l3.6045 13.376c3.2351-3.5244 0-6.4701 6.446-7.6531l-0.8451-14.123 2.6328 11.214c0.2764-0.6526 0.417-1.546 0.6506-1.9917 0.2171-0.4831 0.1452-0.4831 0.3382-0.9893 0.1687-0.5076 0.1687-2.246 0.0722-2.9945-0.0722-0.7481-0.3377-5.8905-0.3377-6.88 0-0.9898-0.2417-0.9898-0.2417-0.9898l0.5794-1.4969-0.821 0.5796 0.4833-1.7383-0.5798 0.7486s0.1453-1.2553 0.3381-2.0036c0.169-0.7248-0.3381-2.1485-0.3381-2.1485l-0.8454 0.4099-0.0722-0.8205-0.6516 1.3999 0.0725-1.2312-0.6521 0.1687s-0.4101 1.2317-0.6756 1.6418c-0.2417 0.4347-2.0763 3.742-2.2212 4.3213-0.1931 0.5794-0.7724 1.159-1.859 1.8349-1.0379 0.6521-3.6933 3.4767-3.6933 3.4767s-0.5074 1.5691-0.6761 1.9793c-0.1228 0.2757-0.4597 2.0799-0.7077 3.9099zm13.341 8.7656c2.3756 1.8327 5.5019 6.446 7.0908 10.501 0-5.8904 2.3904-10.598 2.3904-16.488 0.8205 3.5248 2.3892 7.6528 3.9828 11.178 0-11.178-5.6008-52.943 1.6175-4.104 0 3.5244-0.7724-13.544 0-10.019 1.6178 6.4698 2.3905 20.013 2.3905 4.1278 0 0.5794 1.5932 6.47 1.5932 8.2325l-0.7727-12.36c8.0153 27.087 3.1871 7.073 1.5691-1.7629-0.7964-3.5246 0.8449 3.5249 0.8449 7.0735 6.3738 34.137-4.0072-34.74 3.1871 5.2872l-1.2156-12.118c-0.0657-0.2616-0.1201-0.4789-0.1602-0.629-0.2176-1.014-0.3139-2.9211-0.3139-2.9211l-0.4106 0.9173s0-1.4006-0.1933-2.1485c-0.1692-0.7486-1.2312-2.6559-1.3764-3.2355-0.1928-0.5789-1.0138-1.3999-1.0138-1.3999l-0.4826 0.3139s-0.193-1.1588-0.1206-1.6416c0.1206-0.5069-0.0724-3.5005-0.0724-3.5005l-0.9178 0.99v-0.7248l-1.231 0.6521-0.0724-0.7486-0.99 0.7486v-0.7486l-1.159 0.5791-1.7619 0.9176 0.2655-0.9898-2.752 1.159v-0.8446l-1.014 1.086v-1.086l-0.7248 1.255v-1.3277l-0.8446 1.0863s-0.5064 1.4001-0.9895 2.8246c-0.5072 1.3999-1.1349 8.9567-1.1349 8.9567l-0.0966 3.8864s-0.5791 2.0765-1.1833 2.9938c-0.5793 0.9176-1.0622 1.9798-1.7137 2.7281-0.5337 0.6127-1.4882 0.9993-2.2142 1.3046zm24.236-5.1688l1.024 5.3149 0.3958-1.3539s-0.6515-1.6654-0.9895-2.9214c-0.1784-0.7007-0.3032-0.8925-0.4303-1.0396zm-111.81 14.564c0.1028 1.131 0.2064 2.2671 0.3146 3.4475 0-1.1825-0.0338-2.3398-0.0824-3.4662l-0.2322 0.0187zm2.3097-14.847c0.139 1.2198 0.2796 2.2518 0.4191 2.9887 1.6897-1.2314 1.3763-4.1042 1.4242-7.1948 0.0168-1.456-0.0595-2.9588-0.1726-4.3594l-0.576-2.5451-0.4823 2.2453-0.2176-4.7315-0.4826 2.7036v2.704s0.7002 1.352 0.4826 2.7038c-0.2071 1.1631-0.2368 4.007-0.3948 5.4854zm2.8073-7.7579c0.2373 0.9249 0.503 1.953 0.7987 3.0935 0-0.5023 0.0639-1.1001 0.1566-1.7534l-0.8327-3.1234-0.1226 1.7833zm1.2446 0.5235c-0.0484 3.4647 0.3508 6.5539 0.3508 9.0639 0-8.8361-0.7967-13.544 0.7727-2.3656 0-4.9768-0.0003-7.9371 0.0544-9.3839l-0.1514-0.9732v4.7319l-0.7-3.8144-0.3265 2.7413zm1.5917-2.8222c0.4238 2.184 1.2302 7.7785 2.7665 13.648 0.4138-2.9474 0.4411-7.4919 0.3752-11.8-0.0649-0.6756-0.1352-1.3418-0.2062-2.0094-0.2417-2.245-0.4588-7.1943-0.4588-7.1943v-3.8385l-0.2416 3.8385-0.2412 4.0558-0.6997-3.1628v4.0563l-0.9657-2.0282 0.2412 4.2732-0.4591-2.0279-0.1106 2.1884zm8.3317 11.048c0.4736-2.1626 0.7201-4.7026 0.8254-7.3186-0.0516 0.3295-0.0978 0.6168-0.1381 0.8422-0.1965 1.2217-0.6095 4.651-0.6873 6.4764zm1.9644-17.213c0.5295 2.653 1.2103 6.0733 2.079 10.398h0.7965c0-6.4701-0.7965-8.8357 0.7967-1.1833 0-4.7074-0.7967-9.3907 1.5934-0.5791 0-1.7865-0.2898-7.6288 0.797-2.9453 0.0488 0.1955 0.0834 0.2816 0.1065 0.2706 0.0051-0.3177 0.0116-0.6029 0.0204-0.8431-0.0426-0.9718-0.1794-2.7143-0.362-4.8691-0.3158-1.9097-0.6679-3.8572-0.5381-4.8185 0.0224-0.1665 0.0421-0.3559 0.0603-0.5628-0.2363-2.5844-0.4869-5.3057-0.7058-7.7905l-0.2956-0.6759-1.8587 1.5932s-1.883 0.8933-1.883 2.2453c0 1.3518 0.6995 2.2691 0 5.1907-0.3153 1.3139-0.4892 2.9951-0.6066 4.5693zm9.884 13.162c0.1133 0.6672 0.186 1.3185 0.186 1.9445l-0.1972-1.9425 0.0112-0.002zm-0.1522-7.6217c0.1111 0.5293 0.2242 1.0625 0.3382 1.599 0.531 2.4629 1.0617 4.9736 1.5694 7.3636 0-11.178-3.9598-30.008 3.2345-3.5249 0-6.5126-4.7801-30.618 0.7931-12.436-0.098-1.3056-0.142-2.3323-0.0686-2.6771 0.2415-1.0862-0.4585-4.7314-0.7004-6.0834-0.2412-1.3523-0.9652-4.2732-0.9652-4.2732l-3.7184-0.893s0.2419 2.0277 0.2419 4.49c0 2.4865-0.7245 6.0838-0.7245 7.8945v8.5403z"></path>
                          </g>
                        </svg>
                        <span>Create</span>
                      </div>
                    </>
                  )}
                  <div className="info-box">
                    <svg viewBox="0 0 320.66 320.66">
                      <g transform="translate(274.62 -583.47)">
                        <g id="g7869">
                          <path d="m-231.5 611.06c-3.9731 0-7.9374 1.5311-10.969 4.5625-6.0627 6.0627-6.0627 15.875 0 21.938 3.2523 3.2524 7.5864 4.7683 11.844 4.5312l39.375 39.406-39.188 39.188 34.75-11.781 9.6562-9.6562 44.531 44.5-95.375 95.375-5.5 32.625 32.656-5.4688 95.344-95.344 95.438 95.406 32.656 5.4688-5.48-32.7-95.406-95.406 44.5-44.5 9.6875 9.6875 34.75 11.781-39.25-39.25 39.375-39.344c4.2574 0.23709 8.5914-1.2789 11.844-4.5312 6.0627-6.0627 6.0627-15.875 0-21.938-3.0314-3.0314-6.9957-4.5625-10.969-4.5625-3.9731 0-7.9374 1.5311-10.969 4.5625-3.2523 3.2524-4.7683 7.5864-4.5312 11.844l-39.375 39.344-39.188-39.219 11.781 34.781 9.6875 9.6875-44.5 44.5-44.5-44.5 9.625-9.6562 11.781-34.75-39.16 39.16-39.44-39.43c0.21019-4.2275-1.2713-8.5213-4.5-11.75-3.0314-3.0314-7.0269-4.5625-11-4.5625z" />
                        </g>
                      </g>
                    </svg>
                    <span>{attackWolfPack}</span>
                  </div>
                </div>
                <Modal
                  isOpen={modalIsOpen}
                  onAfterOpen={afterOpenModal}
                  onRequestClose={closeModal}
                  ariaHideApp={false}
                  contentLabel="Example Modal"
                >
                  <div className="modal-text">
                    <div className="text-center text-lg font-bold">
                      Do you want to create the wolf pack?
                    </div>
                    {priceCWOLF !== 0 && (
                      <div className="mt-2 text-center">
                        Price of creating the wolf pack {priceCWOLF} CWOLF
                      </div>
                    )}
                    {itemsMaterials.length + itemsWolves.length > 70 ? (
                      <div className="mt-4 text-center text-red-500">
                        The wolf pack will contain many NFTs, so 2 transactions
                        will be made to complete the wolf pack.
                      </div>
                    ) : null}
                  </div>
                  <div className="modal-button-container">
                    <button className="modal-cancel" onClick={closeModal}>
                      Cancel
                    </button>
                    <button
                      className="modal-burn"
                      onClick={() => {
                        createWolfPack();
                      }}
                    >
                      Create
                    </button>
                  </div>
                </Modal>
                <Modal
                  isOpen={modalEditIsOpen}
                  onRequestClose={closeModalEdit}
                  ariaHideApp={false}
                  contentLabel="Example Modal"
                >
                  <div className="modal-text">
                    <div className="text-center text-lg font-bold">
                      Do you want to edit the wolf pack?
                    </div>
                    {priceCWOLF !== 0 && (
                      <div className="mt-2 text-center">
                        Price of edit the wolf pack {priceCWOLF} CWOLF
                      </div>
                    )}
                    {itemsMaterials.length + itemsWolves.length > 70 ? (
                      <div className="mt-4 text-center text-red-500">
                        The wolf pack will contain many NFTs, so 2 transactions
                        will be made to complete the wolf pack.
                      </div>
                    ) : null}
                  </div>
                  <div className="modal-button-container">
                    <button className="modal-cancel" onClick={closeModalEdit}>
                      Cancel
                    </button>
                    <button
                      className="modal-burn"
                      onClick={() => {
                        editWolfPack();
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </Modal>
              </div>
            ) : (
              <></>
            )}
            {props.isEditWolfPack == true ? (
              <div className="flex space-between">
                {itemsMaterials.length > maxMaterials ? (
                  <div className="info-box red">
                    <svg version="1.0" viewBox="0 0 737.000000 643.000000">
                      <g transform="translate(0.000000,643.000000) scale(0.100000,-0.100000)">
                        <path
                          d="M4064 6135 c-347 -252 -382 -275 -419 -275 -22 0 -123 7 -225 15
                                          -101 7 -185 13 -186 12 -3 -5 -358 -533 -360 -536 -3 -4 -604 62 -694 75 -33
                                          5 -52 -8 -360 -241 -179 -136 -330 -249 -337 -252 -9 -4 -184 93 -341 189
                                          l-33 20 -154 -316 -155 -316 -390 0 c-214 0 -390 -2 -390 -4 0 -3 259 -548
                                          575 -1212 l575 -1207 -66 -70 c-149 -158 -258 -374 -300 -594 -22 -116 -22
                                          -320 0 -436 46 -243 153 -445 330 -623 144 -144 275 -228 456 -292 107 -37
                                          170 -50 296 -61 525 -45 1023 265 1215 756 l32 83 529 0 c495 0 529 -1 535
                                          -18 132 -392 464 -699 858 -793 567 -134 1150 154 1381 681 178 408 117 890
                                          -155 1226 -25 31 -56 68 -67 83 l-21 26 583 1224 c321 673 584 1225 584 1227
                                          0 2 -185 5 -411 6 l-411 3 -241 596 -240 595 -199 -88 c-110 -48 -203 -86
                                          -208 -83 -4 2 -62 76 -128 164 l-121 159 -476 276 c-262 152 -478 276 -479
                                          276 -2 0 -174 -124 -382 -275z m2166 -2342 c0 -5 -150 -323 -334 -708 -230
                                          -482 -338 -699 -347 -696 -39 11 -317 12 -391 1 -415 -60 -784 -356 -939 -753
                                          l-28 -72 -528 -3 -529 -2 -33 82 c-137 338 -400 587 -742 702 -126 42 -246 58
                                          -406 54 l-142 -3 -202 425 c-112 234 -262 550 -335 703 l-133 277 2545 0
                                          c1399 0 2544 -3 2544 -7z m-4096 -2019 c195 -48 368 -220 421 -420 21 -76 21
                                          -222 0 -298 -68 -254 -301 -437 -560 -440 -172 -1 -304 53 -425 174 -118 118
                                          -174 251 -174 415 0 200 96 379 262 488 149 98 300 124 476 81z m3341 4 c87
                                          -18 191 -74 263 -143 243 -229 256 -591 29 -831 -120 -127 -252 -186 -422
                                          -187 -210 -1 -389 95 -503 272 -67 103 -87 176 -87 316 0 139 20 213 84 312
                                          140 216 380 315 636 261z"
                        />
                      </g>
                    </svg>
                    <span>
                      {itemsMaterials.length}/{maxMaterials}
                    </span>
                  </div>
                ) : (
                  <div className="info-box">
                    <svg version="1.0" viewBox="0 0 737.000000 643.000000">
                      <g transform="translate(0.000000,643.000000) scale(0.100000,-0.100000)">
                        <path
                          d="M4064 6135 c-347 -252 -382 -275 -419 -275 -22 0 -123 7 -225 15
                                          -101 7 -185 13 -186 12 -3 -5 -358 -533 -360 -536 -3 -4 -604 62 -694 75 -33
                                          5 -52 -8 -360 -241 -179 -136 -330 -249 -337 -252 -9 -4 -184 93 -341 189
                                          l-33 20 -154 -316 -155 -316 -390 0 c-214 0 -390 -2 -390 -4 0 -3 259 -548
                                          575 -1212 l575 -1207 -66 -70 c-149 -158 -258 -374 -300 -594 -22 -116 -22
                                          -320 0 -436 46 -243 153 -445 330 -623 144 -144 275 -228 456 -292 107 -37
                                          170 -50 296 -61 525 -45 1023 265 1215 756 l32 83 529 0 c495 0 529 -1 535
                                          -18 132 -392 464 -699 858 -793 567 -134 1150 154 1381 681 178 408 117 890
                                          -155 1226 -25 31 -56 68 -67 83 l-21 26 583 1224 c321 673 584 1225 584 1227
                                          0 2 -185 5 -411 6 l-411 3 -241 596 -240 595 -199 -88 c-110 -48 -203 -86
                                          -208 -83 -4 2 -62 76 -128 164 l-121 159 -476 276 c-262 152 -478 276 -479
                                          276 -2 0 -174 -124 -382 -275z m2166 -2342 c0 -5 -150 -323 -334 -708 -230
                                          -482 -338 -699 -347 -696 -39 11 -317 12 -391 1 -415 -60 -784 -356 -939 -753
                                          l-28 -72 -528 -3 -529 -2 -33 82 c-137 338 -400 587 -742 702 -126 42 -246 58
                                          -406 54 l-142 -3 -202 425 c-112 234 -262 550 -335 703 l-133 277 2545 0
                                          c1399 0 2544 -3 2544 -7z m-4096 -2019 c195 -48 368 -220 421 -420 21 -76 21
                                          -222 0 -298 -68 -254 -301 -437 -560 -440 -172 -1 -304 53 -425 174 -118 118
                                          -174 251 -174 415 0 200 96 379 262 488 149 98 300 124 476 81z m3341 4 c87
                                          -18 191 -74 263 -143 243 -229 256 -591 29 -831 -120 -127 -252 -186 -422
                                          -187 -210 -1 -389 95 -503 272 -67 103 -87 176 -87 316 0 139 20 213 84 312
                                          140 216 380 315 636 261z"
                        />
                      </g>
                    </svg>
                    <span>
                      {itemsMaterials.length}/{maxMaterials}
                    </span>
                  </div>
                )}
                {itemsWolves.length > maxWolves ? (
                  <div className="info-box red">
                    <svg viewBox="0 0 223.24 294.42">
                      <g transform="translate(-260.22 -345.13)">
                        <path
                          id="path4352"
                          d="m434.08 345.13c-0.97 0-6.14 7.04-11.47 15.62-14.36 23.1-38.51 54.1-43.69 56.09-2.49 0.96-7.43 2.01-10.97 2.32-6.51 0.57-14.52 7.47-32.31 27.81-7.69 8.79-12.88 12.1-26.1 16.66-10.16 3.49-19.04 8.38-23.09 12.71-6.03 6.45-6.31 7.48-3.37 12.41 1.76 2.96 8.93 8.5 15.93 12.28l12.72 6.88-3.19 11.28c-1.76 6.21-3.23 14.68-3.25 18.81-0.01 4.13-2.4 12.33-5.31 18.19-5.61 11.3-13.59 41.66-14.75 56.12-0.41 5.07-20.6 27.24-25.01 27.24h195.33c-0.03-7.72-1.92-18.71-2.94-19.39-2.81-1.86 0.03-30.73 3.62-36.88 4.77-8.14 3.78-22.99-2.5-37.4-4.66-10.7-5.67-16.68-5.69-34.29-0.01-13.62 1.15-23.69 3.19-27.9 1.76-3.63 4.3-13.01 5.66-20.85 2.6-15.02 11.05-32.97 18.03-38.25 7-5.28 10.65-19.47 7.25-28.25-4.01-10.34-8.31-13.84-12.47-10.15-2.41 2.14-4.45 2.19-7.91 0.22-4.08-2.34-4.6-2.02-4.12 2.59 0.3 2.89-0.81 5.8-2.5 6.44-2.39 0.9-2.78-1.05-1.78-8.72 0.71-5.43 0.15-13.45-1.22-17.84-2.42-7.78-14.58-23.75-18.09-23.75z"
                        ></path>
                      </g>
                    </svg>
                    <span>
                      {itemsWolves.length}/{maxWolves}
                    </span>
                  </div>
                ) : (
                  <div className="info-box">
                    <svg viewBox="0 0 223.24 294.42">
                      <g transform="translate(-260.22 -345.13)">
                        <path
                          id="path4352"
                          d="m434.08 345.13c-0.97 0-6.14 7.04-11.47 15.62-14.36 23.1-38.51 54.1-43.69 56.09-2.49 0.96-7.43 2.01-10.97 2.32-6.51 0.57-14.52 7.47-32.31 27.81-7.69 8.79-12.88 12.1-26.1 16.66-10.16 3.49-19.04 8.38-23.09 12.71-6.03 6.45-6.31 7.48-3.37 12.41 1.76 2.96 8.93 8.5 15.93 12.28l12.72 6.88-3.19 11.28c-1.76 6.21-3.23 14.68-3.25 18.81-0.01 4.13-2.4 12.33-5.31 18.19-5.61 11.3-13.59 41.66-14.75 56.12-0.41 5.07-20.6 27.24-25.01 27.24h195.33c-0.03-7.72-1.92-18.71-2.94-19.39-2.81-1.86 0.03-30.73 3.62-36.88 4.77-8.14 3.78-22.99-2.5-37.4-4.66-10.7-5.67-16.68-5.69-34.29-0.01-13.62 1.15-23.69 3.19-27.9 1.76-3.63 4.3-13.01 5.66-20.85 2.6-15.02 11.05-32.97 18.03-38.25 7-5.28 10.65-19.47 7.25-28.25-4.01-10.34-8.31-13.84-12.47-10.15-2.41 2.14-4.45 2.19-7.91 0.22-4.08-2.34-4.6-2.02-4.12 2.59 0.3 2.89-0.81 5.8-2.5 6.44-2.39 0.9-2.78-1.05-1.78-8.72 0.71-5.43 0.15-13.45-1.22-17.84-2.42-7.78-14.58-23.75-18.09-23.75z"
                        ></path>
                      </g>
                    </svg>
                    <span>
                      {itemsWolves.length}/{maxWolves}
                    </span>
                  </div>
                )}
              </div>
            ) : null}
            {(itemsMaterials.length === 0 && itemsWolves.length === 0) ||
            props.isEditWolfPack == true ? (
              <></>
            ) : (
              <div className="flex space-between">
                {itemsMaterials.length > maxMaterials ? (
                  <div className="info-box red">
                    <svg version="1.0" viewBox="0 0 737.000000 643.000000">
                      <g transform="translate(0.000000,643.000000) scale(0.100000,-0.100000)">
                        <path
                          d="M4064 6135 c-347 -252 -382 -275 -419 -275 -22 0 -123 7 -225 15
                                            -101 7 -185 13 -186 12 -3 -5 -358 -533 -360 -536 -3 -4 -604 62 -694 75 -33
                                            5 -52 -8 -360 -241 -179 -136 -330 -249 -337 -252 -9 -4 -184 93 -341 189
                                            l-33 20 -154 -316 -155 -316 -390 0 c-214 0 -390 -2 -390 -4 0 -3 259 -548
                                            575 -1212 l575 -1207 -66 -70 c-149 -158 -258 -374 -300 -594 -22 -116 -22
                                            -320 0 -436 46 -243 153 -445 330 -623 144 -144 275 -228 456 -292 107 -37
                                            170 -50 296 -61 525 -45 1023 265 1215 756 l32 83 529 0 c495 0 529 -1 535
                                            -18 132 -392 464 -699 858 -793 567 -134 1150 154 1381 681 178 408 117 890
                                            -155 1226 -25 31 -56 68 -67 83 l-21 26 583 1224 c321 673 584 1225 584 1227
                                            0 2 -185 5 -411 6 l-411 3 -241 596 -240 595 -199 -88 c-110 -48 -203 -86
                                            -208 -83 -4 2 -62 76 -128 164 l-121 159 -476 276 c-262 152 -478 276 -479
                                            276 -2 0 -174 -124 -382 -275z m2166 -2342 c0 -5 -150 -323 -334 -708 -230
                                            -482 -338 -699 -347 -696 -39 11 -317 12 -391 1 -415 -60 -784 -356 -939 -753
                                            l-28 -72 -528 -3 -529 -2 -33 82 c-137 338 -400 587 -742 702 -126 42 -246 58
                                            -406 54 l-142 -3 -202 425 c-112 234 -262 550 -335 703 l-133 277 2545 0
                                            c1399 0 2544 -3 2544 -7z m-4096 -2019 c195 -48 368 -220 421 -420 21 -76 21
                                            -222 0 -298 -68 -254 -301 -437 -560 -440 -172 -1 -304 53 -425 174 -118 118
                                            -174 251 -174 415 0 200 96 379 262 488 149 98 300 124 476 81z m3341 4 c87
                                            -18 191 -74 263 -143 243 -229 256 -591 29 -831 -120 -127 -252 -186 -422
                                            -187 -210 -1 -389 95 -503 272 -67 103 -87 176 -87 316 0 139 20 213 84 312
                                            140 216 380 315 636 261z"
                        />
                      </g>
                    </svg>
                    <span>
                      {itemsMaterials.length}/{maxMaterials}
                    </span>
                  </div>
                ) : (
                  <div className="info-box">
                    <svg version="1.0" viewBox="0 0 737.000000 643.000000">
                      <g transform="translate(0.000000,643.000000) scale(0.100000,-0.100000)">
                        <path
                          d="M4064 6135 c-347 -252 -382 -275 -419 -275 -22 0 -123 7 -225 15
                                            -101 7 -185 13 -186 12 -3 -5 -358 -533 -360 -536 -3 -4 -604 62 -694 75 -33
                                            5 -52 -8 -360 -241 -179 -136 -330 -249 -337 -252 -9 -4 -184 93 -341 189
                                            l-33 20 -154 -316 -155 -316 -390 0 c-214 0 -390 -2 -390 -4 0 -3 259 -548
                                            575 -1212 l575 -1207 -66 -70 c-149 -158 -258 -374 -300 -594 -22 -116 -22
                                            -320 0 -436 46 -243 153 -445 330 -623 144 -144 275 -228 456 -292 107 -37
                                            170 -50 296 -61 525 -45 1023 265 1215 756 l32 83 529 0 c495 0 529 -1 535
                                            -18 132 -392 464 -699 858 -793 567 -134 1150 154 1381 681 178 408 117 890
                                            -155 1226 -25 31 -56 68 -67 83 l-21 26 583 1224 c321 673 584 1225 584 1227
                                            0 2 -185 5 -411 6 l-411 3 -241 596 -240 595 -199 -88 c-110 -48 -203 -86
                                            -208 -83 -4 2 -62 76 -128 164 l-121 159 -476 276 c-262 152 -478 276 -479
                                            276 -2 0 -174 -124 -382 -275z m2166 -2342 c0 -5 -150 -323 -334 -708 -230
                                            -482 -338 -699 -347 -696 -39 11 -317 12 -391 1 -415 -60 -784 -356 -939 -753
                                            l-28 -72 -528 -3 -529 -2 -33 82 c-137 338 -400 587 -742 702 -126 42 -246 58
                                            -406 54 l-142 -3 -202 425 c-112 234 -262 550 -335 703 l-133 277 2545 0
                                            c1399 0 2544 -3 2544 -7z m-4096 -2019 c195 -48 368 -220 421 -420 21 -76 21
                                            -222 0 -298 -68 -254 -301 -437 -560 -440 -172 -1 -304 53 -425 174 -118 118
                                            -174 251 -174 415 0 200 96 379 262 488 149 98 300 124 476 81z m3341 4 c87
                                            -18 191 -74 263 -143 243 -229 256 -591 29 -831 -120 -127 -252 -186 -422
                                            -187 -210 -1 -389 95 -503 272 -67 103 -87 176 -87 316 0 139 20 213 84 312
                                            140 216 380 315 636 261z"
                        />
                      </g>
                    </svg>
                    <span>
                      {itemsMaterials.length}/{maxMaterials}
                    </span>
                  </div>
                )}
                {itemsWolves.length > maxWolves ? (
                  <div className="info-box red">
                    <svg viewBox="0 0 223.24 294.42">
                      <g transform="translate(-260.22 -345.13)">
                        <path
                          id="path4352"
                          d="m434.08 345.13c-0.97 0-6.14 7.04-11.47 15.62-14.36 23.1-38.51 54.1-43.69 56.09-2.49 0.96-7.43 2.01-10.97 2.32-6.51 0.57-14.52 7.47-32.31 27.81-7.69 8.79-12.88 12.1-26.1 16.66-10.16 3.49-19.04 8.38-23.09 12.71-6.03 6.45-6.31 7.48-3.37 12.41 1.76 2.96 8.93 8.5 15.93 12.28l12.72 6.88-3.19 11.28c-1.76 6.21-3.23 14.68-3.25 18.81-0.01 4.13-2.4 12.33-5.31 18.19-5.61 11.3-13.59 41.66-14.75 56.12-0.41 5.07-20.6 27.24-25.01 27.24h195.33c-0.03-7.72-1.92-18.71-2.94-19.39-2.81-1.86 0.03-30.73 3.62-36.88 4.77-8.14 3.78-22.99-2.5-37.4-4.66-10.7-5.67-16.68-5.69-34.29-0.01-13.62 1.15-23.69 3.19-27.9 1.76-3.63 4.3-13.01 5.66-20.85 2.6-15.02 11.05-32.97 18.03-38.25 7-5.28 10.65-19.47 7.25-28.25-4.01-10.34-8.31-13.84-12.47-10.15-2.41 2.14-4.45 2.19-7.91 0.22-4.08-2.34-4.6-2.02-4.12 2.59 0.3 2.89-0.81 5.8-2.5 6.44-2.39 0.9-2.78-1.05-1.78-8.72 0.71-5.43 0.15-13.45-1.22-17.84-2.42-7.78-14.58-23.75-18.09-23.75z"
                        ></path>
                      </g>
                    </svg>
                    <span>
                      {itemsWolves.length}/{maxWolves}
                    </span>
                  </div>
                ) : (
                  <div className="info-box">
                    <svg viewBox="0 0 223.24 294.42">
                      <g transform="translate(-260.22 -345.13)">
                        <path
                          id="path4352"
                          d="m434.08 345.13c-0.97 0-6.14 7.04-11.47 15.62-14.36 23.1-38.51 54.1-43.69 56.09-2.49 0.96-7.43 2.01-10.97 2.32-6.51 0.57-14.52 7.47-32.31 27.81-7.69 8.79-12.88 12.1-26.1 16.66-10.16 3.49-19.04 8.38-23.09 12.71-6.03 6.45-6.31 7.48-3.37 12.41 1.76 2.96 8.93 8.5 15.93 12.28l12.72 6.88-3.19 11.28c-1.76 6.21-3.23 14.68-3.25 18.81-0.01 4.13-2.4 12.33-5.31 18.19-5.61 11.3-13.59 41.66-14.75 56.12-0.41 5.07-20.6 27.24-25.01 27.24h195.33c-0.03-7.72-1.92-18.71-2.94-19.39-2.81-1.86 0.03-30.73 3.62-36.88 4.77-8.14 3.78-22.99-2.5-37.4-4.66-10.7-5.67-16.68-5.69-34.29-0.01-13.62 1.15-23.69 3.19-27.9 1.76-3.63 4.3-13.01 5.66-20.85 2.6-15.02 11.05-32.97 18.03-38.25 7-5.28 10.65-19.47 7.25-28.25-4.01-10.34-8.31-13.84-12.47-10.15-2.41 2.14-4.45 2.19-7.91 0.22-4.08-2.34-4.6-2.02-4.12 2.59 0.3 2.89-0.81 5.8-2.5 6.44-2.39 0.9-2.78-1.05-1.78-8.72 0.71-5.43 0.15-13.45-1.22-17.84-2.42-7.78-14.58-23.75-18.09-23.75z"
                        ></path>
                      </g>
                    </svg>
                    <span>
                      {itemsWolves.length}/{maxWolves}
                    </span>
                  </div>
                )}
              </div>
            )}
            <Droppable droppableId="items">
              {(droppableProvided) => (
                <>
                  {props.isEditWolfPack ? (
                    <b className="text-center">Edit Wolf Pack</b>
                  ) : (
                    <b className="text-center">Creating Wolf Pack</b>
                  )}
                  {itemsMaterials.length + itemsWolves.length > 70 ? (
                    <div className="text-center text-red-500">
                      The wolf pack will contain many NFTs, so 2 transactions
                      will be made to complete the wolf pack.
                    </div>
                  ) : null}
                  <ul
                    {...droppableProvided.droppableProps}
                    ref={droppableProvided.innerRef}
                    className="item-container mt-4 flex flex-wrap justify-center items-center"
                    style={{
                      maxHeight: "50vh",
                      overflowY: "auto",
                      overflowX: "hidden",
                    }}
                  >
                    {itemsMaterials.length === 0 && itemsWolves.length === 0 ? (
                      <>
                        {props.isEditWolfPack ? (
                          <div className="dragndrop">
                            Drag/Drop or Click on your Materials & Wolves to
                            start edit your wolf pack
                          </div>
                        ) : (
                          <div className="dragndrop">
                            Drag/Drop or Click on your Materials & Wolves to
                            start creating your wolf pack
                          </div>
                        )}
                      </>
                    ) : (
                      <></>
                    )}
                    {itemsMaterials.map((item: any, index: any) => (
                      <li
                        key={index}
                        className="item-item item-item-wolfpack flex w-full md:w-1/2"
                        onClick={() => onDragEnd(["removeMaterials", index])}
                      >
                        <CardGame
                          tokenId={item.tokenId}
                          defense={0}
                          attack={0}
                          level={item.level}
                          size="small"
                          type="material"
                          nothover="nothover"
                          notburn="notburn"
                          isWolfPackCreate={true}
                        />
                        <span className="flex info-num info-num-material">
                          <svg viewBox="0 0 223.24 294.42" className="info-ico">
                            <g transform="translate(-260.22 -345.13)">
                              <path
                                id="path4352"
                                d="m434.08 345.13c-0.97 0-6.14 7.04-11.47 15.62-14.36 23.1-38.51 54.1-43.69 56.09-2.49 0.96-7.43 2.01-10.97 2.32-6.51 0.57-14.52 7.47-32.31 27.81-7.69 8.79-12.88 12.1-26.1 16.66-10.16 3.49-19.04 8.38-23.09 12.71-6.03 6.45-6.31 7.48-3.37 12.41 1.76 2.96 8.93 8.5 15.93 12.28l12.72 6.88-3.19 11.28c-1.76 6.21-3.23 14.68-3.25 18.81-0.01 4.13-2.4 12.33-5.31 18.19-5.61 11.3-13.59 41.66-14.75 56.12-0.41 5.07-20.6 27.24-25.01 27.24h195.33c-0.03-7.72-1.92-18.71-2.94-19.39-2.81-1.86 0.03-30.73 3.62-36.88 4.77-8.14 3.78-22.99-2.5-37.4-4.66-10.7-5.67-16.68-5.69-34.29-0.01-13.62 1.15-23.69 3.19-27.9 1.76-3.63 4.3-13.01 5.66-20.85 2.6-15.02 11.05-32.97 18.03-38.25 7-5.28 10.65-19.47 7.25-28.25-4.01-10.34-8.31-13.84-12.47-10.15-2.41 2.14-4.45 2.19-7.91 0.22-4.08-2.34-4.6-2.02-4.12 2.59 0.3 2.89-0.81 5.8-2.5 6.44-2.39 0.9-2.78-1.05-1.78-8.72 0.71-5.43 0.15-13.45-1.22-17.84-2.42-7.78-14.58-23.75-18.09-23.75z"
                              ></path>
                            </g>
                          </svg>
                          {item.slot}
                        </span>
                      </li>
                    ))}
                    {itemsWolves.map((item: any, index: any) => (
                      <li
                        key={index}
                        className="item-item item-item-wolfpack flex flex w-full md:w-1/2"
                        onClick={() => onDragEnd(["removeWolves", index])}
                      >
                        <CardGame
                          tokenId={item.tokenId}
                          defense={0}
                          attack={0}
                          gender={item.gender}
                          level={item.level}
                          breed={item.breed}
                          size="small"
                          nothover="nothover"
                          notburn="notburn"
                          isWolfPackCreate={true}
                        />
                        <span className="flex info-num info-num-wolf">
                          <svg viewBox="0 0 320.66 320.66" className="info-ico">
                            <g transform="translate(274.62 -583.47)">
                              <g id="g7869">
                                <path d="m-231.5 611.06c-3.9731 0-7.9374 1.5311-10.969 4.5625-6.0627 6.0627-6.0627 15.875 0 21.938 3.2523 3.2524 7.5864 4.7683 11.844 4.5312l39.375 39.406-39.188 39.188 34.75-11.781 9.6562-9.6562 44.531 44.5-95.375 95.375-5.5 32.625 32.656-5.4688 95.344-95.344 95.438 95.406 32.656 5.4688-5.48-32.7-95.406-95.406 44.5-44.5 9.6875 9.6875 34.75 11.781-39.25-39.25 39.375-39.344c4.2574 0.23709 8.5914-1.2789 11.844-4.5312 6.0627-6.0627 6.0627-15.875 0-21.938-3.0314-3.0314-6.9957-4.5625-10.969-4.5625-3.9731 0-7.9374 1.5311-10.969 4.5625-3.2523 3.2524-4.7683 7.5864-4.5312 11.844l-39.375 39.344-39.188-39.219 11.781 34.781 9.6875 9.6875-44.5 44.5-44.5-44.5 9.625-9.6562 11.781-34.75-39.16 39.16-39.44-39.43c0.21019-4.2275-1.2713-8.5213-4.5-11.75-3.0314-3.0314-7.0269-4.5625-11-4.5625z"></path>
                              </g>
                            </g>
                          </svg>
                          {item.attack}
                        </span>
                      </li>
                    ))}
                    {droppableProvided.placeholder}
                  </ul>
                </>
              )}
            </Droppable>
            {priceCWOLF !== 0 && (
              <div>Price of creating the wolf pack {priceCWOLF} CWOLF</div>
            )}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default WolfPackCreate;
