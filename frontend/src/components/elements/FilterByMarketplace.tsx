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

const FilterByMarketplace = (props: IFilterByProps) => {
  const { t } = useTranslation(["common"]);
  const [modalIsOpen, setIsOpen] = React.useState(false);
  const [filtersActive, setFiltersActive] = useState(["button-primary"] as any);
  const [filterNumberActive, setFilterNumberActive] = useState(0);
  const [itemsShow, setItemsShow] = useState(props.items as any);
  const [currentPage, setCurrentPage] = useState(1);
  const [todosPerPage, setTodosPerPage] = useState(40);
  const [pageNumbers, setPageNumbers] = useState([] as any);

  async function getBurnQuantity() {
    const signer = props.web3Provider.getSigner();
    const variablesJsonInst = new ethers.Contract(
      VariablesJSON.address,
      VariablesJSON.abi,
      signer
    );
    return await variablesJsonInst.getDollarsInCWOLF((2 * 1e8).toString());
  }

  function deleteEvent(tokenId: any) {
    props.deleteEventItem(tokenId);
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
    setItemsShow(
      array.filter((item: any) => {
        return (
          currentTodos.filter(function (e: any) {
            return e.tokenId === item.tokenId;
          }).length > 0
        );
      })
    );
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
          (item: any) => item.level == wolvesData.Level[filter - 1]
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
                      {wolvesData.Level[item - 1]} ({props.filtersCount[item]})
                    </button>
                  ) : (
                    <button
                      disabled
                      className="filter button-disabled cursor-not-allowed"
                    >
                      {wolvesData.Level[item - 1]} ({props.filtersCount[item]})
                    </button>
                  )}
                </>
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
        <div className="flex flex-wrap space-between">
          {itemsShow.map((item: any, index: any) => (
            <div className="itemsNFTs" key={index}>
              {props.type === "material" && (
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
              {props.type === "wolf" && (
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
    </div>
  );
};

export default FilterByMarketplace;
