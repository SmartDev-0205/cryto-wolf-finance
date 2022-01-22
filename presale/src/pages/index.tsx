import * as React from 'react';

import Head from 'next/head';

import PresaleWeb3 from '../navigation/PresaleWeb3';

function PreSale() {
  return (
    <div className="Home">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
        />
        <title>Presale - CryptoWolf</title>
        <meta name="description" content="CryptoWolf" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <PresaleWeb3 page="presale" />
    </div>
  );
}

export default PreSale;
