/* eslint-disable import/no-extraneous-dependencies */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  poweredByHeader: false,
  trailingSlash: true,
  basePath: '',
  // The starter code load resources from `public` folder with `router.basePath` in React components.
  // So, the source code is "basePath-ready".
  // You can remove `basePath` if you don't need it.
  reactStrictMode: true,
});

module.exports = {
  /*
  i18n: {
    localeDetection: false,
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
  */
  env: {
    // BUSD Contract
    // BUSD Main Net - 0xe9e7cea3dedca5984780bafc599bd69add087d56
    // BUSD Test Net - 0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee
    // USDT Rinkeby  - 0xd9ba894e0097f8cc2bbc9d24d308b98e36dc6d02
    BUSDAdress: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
    PreSaleAdress: '0x8c5921a9563e6d5dda95cb46b572bb1cc9b04a27',
    INFURA_ID: 'b596546b8ae94aa883f9830c1f90767f',
  },
  trailingSlash: true,
  images: {
    domains: ['app.nfts2me.com'],
  },
};
