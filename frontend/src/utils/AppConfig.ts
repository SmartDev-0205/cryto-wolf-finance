const AppConfig = {
  site_name: 'CryptoWolf',
  title: 'CryptoWolf',
  description:
    'Cryptowolf is a browser game, so you can play on any device, be it desktop or mobile phone where you can connect any WEB3 wallet, such as Metamask.',
  locale: 'en',
  NETWORK: process.env.NEXT_PUBLIC_NETWORK,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  MULTICALL: process.env.NEXT_PUBLIC_MULTICALL,
  MULTICALL_DIVISOR: process.env.NEXT_PUBLIC_MULTICALL_DIVISOR,
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
};
export default AppConfig;
