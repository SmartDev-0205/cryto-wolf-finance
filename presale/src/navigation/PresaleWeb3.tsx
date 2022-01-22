/* eslint-disable func-names */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/no-shadow */
import { useCallback, useEffect, useState, useReducer } from 'react';

import WalletConnectProvider from '@walletconnect/web3-provider';
import { ethers, providers } from 'ethers';
import Link from 'next/link';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import Web3Modal from 'web3modal';

import presaleJSON from '../contracts/PresaleCWOLF.json';
/* import tokenABI from '../lib/tokenABI'; */
import { ellipseAddress, getChainData } from '../lib/utilities';

// eslint-disable-next-line import/extensions
const config = require('../../config.js');

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: config.infuraId, // required
    },
  },
};

let web3Modal: any;
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    network: 'mainnet', // optional
    cacheProvider: true,
    providerOptions, // required
  });
}

type StateType = {
  provider?: any;
  web3Provider?: any;
  address?: string;
  chainId?: number;
};

type ActionType =
  | {
      type: 'SET_WEB3_PROVIDER';
      provider?: StateType['provider'];
      web3Provider?: StateType['web3Provider'];
      address?: StateType['address'];
      chainId?: StateType['chainId'];
    }
  | {
      type: 'SET_ADDRESS';
      address?: StateType['address'];
    }
  | {
      type: 'SET_CHAIN_ID';
      chainId?: StateType['chainId'];
    }
  | {
      type: 'RESET_WEB3_PROVIDER';
    };

const initialState: StateType = {
  provider: null,
  web3Provider: null,
  address: '',
  chainId: 0,
};

function reducer(state: StateType, action: ActionType): StateType {
  switch (action.type) {
    case 'SET_WEB3_PROVIDER':
      return {
        ...state,
        provider: action.provider,
        web3Provider: action.web3Provider,
        address: action.address,
        chainId: action.chainId,
      };
    case 'SET_ADDRESS':
      return {
        ...state,
        address: action.address,
      };
    case 'SET_CHAIN_ID':
      return {
        ...state,
        chainId: action.chainId,
      };
    case 'RESET_WEB3_PROVIDER':
      return initialState;
    default:
      throw new Error();
  }
}

type IPresaleWeb3Props = {
  page: string;
};

