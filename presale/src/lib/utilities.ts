import supportedChains from './chains';
import { IChainData } from './types';

// eslint-disable-next-line import/extensions
const { infuraId } = require('../../config.js');

export function getChainData(chainId?: number): IChainData {
  if (!chainId) {
    return null as any;
  }
  const chainData = supportedChains.filter(
    (chain: any) => chain.chain_id === chainId
  )[0];
  if (chainId !== 56) {
    window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [
        {
          chainId: '0x38',
        },
      ],
    });
  }
  if (!chainData) {
    return null as any;
  }

  const API_KEY = infuraId;

  if (
    chainData.rpc_url.includes('infura.io') &&
    chainData.rpc_url.includes('%API_KEY%') &&
    API_KEY
  ) {
    const rpcUrl = chainData.rpc_url.replace('%API_KEY%', API_KEY);

    return {
      ...chainData,
      rpc_url: rpcUrl,
    };
  }

  return chainData;
}

export function ellipseAddress(address = '', width = 4): string {
  if (!address) {
    return '';
  }
  return `${address.slice(0, width + 2)}...${address.slice(-width)}`;
}
