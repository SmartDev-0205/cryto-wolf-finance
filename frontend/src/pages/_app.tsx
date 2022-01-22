import { appWithTranslation } from "next-i18next";
import { AppProps } from "next/app";
import { useRouter } from "next/router";
import { useEffect } from "react";
import ReactModal from "react-modal";

import ToastProvider from "../components/toast/ToastProvider";
import { PlayPauseProvider } from "../context/PlayPauseAnimation";
import { Web3ProviderContext } from "../context/Web3modal";

import "../styles/global.css";

const MyApp = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  const handleRouteChange = (url: any) => {
    // @ts-ignore
    window.gtag("config", "[Tracking ID]", {
      page_path: url,
    });
  };

  useEffect(() => {
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  ReactModal.defaultStyles = {};
  return (
    <Web3ProviderContext>
      <PlayPauseProvider>
        <ToastProvider variant="top_right">
          <Component {...pageProps} />
        </ToastProvider>
      </PlayPauseProvider>
    </Web3ProviderContext>
  );
};

export default appWithTranslation(MyApp);
