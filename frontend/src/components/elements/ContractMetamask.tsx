import { useTranslation } from 'next-i18next';
import Link from 'next/link';

function ContractMetamask() {
  const { t } = useTranslation('common');
  async function addMetamask() {
    const tokenAddress = '0x8c5921a9563e6d5dda95cb46b572bb1cc9b04a27';
    const tokenSymbol = 'CWOLF';
    const tokenDecimals = 18;
    const tokenImage = 'https://www.cryptowolf.finance/images/favicon.png';
    if (window.ethereum) {
      console.log('add Metamask');
      try {
        // wasAdded is a boolean. Like any RPC method, an error may be thrown.
        const wasAdded = await window.ethereum.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20', // Initially only supports ERC20, but eventually more!
            options: {
              address: tokenAddress, // The address that the token is at.
              symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
              decimals: tokenDecimals, // The number of decimals in the token
              image: tokenImage, // A string url of the token logo
            },
          },
        });
        if (wasAdded) {
          console.log('Thanks for your interest!');
        } else {
          console.log('Your loss!');
        }
      } catch (error) {
        console.log(error);
      }
    } else console.log('NO Metamask');
  }
  return (
    <div className="m-40">
      {t('cwolf-contract')}:
      <br />
      <a
        href="https://pancakeswap.finance/swap?outputCurrency=0x8c5921a9563e6d5dda95cb46b572bb1cc9b04a27"
        target="_blank"
        rel="noreferrer"
      >
        <img
          src="https://cdn.cryptowolf.finance/images/pancakeswap2.png"
          alt="pancakeswap"
        />
      </a>
      <div className="social-header">
        <Link href="https://bscscan.com/address/0x8c5921a9563e6d5dda95cb46b572bb1cc9b04a27">
          <a rel="noopener" target="_blank" className="mr-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="27px"
              height="30px"
              viewBox="0 0 121.378 121.333"
            >
              <g
                id="bscscan-logo-light-circle"
                transform="translate(-219.378 -213.334)"
              >
                <path
                  id="Path_1"
                  data-name="Path 1"
                  d="M244.6,271.1a5.144,5.144,0,0,1,5.168-5.143l8.568.028a5.151,5.151,0,0,1,5.151,5.151v32.4c.965-.286,2.2-.591,3.559-.911a4.292,4.292,0,0,0,3.309-4.177V258.261a5.152,5.152,0,0,1,5.151-5.152H284.1a5.152,5.152,0,0,1,5.151,5.152v37.3s2.15-.87,4.243-1.754a4.3,4.3,0,0,0,2.625-3.957V245.383a5.151,5.151,0,0,1,5.15-5.151h8.585A5.151,5.151,0,0,1,315,245.383V282c7.443-5.394,14.986-11.882,20.972-19.683a8.646,8.646,0,0,0,1.316-8.072,60.636,60.636,0,1,0-109.855,50.108,7.668,7.668,0,0,0,7.316,3.79c1.624-.143,3.646-.345,6.05-.627a4.29,4.29,0,0,0,3.805-4.258V271.1"
                  fill="#fff"
                ></path>
                <path
                  id="Path_2"
                  data-name="Path 2"
                  d="M244.417,323.061A60.656,60.656,0,0,0,340.756,274c0-1.4-.065-2.778-.158-4.152-22.163,33.055-63.085,48.508-96.181,53.213"
                  fill="#f0b90b"
                ></path>
              </g>
            </svg>
          </a>
        </Link>
        <div>0x8c5921a9563e6d5dda95cb46b572bb1cc9b04a27</div>
      </div>
      <div className="social-header">
        <button
          className="button button-regular button-regular social-header"
          onClick={addMetamask}
        >
          <img
            src="/images/metamask.png"
            alt={t('add-to-metamask')}
            className="mr-10"
          />
          {t('add-to-metamask')}
        </button>
      </div>
    </div>
  );
}

export default ContractMetamask;
