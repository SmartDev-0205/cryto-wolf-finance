/* eslint-disable array-callback-return */
import React, { useEffect, useState } from "react";

import { ethers } from "ethers";
import { useTranslation } from "next-i18next";
import Modal from "react-modal";

import MaterialsNFTJSON from "../../contracts/MaterialsNFT.json";
import VariablesJSON from "../../contracts/Variables.json";
import WolfsNFTJSON from "../../contracts/WolfsNFT.json";
import { wolvesData } from "../../lib/nftsData";
import CardGame from "./CardGame";

type IFilterByProps = {
  title?: any;
  all?: any;
  pendingItems?: any;
  items?: any;
  type?: any;
  filters?: any;
  filtersCount?: any;
  toast?: any;
  web3Provider?: any;
  deleteEventItem?: any;
};

const FilterBy = (props: IFilterByProps) => {
  const { t } = useTranslation(["common"]);
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [burnedCwolf, setBurnedCwolf] = React.useState(0);
  const [filtersActive, setFiltersActive] = useState(["button-primary"] as any);
  const [filterNumberActive, setFilterNumberActive] = useState(0);
  const [itemsShow, setItemsShow] = useState(props.items as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [todosPerPage, setTodosPerPage] = useState(40);
  const [pageNumbers, setPageNumbers] = useState([] as any);
  const [burnItems, setBurnItems] = useState([] as any);

  async function getBurnQuantity() {
    const signer = props.web3Provider.getSigner();
    const variablesJsonInst = new ethers.Contract(
      VariablesJSON.address,
      VariablesJSON.abi,
      signer
    );
    return await variablesJsonInst.getDollarsInCWOLF((2 * 1e8).toString());
  }

  async function openModal() {
    let burnQuantity = await getBurnQuantity();
    burnQuantity /= 1e8;
    setBurnedCwolf(burnQuantity * burnItems.length);
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
  }

  function closeModal() {
    setIsOpen(false);
  }

  function deleteEvent(tokenId: any) {
    props.deleteEventItem(tokenId);
  }

  function selectAllToBurn() {
    if (burnItems.length >= 80) return false;
    const burnItemsTemp = [] as any;
    itemsShow.map((item: any) => {
      if (props.type === "material") {
        burnItemsTemp.push(item[1].toString());
      } else {
        burnItemsTemp.push(item[5].toString());
      }
    });
    setBurnItems(burnItemsTemp);
  }
  async function burnBulk() {
    const signer = props.web3Provider.getSigner();

    if (props.type === "material") {
      const itemsNFTInst = new ethers.Contract(
        MaterialsNFTJSON.address,
        MaterialsNFTJSON.abi,
        signer
      );
      itemsNFTInst.burnMultipleMaterials(burnItems).then(
        (_result: any) => {
          closeModal();

          let burnMaterials = [] as any;
          burnItems.map((_tokenId: string) => {
            if (localStorage.burnMaterials != null) {
              burnMaterials = JSON.parse(localStorage.burnMaterials);
            }
            burnMaterials.push(_tokenId);
            localStorage.burnMaterials = JSON.stringify(burnMaterials);
          });
          props.deleteEventItem(burnItems);
          setBurnItems([]);

          props.toast?.pushInfo("Burning NFTs", 8000);
        },
        (_error: any) => {
          props.toast?.pushError("Burning NFTs was canceled", 8000);
        }
      );
    } else {
      const itemsNFTInst = new ethers.Contract(
        WolfsNFTJSON.address,
        WolfsNFTJSON.abi,
        signer
      );

      itemsNFTInst.burnMultipleWolfs(burnItems).then(
        (_result: any) => {
          closeModal();

          let burnWolfs = [] as any;
          burnItems.map((_tokenId: string) => {
            if (localStorage.burnWolfs != null) {
              burnWolfs = JSON.parse(localStorage.burnWolfs);
            }
            burnWolfs.push(_tokenId);
            localStorage.burnWolfs = JSON.stringify(burnWolfs);
          });
          props.deleteEventItem(burnItems);
          setBurnItems([]);

          props.toast?.pushInfo("Burning NFTs", 8000);
        },
        (_error: any) => {
          props.toast?.pushError("Burning NFTs was canceled", 8000);
        }
      );
    }
  }

  function range(size: number, startAt: number = 0): ReadonlyArray<number> {
    const rangeArray = [];
    for (let i = startAt; i <= size; i += 1) {
      rangeArray.push(i);
    }
    return rangeArray;
  }

  const changePage = async (page: number, items: any = null) => {
    let array = props.items;

    if (items != null) {
      array = items;
    }

    const indexOfLastTodo = page * todosPerPage;
    const indexOfFirstTodo = indexOfLastTodo - todosPerPage;
    const currentTodos = array.slice(indexOfFirstTodo, indexOfLastTodo);

    const newPageNumbers = [];
    for (let i = 1; i <= Math.ceil(array.length / todosPerPage); i++) {
      newPageNumbers.push(i);
    }

    setCurrentPage(page);
    setPageNumbers(newPageNumbers);
    setItemsShow(currentTodos);
  };

  const selectFilter = async (filter: number, page: number = 1) => {
    const filterArray = [];
    for (let i = 0; i < filter; i += 1) {
      filterArray.push("");
    }
    filterArray.push("button-primary");
    setFiltersActive(filterArray);
    setFilterNumberActive(filter);

    if (filter === 0) {
      changePage(page, props.items);
    } else if (props.type === "material") {
      changePage(
        page,
        props.items.filter(
          (item: any) => item[0] === wolvesData.Level[filter - 1]
        )
      );
    } else {
      changePage(
        page,
        props.items.filter(
          (item: any) => item[3] === wolvesData.Level[filter - 1]
        )
      );
    }
  };

  useEffect(() => {
    const asyncFunction = async () => {
      await selectFilter(0);
      await changePage(1);
    };
    asyncFunction();
  }, [props.items, todosPerPage]);
  return (
    <div>
      <div className="main-content">
        {props.type != "market-material" && props.type != "market-wolf" ? (
          <>
            <div>{props.title}:</div>
            <div className="flex filters">
              {range(6, 0).map((item: number) => (
                <div key={item}>
                  {item === 0 ? (
                    <button
                      className={`filter ${filtersActive[item]}`}
                      onClick={() => selectFilter(item)}
                    >
                      {props.all}
                    </button>
                  ) : (
                    <>
                      {props.filters[item] === "active" ? (
                        <button
                          className={`filter ${wolvesData.Level[item - 1]} ${
                            filtersActive[item]
                          }`}
                          onClick={() => selectFilter(item)}
                        >
                          {wolvesData.Level[item - 1]} (
                          {props.filtersCount[item]})
                        </button>
                      ) : (
                        <button
                          disabled
                          className="filter button-disabled cursor-not-allowed"
                        >
                          {wolvesData.Level[item - 1]} (
                          {props.filtersCount[item]})
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : null}
        {pageNumbers.length > 1 ? (
          <div className="mt-4 w-full flex flex-col">
            {t("pagination")}
            <div className="flex space-between">
              <ul className="mt-2 flex flex-wrap justify-start items-center gap-2 md:gap-4">
                {pageNumbers.map((item: number, _index: any) => (
                  <>
                    {currentPage === item ? (
                      <li
                        key={`pageNumbers${item.toString()}`}
                        onClick={() => selectFilter(filterNumberActive, item)}
                      >
                        <button className="button button-primary">
                          {item}
                        </button>
                      </li>
                    ) : (
                      <li
                        key={`pageNumbers${item.toString()}`}
                        onClick={() => selectFilter(filterNumberActive, item)}
                      >
                        <button className="button button-regular">
                          {item}
                        </button>
                      </li>
                    )}
                  </>
                ))}
              </ul>
              <div className="justify-end align-center flex">
                <select
                  className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  onChange={(event) =>
                    setTodosPerPage(parseInt(event.target.value, 10))
                  }
                  value={todosPerPage}
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
        {burnItems.length > 0 && (
          <div className="text-center mx-auto my-2">
            <a className="button button-regular" onClick={selectAllToBurn}>
              Select all the items of this page to burn (MAX 80)
            </a>
          </div>
        )}
        <div className="flex flex-wrap space-between">
          {props.pendingItems &&
            props.pendingItems.map((item: any, index: any) => (
              <div
                className={`itemsNFTs itemsNFTs-${item.type}`}
                key={`pending-${index}`}
              >
                {(item.type === "wolf" &&
                  item.defense === 0 &&
                  item.attack === 0) ||
                (item.type === "material" && item.level === 0) ? (
                  <>
                    <CardGame
                      defense={0}
                      attack={0}
                      level="cardReverse"
                      type={props.type}
                      nothover="nothover"
                      notburn="notburn"
                      notproperties="notproperties"
                      deleteEvent={deleteEvent}
                    />
                    <button className="button button-regular">
                      <div className="loading-ring"></div>
                      {t("generating")}
                    </button>
                  </>
                ) : (
                  <div>
                    {item.type === "material" ? (
                      <>
                        <CardGame
                          defense={0}
                          attack={0}
                          level={item.level}
                          type={item.type}
                          nothover="nothover"
                          notburn="notburn"
                          deleteEvent={deleteEvent}
                        />
                      </>
                    ) : (
                      <CardGame
                        defense={item.defense}
                        attack={item.attack}
                        level={item.level}
                        breed={item.breed}
                        nothover="nothover"
                        notburn="notburn"
                        deleteEvent={deleteEvent}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          {itemsShow.map((item: any, index: any) => (
            <div className="itemsNFTs" key={index}>
              {props.type === "material" && (
                <CardGame
                  tokenId={item[1]}
                  defense={0}
                  attack={0}
                  level={item[0]}
                  type={props.type}
                  nothover="nothover"
                  toast={props.toast}
                  web3Provider={props.web3Provider}
                  burnItems={burnItems}
                  setBurnItems={setBurnItems}
                  deleteEvent={deleteEvent}
                />
              )}
              {props.type === "wolves" && (
                <CardGame
                  tokenId={item[5]}
                  defense={item[1]}
                  attack={item[0]}
                  gender={item[2]}
                  level={item[3]}
                  breed={item[4]}
                  nothover="nothover"
                  toast={props.toast}
                  web3Provider={props.web3Provider}
                  burnItems={burnItems}
                  setBurnItems={setBurnItems}
                  deleteEvent={deleteEvent}
                />
              )}
              {props.type === "market-material" && (
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
                    id={item.id}
                    toast={props.toast}
                    web3Provider={props.web3Provider}
                    isMarketplace="yes"
                    deleteEvent={deleteEvent}
                  />
                </>
              )}
              {props.type === "market-wolf" && (
                <CardGame
                  tokenId={item.tokenId}
                  defense={item.defense}
                  attack={item.attack}
                  gender={item.gender}
                  level={item.level}
                  breed={item.breed}
                  askingPrice={item.askingPrice}
                  type={props.type}
                  id={item.id}
                  nothover="nothover"
                  notburn="notburn"
                  toast={props.toast}
                  web3Provider={props.web3Provider}
                  isMarketplace="yes"
                  deleteEvent={deleteEvent}
                />
              )}
            </div>
          ))}
        </div>
        {pageNumbers.length > 1 ? (
          <div className="mt-4 w-full flex flex-col">
            {t("pagination")}
            <div className="flex space-between">
              <ul className="mt-2 flex flex-wrap justify-start items-center gap-2 md:gap-4">
                {pageNumbers.map((item: number, _index: any) => (
                  <>
                    {currentPage === item ? (
                      <li
                        key={`pageNumbers${item.toString()}`}
                        onClick={() => selectFilter(filterNumberActive, item)}
                      >
                        <button className="button button-primary">
                          {item}
                        </button>
                      </li>
                    ) : (
                      <li
                        key={`pageNumbers${item.toString()}`}
                        onClick={() => selectFilter(filterNumberActive, item)}
                      >
                        <button className="button button-regular">
                          {item}
                        </button>
                      </li>
                    )}
                  </>
                ))}
              </ul>
              <div className="justify-end align-center flex">
                <select
                  className="w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                  onChange={(event) =>
                    setTodosPerPage(parseInt(event.target.value, 10))
                  }
                  value={todosPerPage}
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
      </div>
      {burnItems.length > 0 ? (
        <>
          <a
            className="burn-items-float button button-regular"
            onClick={openModal}
          >
            Burn {burnItems.length} Items
          </a>
          <Modal
            isOpen={modalIsOpen}
            onAfterOpen={afterOpenModal}
            onRequestClose={closeModal}
            ariaHideApp={false}
            contentLabel="Example Modal"
          >
            <div className="modal-text">
              Receive {burnedCwolf} CWOLF for burning your NFTs
            </div>
            <div className="modal-button-container">
              <button className="modal-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="modal-burn"
                onClick={() => {
                  burnBulk();
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
    </div>
  );
};

export default FilterBy;
