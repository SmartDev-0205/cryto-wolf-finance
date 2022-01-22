import { useEffect, useState } from "react";

import { ethers } from "ethers";
import Link from "next/link";
import { useRouter } from "next/router";

import { usePlayPause } from "../../context/PlayPauseAnimation";
import { useWeb3modal } from "../../context/Web3modal";
import ClaimJSON from "../../contracts/Claim.json";
import { useToast } from "../toast/ToastProvider";
import Web3 from "web3";
import CWolfTokenJSON from "../../contracts/CWolfToken.json";
import Modal from "react-modal";
import { useTranslation } from "next-i18next";
import VariablesJSON from "../../contracts/Variables.json";

const customStyles = {
  content: {
    width: "40%",
    height: "20%",
    margin: "auto",
  },
};

function SettingsButtons() {
  const toast = useToast();
  const { play, setPlay }: any = usePlayPause();
  const { web3Provider, address }: any = useWeb3modal();
  const [taxAmount, setTaxAmount] = useState(0);
  const [nextTaxAmount, setNextTaxAmount] = useState(0);
  const [claimAmount, setClaimAmount] = useState(0);
  const [modalClaimIsOpen, setModalClaimIsOpen] = useState(false);
  const [claimAmountCWOLF, setClaimAmountCWOLF] = useState(0);
  const { t } = useTranslation("common");

  const buttonPlayPauseAnimation = () => {
    setPlay(!play);
  };
  const router = useRouter();

  async function openModalClaim() {
    setModalClaimIsOpen(true);
  }
  function closeModalClaim() {
    setModalClaimIsOpen(false);
  }

  function removeZeros(number: number) {
    let newNumber = ethers.utils.formatUnits(number, 18);

    return parseFloat(newNumber)
      .toFixed(2)
      .replace(/(\.0+|0+)$/, "");
  }

  const getCanClaim = async () => {
    const signer = web3Provider.getSigner();

    const ClaimInst = new ethers.Contract(
      ClaimJSON.address,
      ClaimJSON.abi,
      signer
    );

    let usersTaxAmount = await ClaimInst.usersTaxAmount(address);
    usersTaxAmount = usersTaxAmount.toString();
    const usersAmount = await ClaimInst.usersAmount(address);

    let nextTax = 0;

    if (parseInt("" + usersTaxAmount / 100, 10) == 0) {
      nextTax = 45;
    } else if (
      parseInt("" + usersTaxAmount / 100, 10) >= 1 &&
      parseInt("" + usersTaxAmount / 100, 10) <= 45
    ) {
      nextTax = 54;
    } else if (
      parseInt("" + usersTaxAmount / 100, 10) >= 46 &&
      parseInt("" + usersTaxAmount / 100, 10) <= 54
    ) {
      nextTax = 63;
    } else if (
      parseInt("" + usersTaxAmount / 100, 10) >= 54 &&
      parseInt("" + usersTaxAmount / 100, 10) <= 63
    ) {
      nextTax = 72;
    } else if (
      parseInt("" + usersTaxAmount / 100, 10) >= 63 &&
      parseInt("" + usersTaxAmount / 100, 10) <= 72
    ) {
      nextTax = 81;
    } else if (
      parseInt("" + usersTaxAmount / 100, 10) >= 72 &&
      parseInt("" + usersTaxAmount / 100, 10) <= 81
    ) {
      nextTax = 90;
    } else if (
      parseInt("" + usersTaxAmount / 100, 10) >= 81 &&
      parseInt("" + usersTaxAmount / 100, 10) <= 90
    ) {
      nextTax = 90;
    } else if (parseInt("" + usersTaxAmount / 100, 10) >= 90) {
      nextTax = 90;
    }

    /* const variablesInst = new ethers.Contract(
      VariablesJSON.address,
      VariablesJSON.abi,
      signer
    );

    let cwolf = await variablesInst.getDollarsInCWOLF(usersAmount);

    if (cwolf != null) {
      cwolf = Number(removeZeros(cwolf));
    } else {
      cwolf = 0;
    } */

    setTaxAmount(parseInt("" + usersTaxAmount / 100, 10));
    setNextTaxAmount(nextTax);
    setClaimAmount(Number(removeZeros(usersAmount)));
    setClaimAmountCWOLF(Number(removeZeros(usersAmount)));
  };

  const actionClaim = async () => {
    const signer = web3Provider.getSigner();

    const ClaimInst = new ethers.Contract(
      ClaimJSON.address,
      ClaimJSON.abi,
      signer
    );

    const claimReward = await ClaimInst.claimReward().then(
      (_result: any) => {
        closeModalClaim();
        toast?.pushSuccess("Reward claimed correctly.", 8000);
        getCanClaim();
      },
      (_error: any) => {
        toast?.pushError("Reward claim canceled.", 8000);
      }
    );
  };

  const approveToken = async (tokenInst: any) => {
    tokenInst.methods
      .approve(ClaimJSON.address, ethers.utils.parseEther("100000000"))
      .send({ from: address })
      .once("transactionHash", () => {
        toast?.pushInfo("Approving purchase of Wolves with CWOLF", 8000);
      })
      .then((_tx: any) => {
        toast?.pushInfo(
          "You have approved the purchase of Wolves with CWOLF",
          8000
        );
      })
      .catch((e: any) => {
        if (e.code === 4001) {
          toast?.pushError(
            "You need to approve the spending of CWOLF in your wallet",
            8000
          );
        }
      });
  };

  const approveCWOLF = async () => {
    const web3 = new Web3(window.ethereum);
    const tokenInst = new web3.eth.Contract(
      CWolfTokenJSON.abi as [],
      CWolfTokenJSON.address as string
    );
    const allowanceBalance = await tokenInst.methods
      .allowance(address, ClaimJSON.address)
      .call();
    if (Math.floor(allowanceBalance / 1e18) < 100) {
      approveToken(tokenInst);
    }
  };

  useEffect(() => {
    if (web3Provider) {
      approveCWOLF();
      getCanClaim();
    }
  }, [web3Provider, address]);
  return (
    <>
      <div className="social-header sound-lang-wrapper flex justify-center">
        <Modal
          isOpen={modalClaimIsOpen}
          onRequestClose={closeModalClaim}
          ariaHideApp={false}
          contentLabel="Example Modal"
        >
          <div className="modal-text">
            <div className="w-full flex flex-col justify-center items-center">
              <div className="w-full flex justify-center font-bold text-xl">
                Claim rewards
              </div>
              <div className="w-full mt-4 text-center justify-center items-center">
                You have a commission of
                {taxAmount > 0 ? (
                  <span className="ml-1 text-lg font-bold text-red-500">
                    {taxAmount}%
                  </span>
                ) : (
                  <span className="ml-1 text-lg font-bold text-green-500">
                    {taxAmount}%
                  </span>
                )}
                <br /> You will receive a total of
                {taxAmount >= 0 ? (
                  <span className="ml-1 text-green-500 font-bold">
                    <span
                      className="text-sm"
                      style={{ textDecoration: "line-through" }}
                    >
                      {Number(claimAmountCWOLF).toFixed(2)}
                    </span>
                    {
                      <span className="ml-1 text-xl">
                        {Number(
                          claimAmountCWOLF -
                            (claimAmountCWOLF * taxAmount) / 100
                        ).toFixed(2)}{" "}
                      </span>
                    }
                    CWOLF
                  </span>
                ) : (
                  <>
                    <span
                      className="ml-1 text-green-500 font-bold text-sm"
                      style={{ textDecoration: "line-through" }}
                    >
                      {" "}
                      {Number(claimAmountCWOLF).toFixed(2)} CWOLF
                    </span>
                    {/* <span className="text-red-500 font-bold text-xl">
                      {" "}
                      {Number(
                        claimAmount - (claimAmount * taxAmount) / 100
                      ).toFixed(2)}{" "}
                      $
                    </span> */}
                  </>
                )}
              </div>
              <div className="w-full mt-2 flex justify-center items-center text-center">
                If you claim now, your next commission will be set to
                <span className="ml-1 text-lg font-bold">{nextTaxAmount}%</span>
              </div>
            </div>
          </div>
          <div className="modal-button-container">
            <button className="modal-cancel" onClick={closeModalClaim}>
              Cancel
            </button>
            {(claimAmount * taxAmount) / 100 > 0 ? (
              <button
                className="button button-primary"
                onClick={() => {
                  actionClaim();
                }}
              >
                {t("claim")}
              </button>
            ) : (
              <button className="button button-primary" disabled={true}>
                {t("claim")}
              </button>
            )}
          </div>
        </Modal>
        <button
          onClick={openModalClaim}
          className="button button-primary font-bold mr-2"
        >
          REWARDS: {/* {claimAmountCWOLF} cwolf */}{" "}
          <span>{Number(claimAmountCWOLF)} CWOLF</span> | TAX: {taxAmount}%
        </button>
        <button
          className="social-header__link social-header__play flex justify-center"
          title={play ? "Stop Animation" : "Play Animation"}
          onClick={buttonPlayPauseAnimation}
        >
          {play ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="32px"
              height="32px"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                clipRule="evenodd"
              ></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="32px"
              height="32px"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              ></path>
            </svg>
          )}
        </button>
      </div>
      <div className="sound-lang-wrapper">
        <div className="header-language" test-id="languages">
          <div className="current-language">
            <img
              src={`/images/languages-flag-sprite.svg#${router.locale}-lang`}
              alt={`${router.locale} language`}
              width="18"
              height="18"
            />
            <p>{router.locale}</p>
            <svg width="14" height="14" viewBox="0 0 60 24">
              <path d="M0 0 L30 32 L60 0" stroke="#FFFFFF"></path>
            </svg>
          </div>
          <div className="language-dropdown">
            {router.locales?.map((lang: string) => {
              return (
                <div key={lang}>
                  {router.locale === lang ? (
                    <Link href={router.pathname} locale={lang}>
                      <a className="current_lng">
                        <img
                          src={`/images/languages-flag-sprite.svg#${lang}-lang`}
                          alt={`${lang} language`}
                          width="18"
                          height="18"
                        />
                        <span>{lang}</span>
                      </a>
                    </Link>
                  ) : (
                    <Link href={router.pathname} locale={lang}>
                      <a>
                        <img
                          src={`/images/languages-flag-sprite.svg#${lang}-lang`}
                          alt={`${lang} language`}
                          width="18"
                          height="18"
                        />
                        <span>{lang}</span>
                      </a>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default SettingsButtons;
