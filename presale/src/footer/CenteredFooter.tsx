function CenteredFooter() {
  return (
    <footer id="footer">
      <div className="footer">
        <div className="footer__left-block">
          <div className="footer__logo">
            <img src="/images/footer/icon_g.png" alt="CryptoWolf" />
          </div>
          <div className="footer__text-wrapper">
            <p>CryptoWolf © 2021 </p>
            <p>
              Cryptowolf is a browser game, so you can play on any device, be
              desktop or mobile phone where you can connect any WEB3 wallet, such
              as Metamask.
            </p>
            <p>CryptoWolf Limited A Building 1st Floor123, xxx Street</p>
          </div>
        </div>
        <div className="footer__right-block">
          <div className="footer__links">
            <div className="footer__help-link">
              <a href="#" className="footer-support">
                <i className="icon icon-mail" />
                help@CryptoWolf.finance
              </a>
              <a href="#" className="footer-faq">
                <i className="icon icon-sitemap" />
                Sitemap
              </a>
            </div>
          </div>
          <div className="footer__nav">
            <a href="#" test-id="link-partners">
              Partners
            </a>
            <a href="#" test-id="link-faq">
              F.A.Q.
            </a>
            <a href="#" test-id="link-tos">
              Terms of Service
            </a>
            <a href="#" test-id="link-privacy-policy">
              Privacy Policy
            </a>
            <a href="#" test-id="link-cookie-policy">
              Cookie Policy
            </a>
            <a href="#" test-id="link-contacts">
              Contacts
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default CenteredFooter;
