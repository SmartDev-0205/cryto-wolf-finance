import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import Link from 'next/link';

import ContractMetamask from '../components/elements/ContractMetamask';
import SocialButtons from '../components/elements/SocialButtons';
import CenteredFooter from '../footer/CenteredFooter';
import MainMenu from '../navigation/MainMenu';

function Home() {
  const { t } = useTranslation('home');
  return (
    <div className="Home">
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0,user-scalable=0"
        />
        <title>CryptoWolf</title>
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
              <div className="main-feast-section feast-section halloween-2021">
                <div className="main-feast-section__left-block">
                  <p className="main-feast-section__festival-name-text halloween-2021">
                    CryptoWolf
                  </p>
                  <div className="main-feast-section__event-timer-block">
                    <p>{t('description')}</p>
                    <p>{t('description2')}</p>
                  </div>
                </div>
                <div className="main-feast-section__right-block">
                  <img
                    src="https://cdn.cryptowolf.finance/images/lobocorriendo.gif"
                    alt="wolf"
                  />
                </div>
              </div>
            </div>
            {/* <div className="secondary-section">
              <div className="section-container">
                <div className="title-block">
                  <h3>{t('presales')}</h3>
                  <h4>{t('wolf-pack-metaverse')}</h4>
                </div>
                <div className="cases-grid">
                  <div className="case-item limited event-case">
                    <div className="box-presale">
                      <h3>{t('private-presale')}</h3>
                      <h4>1.000.000 Tokens</h4>
                      <h4 className="box-presale-price">Token: 0,5 BUSD</h4>
                      <a href="#!" className="button button-regular button-red">
                        {t('sold-out')}
                      </a>
                    </div>
                  </div>
                  <div className="case-item limited event-case">
                    <div className="box-presale">
                      <h3>{t('public-presale')}</h3>
                      <h4>1.000.000 Tokens</h4>
                      <h4 className="box-presale-price">Token: 0,8 BUSD</h4>
                      <a
                        href="https://presale.cryptowolf.finance/"
                        className="button button-regular button-red"
                      >
                        {t('sold-out')}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
            <div className="secondary-section">
              <div className="section-container">
                <div className="title-block">
                  <h3>{t('join-cryptoWolf')}</h3>
                  <h4>{t('create-your-wolf-pack')}</h4>
                </div>
                <div className="cases-grid">
                  {/* 1 */}
                  <div className="case-item limited event-case">
                    <Link href="/wolves/">
                      <a>
                        <div className="image-wrapper">
                          <img
                            alt="CryptoWolf #4523"
                            className="lazy-img case-img entered error"
                            src="https://cdn.cryptowolf.finance/images/lobo1-300.png"
                          />
                        </div>
                        <span className="title">{t('wolves')}</span>
                        <span className="item-text">
                          {t('wolves-description')}
                        </span>
                        <span className="action-wrapper">
                          <span className="button button-regular button-regular">
                            {t('explore')}
                          </span>
                        </span>
                      </a>
                    </Link>
                  </div>
                  <div className="case-item limited event-case">
                    <Link href="/marketplace/">
                      <a>
                        <div className="image-wrapper">
                          <img
                            alt="CryptoWolf #3552"
                            className="lazy-img case-img entered error"
                            src="https://cdn.cryptowolf.finance/images/lobo2-300.png"
                          />
                        </div>
                        <span className="title">{t('marketplace')}</span>
                        <span className="item-text">
                          {t('marketplace-description')}
                        </span>
                        <span className="action-wrapper">
                          <span className="button button-regular button-regular">
                            {t('explore')}
                          </span>
                        </span>
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="third-section">
              <div className="third-container">
                <div>
                  <h3>{t('cryptowolf-is-here')}</h3>
                  <ContractMetamask />
                </div>
                <div>
                  <h3>{t('keep-up-to-date')}</h3>
                  <SocialButtons />
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
    ...(await serverSideTranslations(locale, ['common', 'home', 'footer'])),
  },
});

export default Home;