const PresaleWeb3 = (props: IPresaleWeb3Props) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  /*
  const [maxBalanceBUSD, setMaxBalanceBUSD] = useState(0);
  */
  const [maxBalanceCWOLF, setMaxBalanceCWOLF] = useState(0);
  const [inputClaim, setInputClaim] = useState('');
  const [purchasesCWOLF, setPurchasesCWOLF] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [spinner, setSpinner] = useState(false);
  const [soldCWOLF, setSoldCWOLF] = useState(0);
  const [tokensCWOLFPurchases, setTokensCWOLFPurchases] = useState(0);
  const [progressBarWidth, setProgressBarWidth] = useState('0%');

  /*
  const minimumBidAmount = 100;
  const maxLimitBUSD = 20000;
  */
  const totalTokenPresale = 1000000;
  const { provider, web3Provider, address, chainId } = state;

  const presaleStats = async (saleInst: any, address: string) => {
    const CWOLFToken = await saleInst.methods.boughtTokens(address).call();
    if (CWOLFToken > 0) {
      const tokensPurchases = new Intl.NumberFormat('es-ES').format(
        parseFloat((CWOLFToken / 1e18).toFixed(2))
      );
      if (props.page === 'claim') {
        const CWOLFRemainingTokens = await saleInst.methods
          .remainingTokensUser(address)
          .call();
        const claimActive = await saleInst.methods.claimActive().call();
        let tokensToClaim;
        let CWOLFTokentoClaim;
        if (claimActive) {
          CWOLFTokentoClaim = await saleInst.methods
            .toBeClaimedNow(address)
            .call();
          tokensToClaim = new Intl.NumberFormat('es-ES').format(
            parseFloat((CWOLFTokentoClaim / 1e18).toFixed(2))
          );
        } else {
          tokensToClaim = 0;
          CWOLFTokentoClaim = 0;
        }
        const tokensRemaining = new Intl.NumberFormat('es-ES').format(
          parseFloat((CWOLFRemainingTokens / 1e18).toFixed(2))
        );
        setMaxBalanceCWOLF(parseFloat((CWOLFTokentoClaim / 1e18).toFixed(2)));
        setPurchasesCWOLF(
          `<div class="presale-table">
            You purchased: <div>${tokensPurchases} CWOLF</div>
          </div>
          <div class="presale-table">
          You have no claim: <div>${tokensRemaining} CWOLF</div>
          </div>
          <div class="presale-table">
            You can claim: <div>${tokensToClaim} CWOLF</div>
          </div>`
        );
      } else {
        setPurchasesCWOLF(
          `<div>
            You have ${tokensPurchases} CWOLF purchases in the presales.
          </div>`
        );
      }
      setTokensCWOLFPurchases(parseInt(tokensPurchases, 10));
    }
  };
  // eslint-disable-next-line func-names
  const connect = useCallback(async function () {
    // This is the initial `provider` that is returned when
    // using web3Modal to connect. Can be MetaMask or WalletConnect.
    const provider = await web3Modal.connect();

    // We plug the initial `provider` into ethers.js and get back
    // a Web3Provider. This will add on methods from ethers.js and
    // event listeners such as `.on()` will be different.
    const web3Provider = new providers.Web3Provider(provider);

    const signer = web3Provider.getSigner();
    const address = await signer.getAddress();

    const network = await web3Provider.getNetwork();

    dispatch({
      type: 'SET_WEB3_PROVIDER',
      provider,
      web3Provider,
      address,
      chainId: network.chainId,
    });

    const web3 = new Web3(window.ethereum);
    try {
      /*
      const tokenInst = new web3.eth.Contract(
        tokenABI as AbiItem[],
        config.busdAddress
      );
      */
      const saleInst = new web3.eth.Contract(
        presaleJSON.abi as AbiItem[],
        presaleJSON.address
      );
      /*
      const soldToken = await saleInst.methods.remainingSupply().call();
      
      const sold = totalTokenPresale - Math.floor(soldToken / 1e18);
      const percent = (sold / totalTokenPresale) * 100;
      */
      const sold = 1000000;
      const percent = 100;
      setSoldCWOLF(sold);
      setProgressBarWidth(`${percent}%`);
      /*
      saleInst.events.Buy().on('data', function (event: any) {
        console.log(`new event - transaction hash: ${event.transactionHash}`);
        const remainingSupply = Math.floor(
          // eslint-disable-next-line no-underscore-dangle
          event.returnValues._remainingSupply / 1e18
        );
        const sold = totalTokenPresale - remainingSupply;
        const percent = (sold / totalTokenPresale) * 100;
        setSoldCWOLF(sold);
        setProgressBarWidth(`${percent}%`);
        saleInst.methods
          .initialTokens(address)
          .call()
          .then((CWOLFToken: any) => {
            const tokensPurchases = parseFloat((CWOLFToken / 1e18).toFixed(2));
            setPurchasesCWOLF(
              `You have ${tokensPurchases} CWOLF purchases in the public presale`
            );
          });
      });
      */
      saleInst.events.Claim().on('data', function (event: any) {
        if (event.returnValues.addressClaim === address) {
          presaleStats(saleInst, address);
        }
      });

      presaleStats(saleInst, address);
      /*
      const balance = await tokenInst.methods.balanceOf(address).call();
      if (Math.floor(balance / 1e18) > maxLimitBUSD) {
        console.log(balance);
        setMaxBalanceBUSD(maxLimitBUSD);
      } else {
        setMaxBalanceBUSD(Math.floor(balance / 1e18));
      }
      */
    } catch (e) {
      console.log(e);
    }
  }, []);

  const disconnect = useCallback(
    async function () {
      await web3Modal.clearCachedProvider();
      if (provider?.disconnect && typeof provider.disconnect === 'function') {
        await provider.disconnect();
      }
      dispatch({
        type: 'RESET_WEB3_PROVIDER',
      });
    },
    [provider]
  );
  /*
  const paymentAction = async () => {
    setAlertMessage('');
    const web3 = new Web3(window.ethereum);
    const tokenInst = new web3.eth.Contract(
      tokenABI as AbiItem[],
      config.busdAddress
    );
    const allowanceBalance = await tokenInst.methods
      .allowance(address, presaleJSON.address)
      .call();
    if (
      Math.floor(allowanceBalance / 1e18) <
      parseInt((document.getElementById('bid') as HTMLInputElement).value, 10)
    ) {
      setAlertMessage(
        '<p class="red">You need to approve the spending of BUSD in your wallet</p>'
      );
      document.getElementById('buttonBuy')!.innerHTML = 'Approve';
    } else {
      const saleInst = new web3.eth.Contract(
        presaleJSON.abi as AbiItem[],
        presaleJSON.address
      );
      saleInst.methods
        .buy(
          ethers.utils.parseEther(
            (document.getElementById('bid') as HTMLInputElement).value
          )
        )
        .send({ from: address })
        .once('transactionHash', () => {
          setSpinner(true);
          (document.getElementById('buttonBuy') as HTMLInputElement).disabled =
            true;
        })
        .then((tx: any) => {
          console.log(tx);
          setSpinner(false);
          setAlertMessage(
            '<p>Your participation in the public presale has been registered</p>'
          );
          document.getElementById('buttonBuy')!.innerHTML = 'Payment';
        })
        .catch((e: any) => {
          setSpinner(false);
          (document.getElementById('buttonBuy') as HTMLInputElement).disabled =
            false;
          if (e.code === 4001) {
            setAlertMessage(
              '<p class="red">You need to make this last step of payment in order to participate</p>'
            );
          }
        });
    }
  };

  const paymentButton = async () => {
    setAlertMessage('');
    // obtiene el balance de la moneda principal de la red BNB en BSC
    web3Provider.getBalance(address).then(function (t: any) {
      if (parseFloat((t / 1e18).toFixed(6)) < 0.001)
        setAlertMessage(
          '<p class="red">You need at least 0.001 BNB to be able to pay for gas transactions.</p>'
        );
    });
    const web3 = new Web3(window.ethereum);
    const tokenInst = new web3.eth.Contract(
      tokenABI as AbiItem[],
      config.busdAddress
    );
    const allowanceBalance = await tokenInst.methods
      .allowance(address, presaleJSON.address)
      .call();
    if (
      Math.floor(allowanceBalance / 1e18) <
      parseInt((document.getElementById('bid') as HTMLInputElement).value, 10)
    ) {
      tokenInst.methods
        .approve(
          presaleJSON.address,
          ethers.utils.parseEther(
            (document.getElementById('bid') as HTMLInputElement).value
          )
        )
        .send({ from: address })
        .once('transactionHash', () => {
          setSpinner(true);
        })
        .then((tx: any) => {
          setSpinner(false);
          console.log(tx);
          setAlertMessage(
            '<p>You can now make the payment to participate in the presale.</p>'
          );
          document.getElementById('buttonBuy')!.innerHTML = 'Payment';
          paymentAction();
        })
        .catch((e: any) => {
          setSpinner(false);
          if (e.code === 4001) {
            setAlertMessage(
              '<p class="red">You need to approve the spending of BUSD in your wallet</p>'
            );
          }
        });
    } else {
      setAlertMessage(
        '<p>You can now make the payment to participate in the presale.<br />Click on the Payment button above again.</p>'
      );
      document.getElementById('buttonBuy')!.innerHTML = 'Payment';
      paymentAction();
    }
  };
  */
  const claimButton = async () => {
    setAlertMessage('');
    const web3 = new Web3(window.ethereum);
    const saleInst = new web3.eth.Contract(
      presaleJSON.abi as AbiItem[],
      presaleJSON.address
    );
    if (parseInt(inputClaim, 10) > 0) {
      saleInst.methods
        .claim(ethers.utils.parseEther(inputClaim).toString())
        .send({ from: address })
        .once('transactionHash', () => {
          setSpinner(true);
        })
        .then((_tx: any) => {
          setSpinner(false);
          setAlertMessage('<p>You have just received your CWOLF</p>');
        })
        .catch((e: any) => {
          setSpinner(false);
          if (e.code === 4001) {
            setAlertMessage(
              '<p class="red">Need to confirm the transaction to claim your CWOLFs</p>'
            );
          }
        });
    } else {
      setAlertMessage(
        '<p class="red">The amount to claim must be greater than 0</p>'
      );
    }
  };
  // Auto connect to the cached provider
  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connect();
    }
  }, [connect]);

  // A `provider` should come with EIP-1193 events. We'll listen for those events
  // here so that when a user switches accounts or networks, we can update the
  // local React state with that new information.
  useEffect(() => {
    setSpinner(false);
    if (provider?.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        dispatch({
          type: 'SET_ADDRESS',
          address: accounts[0],
        });
      };

      /*
      window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
              chainId: "0x38",
              rpcUrls: ["https://bsc-dataseed2.binance.org/"],
              blockExplorerUrls: ["https://bscscan.com"],
              chainName: "Binance Smart Chain",
              nativeCurrency: {
                  name: "BNB",
                  symbol: "BNB",
                  decimals: 18
              }
          }]
      });
      */

      const handleChainChanged = (chain: string) => {
        if (chain !== '0x38') {
          window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [
              {
                chainId: '0x38',
              },
            ],
          });
        }
        dispatch({
          type: 'SET_CHAIN_ID',
          chainId: parseInt(chain, 16),
        });
      };

      const handleDisconnect = (error: { code: number; message: string }) => {
        // eslint-disable-next-line no-console
        console.log('disconnect', error);
        disconnect();
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      provider.on('disconnect', handleDisconnect);

      // Subscription Cleanup
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
          provider.removeListener('disconnect', handleDisconnect);
        }
      };
    }
    return null as any;
  }, [provider, disconnect]);
  /*
  function receiveCWOLF(amountBSD: number) {
    (document.getElementById('bid') as HTMLInputElement).value =
      amountBSD.toString();
    const cwolfAmount = amountBSD / 0.8;
    let numberPrinter = '';
    if (Number.isNaN(amountBSD) || amountBSD < minimumBidAmount) {
      document.getElementById(
        'amountCWOLF'
      )!.innerHTML = `<p class="red">Minimum bid amount is ${minimumBidAmount} BUSD</p>`;
    } else if (amountBSD > maxBalanceBUSD) {
      numberPrinter = new Intl.NumberFormat('es-ES').format(maxBalanceBUSD);
      document.getElementById(
        'amountCWOLF'
      )!.innerHTML = `<p class="red">Your balance is ${numberPrinter} BUSD</p>`;
    } else {
      numberPrinter = new Intl.NumberFormat('es-ES').format(cwolfAmount);
      document.getElementById(
        'amountCWOLF'
      )!.innerHTML = `You will receive ${numberPrinter} CWOLF`;
    }
  }
  */
  function claimCWOLF(amountCWOLF: number) {
    if (amountCWOLF > maxBalanceCWOLF) {
      setInputClaim(maxBalanceCWOLF.toString());
    } else {
      setInputClaim(amountCWOLF.toString());
    }
  }
  const chainData = getChainData(chainId);
  return (
    <div className="Home">
      <div className="feast-wrapper">
        <header className="header">
          <div>
            <div className="main-menu">
              <div className="left-block">
                <Link href="/">
                  <a className="header-logo">
                    <img
                      className="header-logo__icon"
                      src="/images/icon.png"
                      alt="CRYPTOWOLF"
                      width="110"
                    />
                    <span className="header-logo-text_span">CRYPTOWOLF</span>
                  </a>
                </Link>
              </div>
              <div className="right-block">
                <div className="header-profile-wrapper">
                  <div className="header-profile">
                    {web3Provider ? (
                      <button
                        className="header-profile-sign-in button-log-in"
                        type="button"
                        onClick={disconnect}
                      >
                        {address && (
                          <p>
                            {chainData?.name}
                            <br />
                            {ellipseAddress(address)}
                          </p>
                        )}
                      </button>
                    ) : (
                      <button
                        className="header-profile-sign-in button-log-in"
                        type="button"
                        onClick={connect}
                      >
                        Connect
                        <br />
                        <span>Wallet</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main>
          <div>
            <div className="presale">
              <div className="presale-box">
                {props.page !== 'claim' ? (
                  <div className="info-box">
                    <div className="info-icon">
                      <svg className="info-svg" viewBox="0 0 448 433">
                        <radialGradient
                          id="XMLID_1_"
                          gradientUnits="userSpaceOnUse"
                          cy="393.79"
                          cx="216.7"
                          r="296.7"
                        >
                          <stop stopColor="#F4D708" offset="0" />
                          <stop stopColor="#FCB400" offset="1" />
                        </radialGradient>
                        <path
                          d="m8.551 390.5l184.85-368.8s26.409-31.504 52.815 0c26.41 31.501 180.19 370.65 180.19 370.65s3.105 18.534-27.961 18.534-361.94 0-361.94 0-23.299 0-27.959-20.38z"
                          fill="url(#XMLID_1_)"
                        />
                        <path
                          stroke="#E2A713"
                          strokeWidth="5"
                          d="m8.551 390.5l184.85-368.8s26.409-31.504 52.815 0c26.41 31.501 180.19 370.65 180.19 370.65s3.105 18.534-27.961 18.534-361.94 0-361.94 0-23.299 0-27.959-20.38z"
                          fill="none"
                        />
                        <path d="m212.5 292.63c-13.168-79.969-19.75-123.12-19.75-129.45 0-7.703 2.551-13.926 7.66-18.676 5.105-4.746 10.871-7.121 17.293-7.121 6.949 0 12.82 2.535 17.609 7.598s7.188 11.023 7.188 17.883c0 6.543-6.668 49.801-20 129.77h-10zm27 38.17c0 6.098-2.156 11.301-6.469 15.613-4.313 4.309-9.461 6.465-15.453 6.465-6.098 0-11.301-2.156-15.613-6.465-4.313-4.313-6.465-9.516-6.465-15.613 0-5.992 2.152-11.141 6.465-15.453s9.516-6.469 15.613-6.469c5.992 0 11.141 2.156 15.453 6.469s6.48 9.45 6.48 15.44z" />
                      </svg>
                    </div>

                    <div className="info-text">
                      <strong>
                        Sold out Private PreSale in less than 7 days
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div></div>
                )}
                {props.page === 'claim' ? (
                  <div className="presale-title">
                    <h2>Claim Your CWOLF</h2>
                  </div>
                ) : (
                  <div className="presale-title">
                    <h2>Public PreSale</h2>
                  </div>
                )}
                {web3Provider ? (
                  <>
                    <div
                      className="presale-remaining"
                      dangerouslySetInnerHTML={{ __html: purchasesCWOLF }}
                    ></div>
                    {props.page !== 'claim' && tokensCWOLFPurchases > 0 ? (
                      <div>
                        <a href="/claim/" className="btn btn-warning btn-buy">
                          Claim Your CWOLF
                        </a>
                      </div>
                    ) : (
                      <></>
                    )}
                    {props.page === 'claim' ? (
                      <>
                        <div className="position-relative">
                          <input
                            type="number"
                            id="claim"
                            placeholder="Claim amount"
                            value={inputClaim}
                            onChange={(e) => {
                              claimCWOLF(parseInt(e.target.value, 10));
                            }}
                          />
                          <button
                            type="button"
                            className="btn max-btn btn-warning px-3"
                            onClick={() => {
                              claimCWOLF(maxBalanceCWOLF);
                            }}
                          >
                            MAX
                          </button>
                        </div>
                        <button
                          type="button"
                          id="buttonBuy"
                          className="btn btn-warning btn-buy"
                          onClick={claimButton}
                        >
                          Claim
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="presale-number">
                          Sale
                          <div>
                            {new Intl.NumberFormat('es-ES').format(soldCWOLF)} /
                            1.000.000
                          </div>
                        </div>
                        <div className="progress">
                          <div
                            className="progress-bar bg-danger progress-bar-striped progress-bar-animated"
                            style={{ width: progressBarWidth }}
                          ></div>
                        </div>
                        <div className="presale-table">
                          Price per token: <div>0,80$</div>
                        </div>
                        <div className="presale-table">
                          Maximum Allocation:
                          <div>
                            20.000 BUSD
                            <span className="text-sm"> = 25.000 CWOLF</span>
                          </div>
                        </div>
                        <div className="presale-table">
                          CWOLF balance:
                          <div>
                            {new Intl.NumberFormat('es-ES').format(
                              totalTokenPresale - soldCWOLF
                            )}{' '}
                            CWOLF
                          </div>
                        </div>
                        <div className="border-bottom"></div>
                        <div className="presale-receive" id="amountCWOLF"></div>
                        <button
                          type="button"
                          id="buttonBuy"
                          className="btn btn-warning btn-buy disabled"
                          disabled
                        >
                          SOLD OUT
                        </button>
                      </>
                    )}
                    <div
                      className="presale-receive"
                      dangerouslySetInnerHTML={{ __html: alertMessage }}
                    ></div>
                    {spinner && (
                      <div className="center">
                        <div className="loading-ring"></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="presale-wallet">
                    <button type="button" onClick={connect}>
                      <img
                        src="/images/MetaMask.svg"
                        alt="MetaMask"
                        height="200"
                      />
                      <br />
                      Connect your Wallet
                      <br />
                      to enter the public sale
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="main-feast-section-wrapper">
              <div className="main-feast-section feast-section halloween-2021">
                <div className="main-feast-section__left-block">
                  <p className="main-feast-section__festival-name-text halloween-2021">
                    CryptoWolf
                  </p>
                  <div className="main-feast-section__event-timer-block">
                    <p>
                      Cryptowolf Finance is a NFT game that will allow you to
                      get involved in a virtual world where you are the leader
                      of a wolf pack. It will let you breed them, trade them,
                      send them to hunt different animals and confront other
                      wolf packs from other users.
                    </p>
                    <p>
                      The difference between Cryptowolf and the other games are
                      the different ways to monetize the game with a balanced
                      and perfect economy both for the user to earn money and
                      for the game to be stable over time.
                    </p>
                  </div>
                </div>
                <div className="main-feast-section__right-block">
                  <img src="/images/lobohielocorriendo.gif" alt="wolf" />
                </div>
              </div>
              <div className="social-header">
                <a
                  href="https://t.me/cryptowolfgame"
                  className="social-header__link social-header__telegram"
                  target="_blank"
                  rel="noreferrer"
                  title="NEWS English"
                >
                  <svg
                    width="32px"
                    height="32px"
                    viewBox="0 0 32 32"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M 26.070313 3.996094 C 25.734375 4.011719 25.417969 4.109375 25.136719 4.21875 L 25.132813 4.21875 C 24.847656 4.332031 23.492188 4.902344 21.433594 5.765625 C 19.375 6.632813 16.703125 7.757813 14.050781 8.875 C 8.753906 11.105469 3.546875 13.300781 3.546875 13.300781 L 3.609375 13.277344 C 3.609375 13.277344 3.25 13.394531 2.875 13.652344 C 2.683594 13.777344 2.472656 13.949219 2.289063 14.21875 C 2.105469 14.488281 1.957031 14.902344 2.011719 15.328125 C 2.101563 16.050781 2.570313 16.484375 2.90625 16.722656 C 3.246094 16.964844 3.570313 17.078125 3.570313 17.078125 L 3.578125 17.078125 L 8.460938 18.722656 C 8.679688 19.425781 9.949219 23.597656 10.253906 24.558594 C 10.433594 25.132813 10.609375 25.492188 10.828125 25.765625 C 10.933594 25.90625 11.058594 26.023438 11.207031 26.117188 C 11.265625 26.152344 11.328125 26.179688 11.390625 26.203125 C 11.410156 26.214844 11.429688 26.21875 11.453125 26.222656 L 11.402344 26.210938 C 11.417969 26.214844 11.429688 26.226563 11.441406 26.230469 C 11.480469 26.242188 11.507813 26.246094 11.558594 26.253906 C 12.332031 26.488281 12.953125 26.007813 12.953125 26.007813 L 12.988281 25.980469 L 15.871094 23.355469 L 20.703125 27.0625 L 20.8125 27.109375 C 21.820313 27.550781 22.839844 27.304688 23.378906 26.871094 C 23.921875 26.433594 24.132813 25.875 24.132813 25.875 L 24.167969 25.785156 L 27.902344 6.65625 C 28.007813 6.183594 28.035156 5.742188 27.917969 5.3125 C 27.800781 4.882813 27.5 4.480469 27.136719 4.265625 C 26.769531 4.046875 26.40625 3.980469 26.070313 3.996094 Z M 25.96875 6.046875 C 25.964844 6.109375 25.976563 6.101563 25.949219 6.222656 L 25.949219 6.234375 L 22.25 25.164063 C 22.234375 25.191406 22.207031 25.25 22.132813 25.308594 C 22.054688 25.371094 21.992188 25.410156 21.667969 25.28125 L 15.757813 20.75 L 12.1875 24.003906 L 12.9375 19.214844 C 12.9375 19.214844 22.195313 10.585938 22.59375 10.214844 C 22.992188 9.84375 22.859375 9.765625 22.859375 9.765625 C 22.886719 9.3125 22.257813 9.632813 22.257813 9.632813 L 10.082031 17.175781 L 10.078125 17.15625 L 4.242188 15.191406 L 4.242188 15.1875 C 4.238281 15.1875 4.230469 15.183594 4.226563 15.183594 C 4.230469 15.183594 4.257813 15.171875 4.257813 15.171875 L 4.289063 15.15625 L 4.320313 15.144531 C 4.320313 15.144531 9.53125 12.949219 14.828125 10.71875 C 17.480469 9.601563 20.152344 8.476563 22.207031 7.609375 C 24.261719 6.746094 25.78125 6.113281 25.867188 6.078125 C 25.949219 6.046875 25.910156 6.046875 25.96875 6.046875 Z" />
                  </svg>
                  <img
                    className="superSVG"
                    src="/images/english.svg"
                    alt="English"
                  />
                  <img
                    className="superSVG2"
                    src="/images/news-feed.svg"
                    alt="English"
                  />
                </a>
                <a
                  href="https://t.me/joinchat/hEA4Vj5W7Ag5YjFk"
                  className="social-header__link social-header__telegram"
                  target="_blank"
                  rel="noreferrer"
                  title="Group English"
                >
                  <svg
                    width="32px"
                    height="32px"
                    viewBox="0 0 32 32"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M 26.070313 3.996094 C 25.734375 4.011719 25.417969 4.109375 25.136719 4.21875 L 25.132813 4.21875 C 24.847656 4.332031 23.492188 4.902344 21.433594 5.765625 C 19.375 6.632813 16.703125 7.757813 14.050781 8.875 C 8.753906 11.105469 3.546875 13.300781 3.546875 13.300781 L 3.609375 13.277344 C 3.609375 13.277344 3.25 13.394531 2.875 13.652344 C 2.683594 13.777344 2.472656 13.949219 2.289063 14.21875 C 2.105469 14.488281 1.957031 14.902344 2.011719 15.328125 C 2.101563 16.050781 2.570313 16.484375 2.90625 16.722656 C 3.246094 16.964844 3.570313 17.078125 3.570313 17.078125 L 3.578125 17.078125 L 8.460938 18.722656 C 8.679688 19.425781 9.949219 23.597656 10.253906 24.558594 C 10.433594 25.132813 10.609375 25.492188 10.828125 25.765625 C 10.933594 25.90625 11.058594 26.023438 11.207031 26.117188 C 11.265625 26.152344 11.328125 26.179688 11.390625 26.203125 C 11.410156 26.214844 11.429688 26.21875 11.453125 26.222656 L 11.402344 26.210938 C 11.417969 26.214844 11.429688 26.226563 11.441406 26.230469 C 11.480469 26.242188 11.507813 26.246094 11.558594 26.253906 C 12.332031 26.488281 12.953125 26.007813 12.953125 26.007813 L 12.988281 25.980469 L 15.871094 23.355469 L 20.703125 27.0625 L 20.8125 27.109375 C 21.820313 27.550781 22.839844 27.304688 23.378906 26.871094 C 23.921875 26.433594 24.132813 25.875 24.132813 25.875 L 24.167969 25.785156 L 27.902344 6.65625 C 28.007813 6.183594 28.035156 5.742188 27.917969 5.3125 C 27.800781 4.882813 27.5 4.480469 27.136719 4.265625 C 26.769531 4.046875 26.40625 3.980469 26.070313 3.996094 Z M 25.96875 6.046875 C 25.964844 6.109375 25.976563 6.101563 25.949219 6.222656 L 25.949219 6.234375 L 22.25 25.164063 C 22.234375 25.191406 22.207031 25.25 22.132813 25.308594 C 22.054688 25.371094 21.992188 25.410156 21.667969 25.28125 L 15.757813 20.75 L 12.1875 24.003906 L 12.9375 19.214844 C 12.9375 19.214844 22.195313 10.585938 22.59375 10.214844 C 22.992188 9.84375 22.859375 9.765625 22.859375 9.765625 C 22.886719 9.3125 22.257813 9.632813 22.257813 9.632813 L 10.082031 17.175781 L 10.078125 17.15625 L 4.242188 15.191406 L 4.242188 15.1875 C 4.238281 15.1875 4.230469 15.183594 4.226563 15.183594 C 4.230469 15.183594 4.257813 15.171875 4.257813 15.171875 L 4.289063 15.15625 L 4.320313 15.144531 C 4.320313 15.144531 9.53125 12.949219 14.828125 10.71875 C 17.480469 9.601563 20.152344 8.476563 22.207031 7.609375 C 24.261719 6.746094 25.78125 6.113281 25.867188 6.078125 C 25.949219 6.046875 25.910156 6.046875 25.96875 6.046875 Z" />
                  </svg>
                  <img
                    className="superSVG"
                    src="/images/english.svg"
                    alt="English"
                  />
                </a>
                <a
                  href="https://t.me/joinchat/o__1r4O4KlI4OWFk"
                  className="social-header__link social-header__telegram"
                  target="_blank"
                  rel="noreferrer"
                  title="Group Spanish"
                >
                  <svg
                    width="32px"
                    height="32px"
                    viewBox="0 0 32 32"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M 26.070313 3.996094 C 25.734375 4.011719 25.417969 4.109375 25.136719 4.21875 L 25.132813 4.21875 C 24.847656 4.332031 23.492188 4.902344 21.433594 5.765625 C 19.375 6.632813 16.703125 7.757813 14.050781 8.875 C 8.753906 11.105469 3.546875 13.300781 3.546875 13.300781 L 3.609375 13.277344 C 3.609375 13.277344 3.25 13.394531 2.875 13.652344 C 2.683594 13.777344 2.472656 13.949219 2.289063 14.21875 C 2.105469 14.488281 1.957031 14.902344 2.011719 15.328125 C 2.101563 16.050781 2.570313 16.484375 2.90625 16.722656 C 3.246094 16.964844 3.570313 17.078125 3.570313 17.078125 L 3.578125 17.078125 L 8.460938 18.722656 C 8.679688 19.425781 9.949219 23.597656 10.253906 24.558594 C 10.433594 25.132813 10.609375 25.492188 10.828125 25.765625 C 10.933594 25.90625 11.058594 26.023438 11.207031 26.117188 C 11.265625 26.152344 11.328125 26.179688 11.390625 26.203125 C 11.410156 26.214844 11.429688 26.21875 11.453125 26.222656 L 11.402344 26.210938 C 11.417969 26.214844 11.429688 26.226563 11.441406 26.230469 C 11.480469 26.242188 11.507813 26.246094 11.558594 26.253906 C 12.332031 26.488281 12.953125 26.007813 12.953125 26.007813 L 12.988281 25.980469 L 15.871094 23.355469 L 20.703125 27.0625 L 20.8125 27.109375 C 21.820313 27.550781 22.839844 27.304688 23.378906 26.871094 C 23.921875 26.433594 24.132813 25.875 24.132813 25.875 L 24.167969 25.785156 L 27.902344 6.65625 C 28.007813 6.183594 28.035156 5.742188 27.917969 5.3125 C 27.800781 4.882813 27.5 4.480469 27.136719 4.265625 C 26.769531 4.046875 26.40625 3.980469 26.070313 3.996094 Z M 25.96875 6.046875 C 25.964844 6.109375 25.976563 6.101563 25.949219 6.222656 L 25.949219 6.234375 L 22.25 25.164063 C 22.234375 25.191406 22.207031 25.25 22.132813 25.308594 C 22.054688 25.371094 21.992188 25.410156 21.667969 25.28125 L 15.757813 20.75 L 12.1875 24.003906 L 12.9375 19.214844 C 12.9375 19.214844 22.195313 10.585938 22.59375 10.214844 C 22.992188 9.84375 22.859375 9.765625 22.859375 9.765625 C 22.886719 9.3125 22.257813 9.632813 22.257813 9.632813 L 10.082031 17.175781 L 10.078125 17.15625 L 4.242188 15.191406 L 4.242188 15.1875 C 4.238281 15.1875 4.230469 15.183594 4.226563 15.183594 C 4.230469 15.183594 4.257813 15.171875 4.257813 15.171875 L 4.289063 15.15625 L 4.320313 15.144531 C 4.320313 15.144531 9.53125 12.949219 14.828125 10.71875 C 17.480469 9.601563 20.152344 8.476563 22.207031 7.609375 C 24.261719 6.746094 25.78125 6.113281 25.867188 6.078125 C 25.949219 6.046875 25.910156 6.046875 25.96875 6.046875 Z" />
                  </svg>
                  <svg className="superSVG" viewBox="0 0 512 512">
                    <path
                      fill="#FFDA44"
                      d="M0,256c0,31.314,5.633,61.31,15.923,89.043L256,367.304l240.077-22.261
                    C506.367,317.31,512,287.314,512,256s-5.633-61.31-15.923-89.043L256,144.696L15.923,166.957C5.633,194.69,0,224.686,0,256z"
                    />
                    <g>
                      <path
                        fill="#D80027"
                        d="M496.077,166.957C459.906,69.473,366.071,0,256,0S52.094,69.473,15.923,166.957H496.077z"
                      />
                      <path
                        fill="#D80027"
                        d="M15.923,345.043C52.094,442.527,145.929,512,256,512s203.906-69.473,240.077-166.957H15.923z"
                      />
                    </g>
                  </svg>
                </a>
                <a
                  href="https://discord.com/invite/vbSzw4gAwR"
                  target="_blank"
                  rel="nofollow noreferrer"
                  className="social-header__link social-header__discord"
                  title="discord"
                  test-id="social-discort"
                >
                  <i className="icon icon-discord" />
                </a>
                <a
                  href="https://www.instagram.com/cryptowolfgame/"
                  target="_blank"
                  rel="nofollow noreferrer"
                  className="social-header__link social-header__instagram"
                  title="instagram"
                  test-id="social-instagram"
                >
                  <i className="icon icon-instagram" />
                </a>
                <a
                  href="https://twitter.com/cryptowolfgame"
                  target="_blank"
                  rel="nofollow noreferrer"
                  className="social-header__link social-header__twitter"
                  title="twitter"
                  test-id="social-twitter"
                >
                  <i className="icon icon-twitter" />
                </a>
              </div>
              <div className="social-header">
                <div>
                  <img src="/images/unity.png" alt="Unity" />
                </div>
                <div>
                  <img src="/images/binance.png" alt="BSC" />
                </div>
              </div>
              <div className="social-header">
                <div>
                  <a
                    href="https://cryptowolf.gitbook.io/english/"
                    className="button button-regular button-regular"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Whitepaper: English
                  </a>
                </div>
                <div>
                  <a
                    href="https://cryptowolf.gitbook.io/spanish/"
                    className="button button-regular button-regular"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Whitepaper: Spanish
                  </a>
                </div>
              </div>

              <div className="secondary-section">
                <div className="section-container">
                  <div className="title-block">
                    <h3>Mint your materials & wolfs</h3>
                    <h4>Create your wolf pack & win CWOLF</h4>
                  </div>
                  <div className="cases-grid">
                    {/* 1 */}
                    <div className="case-item limited event-case">
                      <div className="image-wrapper">
                        <img
                          alt="CryptoWolf #4523"
                          className="lazy-img case-img entered error"
                          src="/images/lobo1-300.png"
                        />
                      </div>
                      <span className="item-text">
                        Wolves are the main characters of our game. Each wolf
                        will have different characteristics.
                      </span>
                    </div>
                    <div className="case-item limited event-case">
                      <div className="image-wrapper">
                        <img
                          alt="CryptoWolf #3552"
                          className="lazy-img case-img entered error"
                          src="/images/lobo2-300.png"
                        />
                      </div>
                      <span className="item-text">
                        Become an owner of a unique NFT wolf or put your own
                        wolf for sale. All transactions are settled in
                        CryptoWolf native token $CWOLF.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* footer-section */}
          <div className="footer-section-wrapper">
            <div className="footer-section">
              <div className="footer-section__left-block">
                <img src="/images/wolves/wolf_footer2.png" alt="wolf footer" />
              </div>
              <div className="footer-section__right-block">
                <div className="footer-section__text">&nbsp;</div>
                <div className="footer-section__text">
                  <p>
                    IT IS TIME <br /> TO HUNT
                  </p>
                  <p>Just connect your wallet</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PresaleWeb3;
