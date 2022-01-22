import * as React from 'react';
import { useEffect, useState } from 'react';

import { MultiCall } from 'eth-multicall';
import { ethers } from 'ethers';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Web3 from 'web3';

import CardGame from '../components/elements/CardGame';
import { useToast } from '../components/toast/ToastProvider';
import { useWeb3modal } from '../context/Web3modal';
import CWolfTokenJSON from '../contracts/CWolfToken.json';
import Market from '../contracts/MarketPlace.json';
import MaterialsNFTJSON from '../contracts/MaterialsNFT.json';
import VariablesJSON from '../contracts/Variables.json';
import WolfsNFTJSON from '../contracts/WolfsNFT.json';
import CenteredFooter from '../footer/CenteredFooter';
import { materialsData, wolvesData } from '../lib/nftsData';
import MainMenu from '../navigation/MainMenu';
import config from '../utils/AppConfig';

function Home() {
  const { t } = useTranslation('common');
  const toasts = useToast();
  const pageLimit = 20;
  // let CheckBoxStatus = new Map<string, boolean>();
  const { web3Provider, address, connect }: any = useWeb3modal();
  const [materialItems, setmaterialItems] = useState([] as any);
  const [materialFilters, setmaterialFilters] = useState([] as any);
  const [wolfItems, setwolfItems] = useState([] as any);
  const [wolfFilters, setwolfFilters] = useState([] as any);
  const [wolfpackItems, setwolfpackItems] = useState([] as any);
  const [filter, setFilter] = useState('Material' as any);
  const [filterTypes, setFilterTypes] = useState([] as any);
  const [genderTypes, setGenderType] = useState([] as any);
  const [breedType, setBreedType] = useState([] as any);
  const [levelType, setLevelType] = useState([] as any);
  const [reloadFlag, setReloadFlag] = useState(false as any);
  const [pageCountMaterial, setPageCountMaterial] = useState([] as any);
  const [pageCountWolf, setPageCountWolf] = useState([] as any);
  const [pageCountWolfPack, setPageCountWolfPack] = useState([] as any);
  const [pageSign, setPageSign] = useState(1 as any);
  const [price, setPrice] = useState('-' as any);
  const [attackRangeMin, setAttackRangeMin] = useState(0 as any);
  const [attackRangeMax, setAttackRangeMax] = useState(1000 as any);
  const [defenseRangeMin, setDefenseRangeMin] = useState(0 as any);
  const [defenseRangeMax, setDefenseRangeMax] = useState(1000 as any);
  const [healthRangeMin, setHealthRangeMin] = useState(0 as any);
  const [healthRangeMax, setHealthRangeMax] = useState(1000 as any);
  const [materialFiltersCount, setmaterialFiltersCount] = useState([] as any);
  const [wolfFiltersCount, setwolfFiltersCount] = useState([] as any);
  const [materialInitItems, setMaterialInitItems] = useState([] as any);
  const [materialInitFilters, setMaterialInitFilters] = useState([] as any);
  const [materialInitFiltersCount, setMaterialInitFiltersCount] = useState(
    [] as any
  );
  const [filtersActiveMaterial, setFiltersActiveMaterial] = useState([
    'button-primary',
  ] as any);
  const [filterNumberActiveMaterial, setFilterNumberActiveMaterial] =
    useState(0);
  const [filterNumberActiveWolf, setFilterNumberActiveWolf] = useState(0);
  const [currentPageMaterial, setCurrentPageMaterial] = useState(1);
  const [currentPageWolf, setCurrentPageWolf] = useState(1);
  const [todosPerPageMaterial, setTodosPerPageMaterial] = useState(40);
  const [pageNumbersMaterial, setPageNumbersMaterial] = useState([] as any);
  const [pageNumbersWolf, setPageNumbersWolf] = useState([] as any);
  const [oneUSDInCWOLF, setOneUSDInCWOLF] = useState(0);
  const [wolfInitItems, setWolfInitItems] = useState([] as any);
  const [wolfInitFilters, setWolfInitFilters] = useState([] as any);
  const [wolfInitFiltersCount, setWolfInitFiltersCount] = useState([] as any);
  const [filtersActiveWolf, setFiltersActiveWolf] = useState([
    'button-primary',
  ] as any);
  const [todosPerPageWolf, setTodosPerPageWolf] = useState(40);
  const filterbuttonprimary = React.useRef(null);

  const changePageMaterial = async (page: number, items: any = null) => {
    let array = [...materialInitFilters];

    if (items != null) {
      array = items;
    }

    const indexOfLastTodo = page * todosPerPageMaterial;
    const indexOfFirstTodo = indexOfLastTodo - todosPerPageMaterial;
    const currentTodos = array.slice(indexOfFirstTodo, indexOfLastTodo);

    const newPageNumbers = [];
    for (let i = 1; i <= Math.ceil(array.length / todosPerPageMaterial); i++) {
      newPageNumbers.push(i);
    }

    setCurrentPageMaterial(page);
    setPageNumbersMaterial(newPageNumbers);
    setmaterialItems(currentTodos);
  };

  const selectFilterMaterial = async (filter: number, page: number = 1) => {
    const filterArray = [];
    for (let i = 0; i < filter; i += 1) {
      filterArray.push('');
    }
    filterArray.push('button-primary');
    let pageActive = 1;
    if (filter !== filtersActiveMaterial) {
      pageActive = page;
    }

    setFiltersActiveMaterial(filterArray);
    setFilterNumberActiveMaterial(filter);
    let materialFinalItems;
    if (filter === 0) {
      materialFinalItems = materialInitItems;
    } else {
      materialFinalItems = materialInitItems.filter(
        (item: any) => item.level === wolvesData.Level[filter - 1]
      );
    }
    // changePageMaterial(pageActive, materialFinalItems);
    changeFilterMaterial({ priceOrder: price }, pageActive, filter, filterTypes);
  };

  const changePageWolf = async (page: number, items: any = null) => {
    let array = [...wolfInitFilters];

    if (items != null) {
      array = items;
    }

    const indexOfLastTodo = page * todosPerPageWolf;
    const indexOfFirstTodo = indexOfLastTodo - todosPerPageWolf;
    const currentTodos = array.slice(indexOfFirstTodo, indexOfLastTodo);

    const newPageNumbers = [];
    for (let i = 1; i <= Math.ceil(array.length / todosPerPageWolf); i++) {
      newPageNumbers.push(i);
    }

    setCurrentPageWolf(page);
    setPageNumbersWolf(newPageNumbers);
    setwolfItems(currentTodos);
  };

  const selectFilterWolf = async (filter: number, page: number = 1) => {
    const filterArray = [];
    for (let i = 0; i < filter; i += 1) {
      filterArray.push('');
    }
    filterArray.push('button-primary');
    setFiltersActiveWolf(filterArray);
    setFilterNumberActiveWolf(filter);

    let pageActive = 1;
    if (filter !== filtersActiveWolf) {
      pageActive = page;
    }

    if (filter === 0) {
      changePageWolf(page, wolfInitItems);
    } else {
      changePageWolf(
        page,
        [...wolfInitItems].filter(
          (item: any) => item.level === wolvesData.Level[filter - 1]
        )
      );
    }
    changeFilterWolf({ priceOrder: price }, pageActive, filter, filterTypes);
  };

  function range(size: number, startAt: number = 0): ReadonlyArray<number> {
    const rangeArray = [];
    for (let i = startAt; i <= size; i += 1) {
      rangeArray.push(i);
    }
    return rangeArray;
  }

  function deleteEventWolf(tokenId: any) {
    const itemsArray = [...wolfItems];
    const index = itemsArray.findIndex((item: any) => item[5] === tokenId);
    itemsArray.splice(index, 1);
    setwolfItems(itemsArray);
  }
  function deleteEventCave(tokenId: any) {
    const itemsArray = [...materialItems];
    const index = itemsArray.findIndex((item: any) => item[1] === tokenId);
    itemsArray.splice(index, 1);
    setmaterialItems(itemsArray);
  }
  function deleteEventWolfPack(tokenId: any) {
    const itemsArray = [...wolfpackItems];
    const index = itemsArray.findIndex((item: any) => item[1] === tokenId);
    itemsArray.splice(index, 1);
    setwolfpackItems(itemsArray);
  }
  const approveNFT = async (tokenInst: any) => {
    tokenInst.methods
      .approve(Market.address, ethers.utils.parseEther('100000000'))
      .send({ from: address })
      .once('transactionHash', () => {
        toasts?.pushInfo('Approving purchase of Market with CWOLF', 6000);
      })
      .then((_tx: any) => {
        toasts?.pushError(
          'You have approved the purchase of Market with CWOLF',
          6000
        );
      })
      .catch((e: any) => {
        if (e.code === 4001) {
          toasts?.pushError(
            'You need to approve the spending of CWOLF in your wallet',
            6000
          );
        }
      });
  };

  const changeFilterMaterial = async (
    filters: any,
    pageActive: number,
    filterRarity: number,
    _filterTypes: any
  ) => {
    let materialFinalItems;
    if (filterRarity === 0) {
      materialFinalItems = materialInitItems;
    } else {
      materialFinalItems = materialInitItems.filter(
        (item: any) => item.level === wolvesData.Level[filterRarity - 1]
      );
    }
    const materialFinalFilters = materialFilters;
    const materialFinalFiltersCount = materialFiltersCount;

    if (_filterTypes.includes('ShowOnlyOwn')) {
      materialFinalItems = materialFinalItems.filter(
        (item: any) => item.sellerAddress === address
      );
    }

    if (filters.priceOrder === 'Low') {
      materialFinalItems = materialFinalItems.sort(
        (a: any, b: any) => b.askingPrice - a.askingPrice
      );
    } else if (filters.priceOrder === 'High') {
      materialFinalItems = materialFinalItems.sort(
        (a: any, b: any) => a.askingPrice - b.askingPrice
      );
    }
    const indexOfLastTodo = pageActive * todosPerPageMaterial;
    const indexOfFirstTodo = indexOfLastTodo - todosPerPageMaterial;
    const currentTodos = materialFinalItems.slice(
      indexOfFirstTodo,
      indexOfLastTodo
    );

    const newPageNumbers = [];
    for (
      let i = 1;
      i <= Math.ceil(materialFinalItems.length / todosPerPageMaterial);
      i += 1
    ) {
      newPageNumbers.push(i);
    }

    setCurrentPageMaterial(pageActive);
    setPageNumbersMaterial(newPageNumbers);
    setmaterialItems(currentTodos);

    setmaterialFilters(materialFinalFilters);
    setmaterialFiltersCount(materialFinalFiltersCount);
    // setmaterialItems(materialFinalItems);
  };

  const changeFilterWolf = async (
    filters: any,
    pageActive: number,
    filterRarity: number,
    _filterTypes: any
  ) => {
    let wolfFinalItems;
    if (filterRarity === 0) {
      wolfFinalItems = wolfInitItems;
    } else {
      wolfFinalItems = wolfInitItems.filter(
        (item: any) => item.level === wolvesData.Level[filterRarity - 1]
      );
    }
    const wolfFinalFilters = wolfFilters;
    const wolfFinalFiltersCount = wolfFiltersCount;

    if (_filterTypes.includes('ShowOnlyOwn')) {
      wolfFinalItems = wolfFinalItems.filter(
        (item: any) => item.sellerAddress === address
      );
    }

    if (filters.priceOrder === 'Low') {
      wolfFinalItems = wolfFinalItems.sort(
        (a: any, b: any) => b.askingPrice - a.askingPrice
      );
    } else if (filters.priceOrder === 'High') {
      wolfFinalItems = wolfFinalItems.sort(
        (a: any, b: any) => a.askingPrice - b.askingPrice
      );
    }

    const indexOfLastTodo = pageActive * todosPerPageWolf;
    const indexOfFirstTodo = indexOfLastTodo - todosPerPageWolf;
    const currentTodos = wolfFinalItems.slice(
      indexOfFirstTodo,
      indexOfLastTodo
    );

    const newPageNumbers = [];
    for (
      let i = 1;
      i <= Math.ceil(wolfFinalItems.length / todosPerPageWolf);
      i += 1
    ) {
      newPageNumbers.push(i);
    }

    setCurrentPageWolf(pageActive);
    setPageNumbersWolf(newPageNumbers);
    setwolfItems(currentTodos);

    setwolfFilters(wolfFinalFilters);
    setwolfFiltersCount(wolfFinalFiltersCount);
    // setwolfItems(wolfFinalItems);
  };

  const selectPrice = async (ev: any) => {
    setPrice(ev.target.value);
    if (ev.target.value !== '') {
      changeFilterMaterial(
        { priceOrder: ev.target.value },
        1,
        filterNumberActiveMaterial,
        filterTypes
      );
      changeFilterWolf(
        { priceOrder: ev.target.value },
        1,
        filterNumberActiveWolf,
        filterTypes
      );
    }
  };

  const selectOwn = (type: any) => {
    let typesFinal;
    if (filterTypes.includes(type)) {
      typesFinal = [...filterTypes].filter((item: any) => item !== type);
      setFilterTypes(typesFinal);
    } else {
      typesFinal = [...filterTypes];
      typesFinal.push(type);
      setFilterTypes(typesFinal);
    }
    changeFilterMaterial(
      { priceOrder: price },
      1,
      filterNumberActiveMaterial,
      typesFinal
    );
    changeFilterWolf(
      { priceOrder: price },
      1,
      filterNumberActiveWolf,
      typesFinal
    );
  };

  const selectFilter = (ev: any) => {
    setFilter(ev.target.value);
  };

  const selectPage = (ev: any) => {
    setPageSign(parseInt(ev.target.value));
  };
  const previousPage = () => {
    if (filter == 'Material') {
      if (pageSign == 1) {
        return;
      }

      const newPage = pageSign - 1;
      setPageSign(newPage);
    }
    if (filter == 'Wolf') {
      if (pageSign == 1) {
        return;
      }

      const newPage = pageSign - 1;
      setPageSign(newPage);
    }
    if (filter == 'WolfPack') {
      if (pageSign == 1) {
        return;
      }

      const newPage = pageSign - 1;
      setPageSign(newPage);
    }
    setReloadFlag(!reloadFlag);
  };
  const nextPage = () => {
    if (filter == 'Material') {
      const maxLength = pageCountMaterial.length;
      if (pageSign == maxLength) {
        return;
      }

      const newPage = pageSign + 1;
      setPageSign(newPage);
    }
    if (filter == 'Wolf') {
      const maxLength = pageCountWolf.length;
      if (pageSign == maxLength) {
        return;
      }

      const newPage = pageSign + 1;
      setPageSign(newPage);
    }
    if (filter == 'WolfPack') {
      const maxLength = pageCountWolfPack.length;
      if (pageSign == maxLength) {
        return;
      }

      const newPage = pageSign + 1;
      setPageSign(newPage);
    }
    setReloadFlag(!reloadFlag);
  };
  const selectGender = (type: any) => {
    if (genderTypes.includes(type)) {
      const gender = genderTypes;
      const genders = gender.filter((item: any) => item !== type);
      setGenderType(genders);
    } else {
      const genders = genderTypes;
      genders.push(type);
      setGenderType(genders);
    }
    setReloadFlag(!reloadFlag);
  };
  const selectBreed = (type: any) => {
    if (breedType.includes(type)) {
      const breed = breedType;
      const breeds = breed.filter((item: any) => item !== type);
      setBreedType(breeds);
    } else {
      const breeds = breedType;
      breeds.push(type);
      setBreedType(breeds);
    }
    setReloadFlag(!reloadFlag);
  };
  const selectLevel = (type: any) => {
    if (levelType.includes(type)) {
      const level = levelType;
      const levels = level.filter((item: any) => item !== type);
      setLevelType(levels);
    } else {
      const level = levelType;
      level.push(type);
      setLevelType(level);
    }
    setReloadFlag(!reloadFlag);
  };
  const selectAttackRangeMin = (ev: any) => {
    setAttackRangeMin(parseInt(ev.target.value));
    setReloadFlag(!reloadFlag);
  };
  const selectAttackRangeMax = (ev: any) => {
    setAttackRangeMax(parseInt(ev.target.value));
    setReloadFlag(!reloadFlag);
  };
  const selectDefenseRangeMin = (ev: any) => {
    setDefenseRangeMin(parseInt(ev.target.value));
    setReloadFlag(!reloadFlag);
  };
  const selectDefenseRangeMax = (ev: any) => {
    setDefenseRangeMax(parseInt(ev.target.value));
    setReloadFlag(!reloadFlag);
  };
  const selectHealthRangeMin = (ev: any) => {
    setHealthRangeMin(parseInt(ev.target.value));
    setReloadFlag(!reloadFlag);
  };
  const selectHealthRangeMax = (ev: any) => {
    setHealthRangeMax(parseInt(ev.target.value));
    setReloadFlag(!reloadFlag);
  };
  async function buyNFT(nft: any) {
    const web3 = new Web3(window.ethereum);
    const MarketInst = new web3.eth.Contract(
      Market.abi as [],
      Market.address as string
    );
    const variablesInst = new web3.eth.Contract(
      VariablesJSON.abi as [],
      VariablesJSON.address as string
    );
    const signer = web3Provider.getSigner();
    const tokenInst = new ethers.Contract(
      CWolfTokenJSON.address,
      CWolfTokenJSON.abi,
      signer
    );

    const [balanceBNB, balanceCWOLF] = await Promise.all([
      web3Provider.getBalance(address),
      tokenInst.balanceOf(address),
    ]);
    const dollartowolf = await variablesInst.methods
      .getDollarsInCWOLF((1 * 1e8).toString())
      .call();
    const wolf_amount = (nft.askingPrice * 5) / 100;
    const dallorbnb = await variablesInst.methods
      .getDollarsInBNB((1 * 1e8).toString())
      .call();
    const msg_value = Math.round((dallorbnb * wolf_amount) / dollartowolf);
    if (parseInt(balanceBNB, 10) < msg_value) {
      toasts?.pushError("Don't have enough BNB", 8000);
    } else if (parseInt(balanceCWOLF, 10) < nft.askingPrice) {
      toasts?.pushError("Don't have enough CWOLF", 8000);
    } else {
      await MarketInst.methods
        .buyItem(nft.id)
        .send({ value: msg_value, from: address });
      deleteEventWolfPack(nft.tokenId);
    }
  }

  async function removeNFT(nft: any) {
    const web3 = new Web3(window.ethereum);
    const MarketInst = new web3.eth.Contract(
      Market.abi as [],
      Market.address as string
    );
    await MarketInst.methods.removeItem(nft.id).send({ from: address });
    const url = 'http://127.0.0.1:8000/wolfpack/remove';

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: nft.id }),
    };

    await fetch(url, requestOptions)
      .then((response) => response.json())
      .catch((error) => {
        return false;
      });
    deleteEventWolfPack(nft.tokenId);
  }
  const reloadData = () => {
    /* setGenderType([]);
    setBreedType([]);
    setReloadFlag(!reloadFlag); */
  };

  const getCWOLFPrice = async () => {
    const web3 = new Web3(window.ethereum);
    const variablesInst = new web3.eth.Contract(
      VariablesJSON.abi as [],
      VariablesJSON.address as string
    );
    const priceBoxCWOLF = await variablesInst.methods
      .getDollarsInCWOLF((1 * 1e18).toString())
      .call();

    setOneUSDInCWOLF(priceBoxCWOLF / 1e18);
  };

  useEffect(() => {
    // Connect to the network
    if (web3Provider) {
      const approveCWOLF = async () => {
        const web3 = new Web3(window.ethereum);
        const tokenInst = new web3.eth.Contract(
          CWolfTokenJSON.abi as [],
          CWolfTokenJSON.address as string
        );
        const allowanceBalance = await tokenInst.methods
          .allowance(address, Market.address)
          .call();
        if (Math.floor(allowanceBalance / 1e18) < 100) {
          approveNFT(tokenInst);
        }
      };

      const getInit = async () => {
        const web3 = await new Web3(window.ethereum);
        const marketContract = await new web3.eth.Contract(
          Market.abi as [],
          Market.address as string
        );
        const materialContract = await new web3.eth.Contract(
          MaterialsNFTJSON.abi as [],
          MaterialsNFTJSON.address as string
        );
        const wolfContract = await new web3.eth.Contract(
          WolfsNFTJSON.abi as [],
          WolfsNFTJSON.address as string
        );
        const multicall = new MultiCall(web3, config.MULTICALL);

        const totalSupply = await marketContract.methods.idCount().call();

        const callsHash = [];
        for (let count = 0; count < totalSupply; count++) {
          callsHash.push({
            hash: await marketContract.methods.nftId(count),
          });
        }
        const resultsHash = await multicall.all([callsHash]);

        if (resultsHash[0]) {
          const callsInfo = [];
          for await (const result of resultsHash[0]!) {
            callsInfo.push({
              info: await marketContract.methods.getTokenInfoById(result.hash),
            });
          }
          const resultsInfo = await multicall.all([callsInfo]);

          if (resultsInfo[0]) {
            const materialsList = [];
            const wolfsList = [];

            let i = 0;
            for await (const resultInfo of resultsInfo[0]!) {
              if (resultInfo.info[1] != 0) {
                if (resultInfo.info[0] == MaterialsNFTJSON.address) {
                  materialsList.push({
                    hash: resultsHash[0][i].hash,
                    info: resultInfo.info,
                  });
                } else if (resultInfo.info[0] == WolfsNFTJSON.address) {
                  wolfsList.push({
                    hash: resultsHash[0][i].hash,
                    info: resultInfo.info,
                  });
                }
              }
              i++;
            }

            const callsMaterials = [];
            for await (const data of materialsList) {
              callsMaterials.push({
                slots: await materialContract.methods.getMaterialSlots(
                  data.info[1].toString()
                ),
              });
            }
            const resultsMaterials = await multicall.all([callsMaterials]);

            if (resultsMaterials[0]) {
              const materialsFilters = [];
              const materialsFiltersCount = [0, 0, 0, 0, 0, 0, 0] as any;
              const materialsFinal = [];

              for (let index = 0; index < materialsList.length; index++) {
                materialsFinal.push({
                  type: 'material',
                  tokenId: materialsList[index]!.info[1],
                  sellerAddress: materialsList[index]!.info[2],
                  askingPrice: materialsList[index]!.info[3],
                  level:
                    materialsData.Level[resultsMaterials[0][index].slots - 1],
                  id: materialsList[index]!.hash,
                });
                materialsFilters[resultsMaterials[0][index].slots] = 'active';
                materialsFiltersCount[resultsMaterials[0][index].slots] += 1;
              }

              setMaterialInitFilters(materialsFilters);
              setMaterialInitFiltersCount(materialsFiltersCount);
              setMaterialInitItems(materialsFinal);

              setmaterialFilters(materialsFilters);
              setmaterialFiltersCount(materialsFiltersCount);
              setmaterialItems(materialsFinal);
              changePageMaterial(1, materialsFinal);
            }

            const callsWolfs = [];
            for await (const data of wolfsList) {
              callsWolfs.push({
                props: await wolfContract.methods.getWolfProperties(
                  data.info[1].toString()
                ),
              });
            }
            const resultsWolfs = await multicall.all([callsWolfs]);

            if (resultsWolfs[0]) {
              const wolfsFilters = [];
              const wolfsFiltersCount = [0, 0, 0, 0, 0, 0, 0] as any;
              const wolfsFinal = [];

              for (let index = 0; index < wolfsList.length; index++) {
                wolfsFinal.push({
                  type: 'wolf',
                  tokenId: wolfsList[index]!.info[1],
                  sellerAddress: wolfsList[index]!.info[2],
                  askingPrice: wolfsList[index]!.info[3],
                  id: wolfsList[index]!.hash,
                  breed: wolvesData.Breed[resultsWolfs[0][index].props[0]],
                  gender: wolvesData.Gender[resultsWolfs[0][index].props[1]],
                  level: wolvesData.Level[resultsWolfs[0][index].props[2]],
                  attack: resultsWolfs[0][index].props[3],
                  defense: resultsWolfs[0][index].props[4],
                  lastHunt: resultsWolfs[0][index].props[5],
                });
                wolfsFilters[parseInt(resultsWolfs[0][index].props[2]) + 1] =
                  'active';
                wolfsFiltersCount[
                  parseInt(resultsWolfs[0][index].props[2]) + 1
                ] += 1;
              }

              setWolfInitFilters(wolfsFilters);
              setWolfInitFiltersCount(wolfsFiltersCount);
              setWolfInitItems(wolfsFinal);

              setwolfFilters(wolfsFilters);
              setwolfFiltersCount(wolfsFiltersCount);
              setwolfItems(wolfsFinal);
              changePageWolf(1, wolfsFinal);
            }
          }
        }
      };

      approveCWOLF();
      getInit();
      getCWOLFPrice();
    }
  }, [connect, web3Provider, reloadFlag, filter]);
  return (
    <div className="Home">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
        />
        <title>Marketplace | CryptoWolf</title>
        <meta name="description" content="CryptoWolf" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <div className="feast-wrapper">
        <header className="header">
          <MainMenu />
        </header>
        <main>
          <div>
            <div className="main-feast-section-wrapper">
              <div className="main-feast-section-market">
                {/* <div className='market__left__blank'></div> */}
                <div
                  className=" market__filter main-feast-section-market__left-block"
                  style={{ zIndex: 50 }}
                >
                  <div
                    className="flex mb-4 justify-center items-center"
                    style={{ width: '300px' }}
                  >
                    <div className="w-full MuiFormControl-root input">
                      <label
                        className="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-outlined MuiFormLabel-filled"
                        data-shrink="true"
                        htmlFor="outlined-age-native-simple"
                      >
                        Filter By
                      </label>
                      <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl">
                        <select
                          value={filter}
                          onChange={selectFilter}
                          className="MuiSelect-root MuiSelect-select MuiSelect-outlined MuiInputBase-input MuiOutlinedInput-input"
                          aria-invalid="false"
                        >
                          <option value="Material">Material</option>
                          <option value="Wolf">Wolf</option>
                        </select>
                        <svg
                          className="MuiSvgIcon-root MuiSelect-icon MuiSelect-iconOutlined"
                          focusable="false"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path d="M7 10l5 5 5-5z"></path>
                        </svg>
                        <fieldset
                          aria-hidden="true"
                          className="jss1 MuiOutlinedInput-notchedOutline"
                        >
                          <legend className="jss3 jss4">
                            <span>Filter By</span>
                          </legend>
                        </fieldset>
                      </div>
                    </div>
                    {/* <div className="btn btn--small" onClick={reloadData}>
                      Refresh
                    </div> */}
                  </div>
                  {/* {filter === "Wolf" && (
                    <div className="m-4">
                      <div className="market__filter-title">
                        <span>Gender Type</span>
                      </div>
                      <div className="market__filter-items">
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Male
                          <input
                            name="radioGenderMale"
                            checked={genderTypes.includes("Male")}
                            type="checkbox"
                            onChange={() => selectGender("Male")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Female
                          <input
                            name="radioGenderFemale"
                            checked={genderTypes.includes("Female")}
                            type="checkbox"
                            onChange={() => selectGender("Female")}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </div>
                    </div>
                  )} */}
                  {/* {filter === "Wolf" && (
                    <div style={{ margin: "10px" }} className="mb-2">
                      <div className="market__filter-title">
                        <span>Breed Type</span>
                      </div>
                      <div className="market__filter-items">
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Ground
                          <input
                            name="radioBreedGround"
                            checked={breedType.includes("Ground")}
                            type="checkbox"
                            onChange={() => selectBreed("Ground")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Water
                          <input
                            name="radioBreedWater"
                            checked={breedType.includes("Water")}
                            type="checkbox"
                            onChange={() => selectBreed("Water")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Ice
                          <input
                            name="radioBreedIce"
                            checked={breedType.includes("Ice")}
                            type="checkbox"
                            onChange={() => selectBreed("Ice")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Fire
                          <input
                            name="radioBreedFire"
                            checked={breedType.includes("Fire")}
                            type="checkbox"
                            onChange={() => selectBreed("Fire")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Forest
                          <input
                            name="radioBreedForest"
                            checked={breedType.includes("Forest")}
                            type="checkbox"
                            onChange={() => selectBreed("Forest")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Air
                          <input
                            name="radioBreedAir"
                            checked={breedType.includes("Air")}
                            type="checkbox"
                            onChange={() => selectBreed("Air")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Electric
                          <input
                            name="radioBreedElectric"
                            checked={breedType.includes("Electric")}
                            type="checkbox"
                            onChange={() => selectBreed("Electric")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Legendary
                          <input
                            name="radioBreedLegendary"
                            checked={breedType.includes("Legendary")}
                            type="checkbox"
                            onChange={() => selectBreed("Legendary")}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </div>
                    </div>
                  )} */}
                  {/* {filter !== "WolfPack" && (
                    <div style={{ margin: "10px" }} className="mb-2">
                      <div className="market__filter-title">
                        <span>Level Type</span>
                      </div>
                      <div className="market__filter-items">
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Wood
                          <input
                            name="radioLevelWood"
                            checked={levelType.includes("Wood")}
                            type="checkbox"
                            onChange={() => selectLevel("Wood")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Bronze
                          <input
                            name="radioLevelBronze"
                            checked={levelType.includes("Bronze")}
                            type="checkbox"
                            onChange={() => selectLevel("Bronze")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Silver
                          <input
                            name="radioLevelSilver"
                            checked={levelType.includes("Silver")}
                            type="checkbox"
                            onChange={() => selectLevel("Silver")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Gold
                          <input
                            name="radioLevelGold"
                            checked={levelType.includes("Gold")}
                            type="checkbox"
                            onChange={() => selectLevel("Gold")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Platinum
                          <input
                            name="radioLevelPlatinum"
                            checked={levelType.includes("Platinum")}
                            type="checkbox"
                            onChange={() => selectLevel("Platinum")}
                          />
                          <span className="checkmark"></span>
                        </label>
                        <label className="container MuiFormControlLabel-root market__filter-item">
                          Diamond
                          <input
                            name="radioLevelDiamond"
                            checked={levelType.includes("Diamond")}
                            type="checkbox"
                            onChange={() => selectLevel("Diamond")}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </div>
                    </div>
                  )} */}
                  {/* {(filter === "Wolf" || filter === "WolfPack") && (
                    <>
                      <div
                        style={{ margin: "10px" }}
                        className="market__filter-title"
                      >
                        <span>Attack Filter</span>
                      </div>
                      <div style={{ margin: "10px" }} className=" flex mb-4">
                        <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl">
                          <input
                            aria-invalid="false"
                            type="number"
                            className="MuiInputBase-input MuiOutlinedInput-input"
                            onChange={selectAttackRangeMin}
                            value={attackRangeMin}
                          />
                          <fieldset
                            aria-hidden="true"
                            className="jss1 MuiOutlinedInput-notchedOutline"
                          ></fieldset>
                        </div>
                        &nbsp;&nbsp;&nbsp;&nbsp;To&nbsp;&nbsp;&nbsp;&nbsp;
                        <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl">
                          <input
                            aria-invalid="false"
                            type="number"
                            className="MuiInputBase-input MuiOutlinedInput-input"
                            onChange={selectAttackRangeMax}
                            value={attackRangeMax}
                          />
                          <fieldset
                            aria-hidden="true"
                            className="jss1 MuiOutlinedInput-notchedOutline"
                          ></fieldset>
                        </div>
                      </div>
                      <div
                        style={{ margin: "10px" }}
                        className="market__filter-title"
                      >
                        <span>Defense Filter</span>
                      </div>
                      <div style={{ margin: "10px" }} className=" flex mb-4">
                        <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl">
                          <input
                            aria-invalid="false"
                            type="number"
                            className="MuiInputBase-input MuiOutlinedInput-input"
                            onChange={selectDefenseRangeMin}
                            value={defenseRangeMin}
                          />
                          <fieldset
                            aria-hidden="true"
                            className="jss1 MuiOutlinedInput-notchedOutline"
                          ></fieldset>
                        </div>
                        &nbsp;&nbsp;&nbsp;&nbsp;To&nbsp;&nbsp;&nbsp;&nbsp;
                        <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl">
                          <input
                            aria-invalid="false"
                            type="number"
                            className="MuiInputBase-input MuiOutlinedInput-input"
                            onChange={selectDefenseRangeMax}
                            value={defenseRangeMax}
                          />
                          <fieldset
                            aria-hidden="true"
                            className="jss1 MuiOutlinedInput-notchedOutline"
                          ></fieldset>
                        </div>
                      </div>
                      <div
                        style={{ margin: "10px" }}
                        className="market__filter-title"
                      >
                        <span>Health Filter</span>
                      </div>
                      <div style={{ margin: "10px" }} className=" flex mb-4">
                        <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl">
                          <input
                            aria-invalid="false"
                            type="number"
                            className="MuiInputBase-input MuiOutlinedInput-input"
                            onChange={selectHealthRangeMin}
                            value={healthRangeMin}
                          />
                          <fieldset
                            aria-hidden="true"
                            className="jss1 MuiOutlinedInput-notchedOutline"
                          ></fieldset>
                        </div>
                        &nbsp;&nbsp;&nbsp;&nbsp;To&nbsp;&nbsp;&nbsp;&nbsp;
                        <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl">
                          <input
                            aria-invalid="false"
                            type="number"
                            className="MuiInputBase-input MuiOutlinedInput-input"
                            onChange={selectHealthRangeMax}
                            value={healthRangeMax}
                          />
                          <fieldset
                            aria-hidden="true"
                            className="jss1 MuiOutlinedInput-notchedOutline"
                          ></fieldset>
                        </div>
                      </div>
                    </>
                  )} */}
                  <div
                    className="w-full MuiFormControl-root input mx-auto"
                    style={{ marginBottom: 0 }}
                  >
                    <label
                      className="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-outlined MuiFormLabel-filled"
                      data-shrink="true"
                      htmlFor="outlined-age-native-simple"
                    >
                      Price By
                    </label>
                    <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl">
                      <select
                        value={price}
                        onChange={selectPrice}
                        className="MuiSelect-root MuiSelect-select MuiSelect-outlined MuiInputBase-input MuiOutlinedInput-input"
                        aria-invalid="false"
                      >
                        <option value="">-</option>
                        <option value="High">Price:Low to High</option>
                        <option value="Low">Price:High to Low</option>
                      </select>
                      <svg
                        className="MuiSvgIcon-root MuiSelect-icon MuiSelect-iconOutlined"
                        focusable="false"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M7 10l5 5 5-5z"></path>
                      </svg>
                      <fieldset
                        aria-hidden="true"
                        className="jss1 MuiOutlinedInput-notchedOutline"
                      >
                        <legend className="jss3 jss4">
                          <span>Filter By</span>
                        </legend>
                      </fieldset>
                    </div>
                  </div>
                  {/* <div className="flex mb-4">
                    <div className="market__filter-items">
                      <div
                        className="btn-next btn--small"
                        onClick={previousPage}
                      >
                        {" "}
                        Previous{" "}
                      </div>
                      <div
                        className=" MuiFormControl-root-page input"
                        style={{ width: "100px" }}
                      >
                        <label
                          className="MuiFormLabel-root MuiInputLabel-root MuiInputLabel-formControl MuiInputLabel-animated MuiInputLabel-shrink MuiInputLabel-outlined MuiFormLabel-filled"
                          data-shrink="true"
                          htmlFor="outlined-age-native-simple"
                        >
                          Go to
                        </label>
                        <div className="MuiInputBase-root MuiOutlinedInput-root MuiInputBase-formControl">
                          <select
                            value={pageSign}
                            onChange={selectPage}
                            className="MuiSelect-root MuiSelect-select MuiSelect-outlined MuiInputBase-input MuiOutlinedInput-input"
                            aria-invalid="false"
                          >
                            {filter == "Material" &&
                              pageCountMaterial.map((item: any) => (
                                <option value={item}>{item}</option>
                              ))}
                            {filter == "Wolf" &&
                              pageCountWolf.map((item: any) => (
                                <option value={item}>{item}</option>
                              ))}
                            {filter == "WolfPack" &&
                              pageCountWolfPack.map((item: any) => (
                                <option value={item}>{item}</option>
                              ))}
                          </select>
                          <svg
                            className="MuiSvgIcon-root MuiSelect-icon MuiSelect-iconOutlined"
                            focusable="false"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M7 10l5 5 5-5z"></path>
                          </svg>
                          <fieldset
                            aria-hidden="true"
                            className="jss1 MuiOutlinedInput-notchedOutline"
                          >
                            <legend className="jss3 jss4">
                              <span>Filter By</span>
                            </legend>
                          </fieldset>
                        </div>
                      </div>
                      <div className="btn-next btn--small" onClick={nextPage}>
                        Next
                      </div>
                    </div>
                  </div> */}
                  <div className="m-6">
                    <div className="market__filter-items">
                      <label className="container MuiFormControlLabel-root" style={{margin: 0, fontSize: "1rem"}}>
                        Show only your own
                        <input
                          name="radioShowOnlyOwn"
                          checked={filterTypes.includes('ShowOnlyOwn')}
                          type="checkbox"
                          onChange={() => selectOwn('ShowOnlyOwn')}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="main-feast-section-market__right-block">
                  <div className="main-content-market">
                    {filter === 'Material' && (
                      <div className="main-content">
                        <div>{t('filter-by-material')}:</div>
                        <div className="flex filters">
                          {range(6, 0).map((item: number) => (
                            <div key={item}>
                              {item === 0 ? (
                                <button
                                  ref={filterbuttonprimary}
                                  className={`filter ${filtersActiveMaterial[item]}`}
                                  onClick={() => selectFilterMaterial(item)}
                                >
                                  {t('all', { ns: 'common' })}
                                </button>
                              ) : (
                                <>
                                  {materialFilters[item] === 'active' ? (
                                    <button
                                      className={`filter ${
                                        wolvesData.Level[item - 1]
                                      } ${filtersActiveMaterial[item]}`}
                                      onClick={() => selectFilterMaterial(item)}
                                    >
                                      {wolvesData.Level[item - 1]} (
                                      {materialFiltersCount[item]})
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      className="filter button-disabled cursor-not-allowed"
                                    >
                                      {wolvesData.Level[item - 1]} (
                                      {materialFiltersCount[item]})
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        {pageNumbersMaterial.length > 1 ? (
                          <div className="mt-4 w-full flex flex-col">
                            {t('pagination')}
                            <div className="flex space-between">
                              <div className="justify-start align-center flex">
                                <select
                                  className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                  onChange={(event) =>
                                    selectFilterMaterial(
                                      filterNumberActiveMaterial,
                                      Number(event.target.value)
                                    )
                                  }
                                  value={currentPageMaterial}
                                >
                                  {pageNumbersMaterial.map(
                                    (item: number, _index: any) => (
                                      <>
                                        <option value={item}>{item}</option>
                                      </>
                                    )
                                  )}
                                </select>
                              </div>
                              <div className="justify-end align-center flex">
                                <select
                                  className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                  onChange={(event) =>
                                    setTodosPerPageMaterial(
                                      parseInt(event.target.value, 10)
                                    )
                                  }
                                  value={todosPerPageMaterial}
                                >
                                  <option value="20">20</option>
                                  <option value="40">40</option>
                                  <option value="60">60</option>
                                  <option value="80">80</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ) : null}
                        <div className="flex flex-wrap space-between">
                          {materialItems.length > 0 ? (
                            <>
                              {materialItems.map((item: any, index: any) => (
                                <div className="itemsNFTs" key={index}>
                                  <>
                                    <CardGame
                                      tokenId={item.tokenId}
                                      defense={0}
                                      attack={0}
                                      level={item.level}
                                      type="material"
                                      nothover="nothover"
                                      notburn="notburn"
                                      askingPrice={item.askingPrice}
                                      askingPriceInCWOLF={
                                        (item.askingPrice / 1e18) *
                                        oneUSDInCWOLF
                                      }
                                      sellerAddress={item.sellerAddress}
                                      id={item.id}
                                      toast={toasts}
                                      web3Provider={web3Provider}
                                      isMarketplace="yes"
                                      deleteEvent={null}
                                    />
                                  </>
                                </div>
                              ))}
                            </>
                          ) : null}
                        </div>
                      </div>
                    )}
                    {filter === 'Wolf' && (
                      <div className="main-content">
                        <div>{t('filter-by-wolf')}:</div>
                        <div className="flex filters">
                          {range(6, 0).map((item: number) => (
                            <div key={item}>
                              {item === 0 ? (
                                <button
                                  ref={filterbuttonprimary}
                                  className={`filter ${filtersActiveWolf[item]}`}
                                  onClick={() => selectFilterWolf(item)}
                                >
                                  {t('all', { ns: 'common' })}
                                </button>
                              ) : (
                                <>
                                  {wolfFilters[item] === 'active' ? (
                                    <button
                                      className={`filter ${
                                        wolvesData.Level[item - 1]
                                      } ${filtersActiveWolf[item]}`}
                                      onClick={() => selectFilterWolf(item)}
                                    >
                                      {wolvesData.Level[item - 1]} (
                                      {wolfFiltersCount[item]})
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      className="filter button-disabled cursor-not-allowed"
                                    >
                                      {wolvesData.Level[item - 1]} (
                                      {wolfFiltersCount[item]})
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        {pageNumbersWolf.length > 1 ? (
                          <div className="mt-4 w-full flex flex-col">
                            {t('pagination')}
                            <div className="flex space-between">
                              <div className="justify-start align-center flex">
                                <select
                                  className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                  onChange={(event) =>
                                    selectFilterWolf(
                                      filterNumberActiveWolf,
                                      Number(event.target.value)
                                    )
                                  }
                                  value={currentPageWolf}
                                >
                                  {pageNumbersWolf.map(
                                    (item: number, _index: any) => (
                                      <>
                                        <option value={item}>{item}</option>
                                      </>
                                    )
                                  )}
                                </select>
                              </div>
                              <div className="justify-end align-center flex">
                                <select
                                  className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                                  onChange={(event) =>
                                    setTodosPerPageWolf(
                                      parseInt(event.target.value, 10)
                                    )
                                  }
                                  value={todosPerPageWolf}
                                >
                                  <option value="20">20</option>
                                  <option value="40">40</option>
                                  <option value="60">60</option>
                                  <option value="80">80</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ) : null}
                        <div className="flex flex-wrap space-between">
                          {wolfItems.length > 0 ? (
                            <>
                              {wolfItems.map((item: any, index: any) => (
                                <div className="itemsNFTs" key={index}>
                                  <>
                                    <CardGame
                                      tokenId={item.tokenId}
                                      defense={item.defense}
                                      attack={item.attack}
                                      gender={item.gender}
                                      level={item.level}
                                      breed={item.breed}
                                      askingPrice={item.askingPrice}
                                      askingPriceInCWOLF={
                                        (item.askingPrice / 1e18) *
                                        oneUSDInCWOLF
                                      }
                                      type="wolf"
                                      id={item.id}
                                      sellerAddress={item.sellerAddress}
                                      nothover="nothover"
                                      notburn="notburn"
                                      toast={toasts}
                                      web3Provider={web3Provider}
                                      isMarketplace="yes"
                                      deleteEvent={null}
                                    />
                                  </>
                                </div>
                              ))}
                            </>
                          ) : null}
                        </div>
                      </div>
                    )}
                    {filter === 'WolfPack' && (
                      <>
                        <div className="mt-8 flex flex-wrap justify-center md:justify-around gap-4 lg:gap-8">
                          {wolfpackItems.length > 0 &&
                            wolfpackItems.map((item: any, index: any) => (
                              <div key={index}>
                                {item.totalSlotsInWolfPack > 0 ? (
                                  <div>
                                    <div className="relative wolfPack-main">
                                      {item.wolfPackInPromo ? (
                                        <>
                                          <div
                                            style={{
                                              position: 'absolute',
                                              left: '2rem',
                                              top: '2rem',
                                              background: 'rgb(6, 18, 49)',
                                              padding: '0.5rem',
                                              fontSize: '10px',
                                              fontWeight: 'bold',
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
                                          position: 'absolute',
                                          right: '2rem',
                                          top: '2rem',
                                          background: 'rgb(6, 18, 49)',
                                          padding: '0.5rem',
                                          fontSize: '10px',
                                          fontWeight: 'normal',
                                        }}
                                        className="rounded-lg"
                                      >
                                        #{item.tokenId?.toString()}
                                      </div>
                                      <div className="wolfPack-buttons absolute flex flex-col md:flex-row w-full h-full justify-center items-center z-10">
                                        <button
                                          onClick={() => buyNFT(item)}
                                          className="button button-regular"
                                        >
                                          {item.askingPrice / 10 ** 18}
                                          $CWOLF&nbsp;Buy
                                        </button>
                                      </div>
                                      <img
                                        src={`https://cdn.cryptowolf.finance/images/wolfpack/wolfpack.jpg`}
                                        alt="Card"
                                        className="background"
                                      />
                                      <div className="w-full h-full absolute top-0 left-0 flex justify-end items-end gap-8 wolfPacks-item-bg">
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
                                          <span>{item.wolfPackEnergy}</span>
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
                                          <span>{item.wolfPackLife}</span>
                                        </div>
                                        <div className="flex gap-1 text-center">
                                          <svg
                                            viewBox="0 0 8.5 11"
                                            className="h-6"
                                          >
                                            <g fill="#FFFFFF">
                                              <path d="m4.25 1.3382l-3.7545 1.128c0.09209 2.7926 0.7929 6.1993 3.7545 7.1956 2.9942-0.9678 3.6274-4.4327 3.7545-7.1956l-3.7545-1.128z" />
                                            </g>
                                          </svg>
                                          <span>
                                            {item.wolfPackLife -
                                              item.pointsOfWolfPack}
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
                              </div>
                            ))}
                          {wolfpackItems.length <= 0 ? (
                            <>
                              <div
                                style={{
                                  background: '#061231',
                                  padding: '1.5rem',
                                }}
                                className="rounded-lg"
                              >
                                <h2 className="text-3xl">NO WOLF PACK Added</h2>
                              </div>
                            </>
                          ) : (
                            <></>
                          )}
                        </div>
                      </>
                    )}
                    {/* <p className="main-feast-section__festival-name-text halloween-2021">
                    {t('coming-soon')}
                  </p> */}
                    {/* <div className="main-feast-section__left-block">
                  <img src="/images/lobohielo2.gif" alt="wolf" />
                </div> */}
                  </div>
                </div>
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
    ...(await serverSideTranslations(locale, ['common', 'footer'])),
  },
});

export default Home;
