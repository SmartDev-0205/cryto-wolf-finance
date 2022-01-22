/* eslint-disable no-constant-condition */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { useEffect, useState } from 'react';

import { MultiCall } from 'eth-multicall';
import { ethers } from 'ethers';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Web3 from 'web3';

import FilterBy from '../components/elements/FilterBy';
import { useToast } from '../components/toast/ToastProvider';
import { useWeb3modal } from '../context/Web3modal';
import CWolfTokenJSON from '../contracts/CWolfToken.json';
import Market from '../contracts/MarketPlace.json';
import VariablesJSON from '../contracts/Variables.json';
import WolfPacksNFTJSON from '../contracts/WolfPacksNFT.json';
import WolfsNFTJSON from '../contracts/WolfsNFT.json';
import CenteredFooter from '../footer/CenteredFooter';
import { wolvesData } from '../lib/nftsData';
import MainMenu from '../navigation/MainMenu';
import config from '../utils/AppConfig';

function Wolves() {
  const toast = useToast();
  const [mintCount, setMintCount] = useState(0);
  const [numMint, setNumMint] = useState(1);
  const [priceCWOLF, setPriceCWOLF] = useState(0);
  const [priceBox, setPriceBox] = useState(10);
  const [revealBox, setRevealBox] = useState(false);
  const [revealAction, setRevealAction] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [tickerWidth, setTickerWidth] = useState(0);
  const [currentWolves, setCurrentWolves] = useState(0);
  const [attackPower, setAttackPower] = useState(0);
  const [tickerAnimation, setTickerAnimation] = useState('');
  const [items, setItems] = useState([] as any);
  const [spinnerItems] = useState([] as any);
  const [filters, setFilters] = useState([] as any);
  const [filtersCount, setFiltersCount] = useState([] as any);
  const [pendingItems, setPendingItems] = useState([] as any);
  /*
  function getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }
  */
  const getPropertiesWolves = async (wolfsNFTInst: any, tokenId: any) => {
    const tokenProperties = await wolfsNFTInst.getWolfProperties(tokenId);

    const breed = wolvesData.Breed[tokenProperties[0].toNumber()];
    const gender = wolvesData.Gender[tokenProperties[1].toNumber()];
    const level = wolvesData.Level[tokenProperties[2].toNumber()];
    const attack = tokenProperties[3].toNumber();
    const defense = tokenProperties[4].toNumber();
    return [breed, gender, level, attack, defense];
  };

  const { web3Provider, address, connect }: any = useWeb3modal();

  const { t } = useTranslation(['wolves', 'common']);
  const mintButton = async () => {
    setRevealBox(false);

    const signer = web3Provider.getSigner();
    // Your current metamask account;
    const wolfsNFTInst = new ethers.Contract(
      WolfsNFTJSON.address,
      WolfsNFTJSON.abi,
      signer
    );
    const tokenInst = new ethers.Contract(
      CWolfTokenJSON.address,
      CWolfTokenJSON.abi,
      signer
    );

    const [gas, balanceBNB, balanceCWOLF] = await Promise.all([
      wolfsNFTInst.calculateGasAndCommissions(numMint),
      web3Provider.getBalance(address),
      tokenInst.balanceOf(address),
    ]);
    if (parseInt(balanceBNB, 10) < parseInt(gas[2], 10)) {
      toast?.pushError("Don't have enough BNB", 8000);
    } else if (parseFloat((balanceCWOLF / 1e18).toFixed(6)) < priceCWOLF) {
      toast?.pushError("Don't have enough CWOLF", 8000);
    } else {
      wolfsNFTInst
        .mintWithCWOLF(numMint, {
          value: gas[2],
        })
        .then(
          (_result: any) => {
            setMintCount(numMint);
            const pendingItemsArray = [...pendingItems];
            for (let i = 0; i < numMint; i += 1) {
              pendingItemsArray.push({
                id: i,
                defense: 0,
                attack: 0,
                type: 'wolf',
              });
            }
            setPendingItems(pendingItemsArray);
          },
          (_error: any) => {
            toast?.pushError('Minting was canceled', 8000);
          }
        );
    }

    wolfsNFTInst.on('MintedNFT', (to, _tokenId) => {
      if (address === to) {
        getItemsNFTs();
      }
    });
  };

  const changeNumMint = (ev: any) => {
    let numberMint = 0;
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(+ev.target.value) || ev.target.value < 1) {
      numberMint = 1;
    } else if (ev.target.value > 10) {
      numberMint = 10;
    } else {
      numberMint = ev.target.value;
    }
    setNumMint(numberMint);
    setPriceCWOLF(
      Math.round((numberMint * priceBox + Number.EPSILON) * 100) / 100
    );
  };
  const boxSpeedMultiplier = 1;
  const widthItem = 200;
  const revealButton = () => {
    if (!isRolling) {
      setIsRolling(true);
      // randomly pick which item is won
      const wonItem = 50;
      // calculates new width for slider so it lands on right item
      const sliderWidth1 = wonItem * (widthItem + 2);
      // var sliderOffset = $('.tickerItems').offset();
      setTickerWidth(sliderWidth1);
      // reset css animation on slider
      setTickerAnimation('0s ease 0s 1 normal none running none');
      setTimeout(function a() {
        setTickerAnimation('');
      }, 500);

      setTimeout(function c() {
        setIsRolling(false);
        // alert("You Won Item #" + wonItem)
        // alert('#item'+wonItem +'> p');
        // picks up wonItem info from divs in the lootbox
      }, 12300 / boxSpeedMultiplier);
    }
    setRevealAction(true);
  };
  const approveToken = async (tokenInst: any) => {
    tokenInst.methods
      .approve(WolfsNFTJSON.address, ethers.utils.parseEther('100000000'))
      .send({ from: address })
      .once('transactionHash', () => {
        toast?.pushInfo('Approving purchase of Wolves with CWOLF', 8000);
      })
      .then((_tx: any) => {
        toast?.pushInfo(
          'You have approved the purchase of Wolves with CWOLF',
          8000
        );
      })
      .catch((e: any) => {
        if (e.code === 4001) {
          toast?.pushError(
            'You need to approve the spending of CWOLF in your wallet',
            8000
          );
        }
      });
  };
  function deleteEventWolf(tokenId: any) {
    const itemsArray = [...items];
    if (Array.isArray(tokenId)) {
      // eslint-disable-next-line array-callback-return
      tokenId.map((tokenIdItem: string) => {
        const index = itemsArray.findIndex(
          (item: any) => item[5].toString() === tokenIdItem.toString()
        );
        itemsArray.splice(index, 1);
      });
    } else {
      const index = itemsArray.findIndex(
        (item: any) => item[5].toString() === tokenId.toString()
      );
      itemsArray.splice(index, 1);
    }

    setItems(itemsArray);
  }
  const eventGeneratedNFT = async () => {
    const signer = web3Provider.getSigner();
    // Your current metamask account;
    const wolfsNFTInst = new ethers.Contract(
      WolfsNFTJSON.address,
      WolfsNFTJSON.abi,
      signer
    );
    wolfsNFTInst.on('GeneratedNFT', async (tokenId) => {
      const pendingItemsArray = [];
      const ownerToken = await wolfsNFTInst.ownerOf(tokenId);
      if (address === ownerToken) {
        const [breed, gender, level, attack, defense] =
          await getPropertiesWolves(wolfsNFTInst, tokenId.toString());
        pendingItemsArray.push({
          id: tokenId,
          breed,
          gender,
          level,
          attack,
          defense,
          type: 'wolf',
        });

        setPendingItems(pendingItemsArray);
        //toast?.pushInfo('Your NFT has been generated', 8000);
      }
    });
  };

  const getItemsNFTs = async () => {
    const signer = web3Provider.getSigner();
    // Your current metamask account;
    const wolfsNFTInst = new ethers.Contract(
      WolfsNFTJSON.address,
      WolfsNFTJSON.abi,
      signer
    );
    let arrayNFTs = await wolfsNFTInst.walletOfOwner(address);
    arrayNFTs = [...arrayNFTs].reverse();
    const itemsNFTs = [];
    let attackSum = 0;
    const pendingItemsArray = [] as any;
    const filtersItems = [] as any;
    const filtersItemsCount = [0, 0, 0, 0, 0, 0, 0] as any;

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
    const marketContract = await new web3.eth.Contract(
      Market.abi as [],
      Market.address as string
    );

    const multicall = new MultiCall(web3, config.MULTICALL);

    const callsItems = [] as any;
    for await (const tokenId of arrayNFTs) {
      callsItems.push({
        getWolfProperties: await contract.methods.getWolfProperties(
          tokenId.toString()
        ),
      });
    }

    let burnInt = 0;
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

      const callsItemsMarket= [];
      for (let index = 0; index < resultsItems[0]?.length; index += 1) {
        callsItemsMarket.push({
          sellerAddress: await marketContract.methods.getSellerAddress(
            wolfsNFTInst.address,
            arrayNFTs[index].toString()
          ),
        });
      }
      const resultsItemsMarket = await multicall.all([callsItemsMarket]);

      for (let index = 0; index < resultsItems[0]?.length; index += 1) {
        let used = false;
        let inMarket = false;

        if (resultsItemsUsed[0]) {
          used = resultsItemsUsed[0][index].getUsedWolf;
        }

        if (resultsItemsMarket[0]) {
          if (resultsItemsMarket[0][index].sellerAddress == address) {
            inMarket = true;
          }
        }

        let burned = false;
        if (localStorage.burnWolfs != null) {
          const burnWolfs = JSON.parse(localStorage.burnWolfs);

          if (burnWolfs && burnWolfs.length > 0) {
            const find = burnWolfs.find(
              (x: any) => x.toString() === arrayNFTs[index].toString()
            );

            if (find == null || find === undefined) {
            } else {
              burned = true;
              burnInt += 1;
            }
          }
        }

        if (used === false && burned === false && inMarket == false) {
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

          attackSum += attack;

          if (attack === 0 && defense === 0) {
            pendingItemsArray.push({
              id: arrayNFTs[index],
              defense: 0,
              attack: 0,
              breed: 'Air',
              level: 'Wood',
              type: 'wolf',
            });
          } else {
            itemsNFTs.push([
              attack,
              defense,
              gender,
              level,
              breed,
              arrayNFTs[index],
            ]);
            filtersItems[
              parseInt(resultsItems[0][index].getWolfProperties[2], 10) + 1
            ] = 'active';
            filtersItemsCount[
              parseInt(resultsItems[0][index].getWolfProperties[2], 10) + 1
            ] += 1;
          }
        }
      }

      if (burnInt === 0) {
        localStorage.removeItem('burnMaterials');
      }
    }

    setFilters(filtersItems);
    setFiltersCount(filtersItemsCount);
    setMintCount(pendingItemsArray.length);
    setItems(itemsNFTs);
    setPendingItems(pendingItemsArray);
    setCurrentWolves(itemsNFTs.length);
    setAttackPower(attackSum);
    eventGeneratedNFT();
  };
  const approveCWOLF = async () => {
    const web3 = new Web3(window.ethereum);
    const tokenInst = new web3.eth.Contract(
      CWolfTokenJSON.abi as [],
      CWolfTokenJSON.address as string
    );
    const allowanceBalance = await tokenInst.methods
      .allowance(address, WolfsNFTJSON.address)
      .call();
    if (Math.floor(allowanceBalance / 1e18) < 100) {
      approveToken(tokenInst);
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
        const priceBoxCWOLF = await variablesInst.methods
          .getDollarsInCWOLF((10 * 1e2).toString())
          .call();
        setPriceBox(priceBoxCWOLF / 1e2);
        setPriceCWOLF(
          Math.round(((numMint * priceBoxCWOLF) / 1e2 + Number.EPSILON) * 100) /
            100
        );
      };
      getPriceBox();
      approveCWOLF();
      getItemsNFTs();
    }
  }, [connect, web3Provider, address]);
  return (
    <div className="Cave">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
        />
        <title>{t('wolves')} | CryptoWolf</title>
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
              <div className="grid-3">
                <div>
                  {web3Provider ? (
                    <div className="item-box">
                      {t('mint-wolf')}
                      <input
                        type="number"
                        min="1"
                        max="10"
                        onChange={changeNumMint}
                        className="mt-10"
                        value={numMint}
                      />
                      <button
                        className="button button-regular social-header"
                        onClick={mintButton}
                      >
                        <img
                          src="/images/cases/box.svg"
                          alt="box"
                          className="mr-10"
                        />
                        {priceCWOLF !== 0 ? (
                          <>{priceCWOLF} $CWOLF</>
                        ) : (
                          <>... $CWOLF</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="item-box">Connect Your Wallet</div>
                  )}
                </div>
                <div>
                  <div className="item-box">
                    {t('current-wolves')}
                    {web3Provider ? (
                      <div>{currentWolves}</div>
                    ) : (
                      <div className="loading-ring"></div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="item-box">
                    {t('attack-power')}
                    {web3Provider ? (
                      <div>{attackPower}</div>
                    ) : (
                      <div className="loading-ring"></div>
                    )}
                  </div>
                </div>
              </div>
              {false && revealAction ? (
                <div className="ticker">
                  <div className="tickerShadow"></div>
                  <div
                    className="tickerSlider animation"
                    id="slider"
                    style={
                      tickerWidth > 0
                        ? {
                            width: `${tickerWidth}px`,
                            marginLeft: `-${tickerWidth}px`,
                            animation: `${tickerAnimation}`,
                          }
                        : { width: `unset` }
                    }
                  ></div>
                  {isRolling && <div className="tickerGlow"></div>}
                  <span className="tickerArrow">hi</span>
                  {spinnerItems}
                </div>
              ) : (
                <>
                  {false && mintCount > 0 && (
                    <div>
                      <div className="item-box big-box">
                        <div className="grid-2 mt-20">
                          <div className="text-center">
                            <h3>
                              {t('you-have', { ns: 'common' })} {mintCount}{' '}
                              {mintCount === 1 ? t('wolf') : t('wolves')}{' '}
                              {t('awaiting-for-delivery')}
                            </h3>
                            <p className="m-20">
                              {t('please-wait-5-minutes', { ns: 'common' })}
                            </p>
                            <img src="/images/card/card.png" alt="card" />
                            {revealBox ? (
                              <button
                                className="button button-regular social-header"
                                onClick={revealButton}
                              >
                                {t('reveal-wolf')}
                              </button>
                            ) : (
                              <button className="button button-regular social-header align-center">
                                <div className="loading-ring"></div>
                                {t('delivery-soon')}
                              </button>
                            )}
                          </div>
                          <div>
                            <h3>{t('wolves')}</h3>
                            <p className="mt-20">{t('wolves-info')}</p>
                            <h3 className="mt-50">
                              {t('probabilities', { ns: 'common' })}
                            </h3>
                            <div className="table-3 flex-wrap mt-20">
                              <div className="heading">
                                {t('probability', { ns: 'common' })}
                              </div>
                              <div className="heading">
                                {t('rarity', { ns: 'common' })}
                              </div>
                              <div className="heading">
                                {t('attack-defense')}
                              </div>

                              <div>1%</div>
                              <div>{t('diamond', { ns: 'common' })}</div>
                              <div>185-222</div>

                              <div>3%</div>
                              <div>{t('platinum', { ns: 'common' })}</div>
                              <div>144-185</div>

                              <div>6%</div>
                              <div>{t('gold', { ns: 'common' })}</div>
                              <div>114-144</div>

                              <div>12%</div>
                              <div>{t('silver', { ns: 'common' })}</div>
                              <div>76-114</div>

                              <div>24%</div>
                              <div>{t('bronze', { ns: 'common' })}</div>
                              <div>50-76</div>

                              <div>54%</div>
                              <div>{t('wood', { ns: 'common' })}</div>
                              <div>20-50</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="main-content">
                <>
                  <FilterBy
                    title={t('filter-by-wolf')}
                    all={t('all', { ns: 'common' })}
                    type="wolves"
                    pendingItems={pendingItems}
                    items={items}
                    filters={filters}
                    filtersCount={filtersCount}
                    toast={toast}
                    web3Provider={web3Provider}
                    deleteEventItem={deleteEventWolf}
                  />
                </>
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
    ...(await serverSideTranslations(locale, ['wolves', 'common', 'footer'])),
  },
});

export default Wolves;
