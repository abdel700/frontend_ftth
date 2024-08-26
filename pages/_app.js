import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>INTELCIA IT SOLUTION - FTTH Dashboard</title>
        <link rel="icon" href="/images/ftth_logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta property="og:title" content="FTTH Dashboard - INTELCIA IT SOLUTION" />
        <meta property="og:description" content="Plateforme de gestion des problèmes FTTH" />
        <meta property="og:image" content="/images/ftth_logo.png" />
        <meta property="og:url" content="https://ftth-dashboard.vercel.app/" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
