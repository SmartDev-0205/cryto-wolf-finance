import { useTranslation } from 'next-i18next';

function CenteredFooter() {
  const { t } = useTranslation('footer');
  return (
    <footer id="footer">
      {/* footer-section */}
      <div className="footer-section-wrapper">
        <div className="footer-section">
          <div className="footer-section__left-block">
            <img src="https://cdn.cryptowolf.finance/images/wolves/wolf_footer2.png" alt="wolf footer" />
          </div>
          <div className="footer-section__right-block">
            <div className="footer-section__text">&nbsp;</div>
            <div className="footer-section__text">
              <p>
                {t('it-is-time')} <br /> {t('to-hunt')}
              </p>
              <p>{t('connect-wallet')}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <div className="footer__left-block">
          <div className="footer__logo">
            <img src="https://cdn.cryptowolf.finance/images/footer/icon_g.png" alt="CryptoWolf" />
          </div>
          <div className="footer__text-wrapper">
            <p>CryptoWolf © 2021 </p>
            <p>{t('description-footer')}</p>
            <p>CryptoWolf.finance Limited</p>
          </div>
        </div>
        <div className="footer__right-block">
          <div className="footer__links">
            <div>
              <a
                href="https://whitepaperen.cryptowolf.finance/"
                className="button button-regular button-regular"
                target="_blank"
                rel="noreferrer"
              >
                {t('whitepaper-english')}
              </a>
            </div>
            <div>
              <a
                href="https://whitepaper.cryptowolf.finance/"
                className="button button-regular button-regular"
                target="_blank"
                rel="noreferrer"
              >
                {t('whitepaper-spanish')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default CenteredFooter;
