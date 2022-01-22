import { useCallback, useReducer, useContext, createContext } from 'react';

import WalletConnectProvider from '@walletconnect/web3-provider';
import { providers } from 'ethers';
import Web3Modal from 'web3modal';

import { getChainData } from '../lib/utilities';

const INFURA_ID = 'b596546b8ae94aa883f9830c1f90767f';

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: INFURA_ID, // required
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

const Web3Context = createContext({});

export const Web3ProviderContext = ({ children }: any) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const { provider, web3Provider, address, chainId } = state;
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
    /*
    const wolfsNFTInst = new ethers.Contract(
      wolfsNFTJSON.address,
      wolfsNFTJSON.abi,
      signer
    );

    const totalSupply = (await wolfsNFTInst.totalSupply()).toNumber();
    console.log(totalSupply);
    */
    dispatch({
      type: 'SET_WEB3_PROVIDER',
      provider,
      web3Provider,
      address,
      chainId: network.chainId,
    });
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

  const chainData = getChainData(chainId);

  return (
    <Web3Context.Provider
      value={{
        web3Modal,
        chainData,
        web3Provider,
        address,
        connect,
        disconnect,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export function useWeb3modal() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3modal debe estar dentro del proveedor Web3Context');
  }
  return context;
}

export default function Web3modal() {}
