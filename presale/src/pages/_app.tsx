import { AppProps } from 'next/app';
/*
import '../styles/main.css';
*/
import '../styles/icons.css';
import '../styles/global.css';

const MyApp = ({ Component, pageProps }: AppProps) => (
  <Component {...pageProps} />
);

export default MyApp;
