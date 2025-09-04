import Script from 'next/script';

export default function DemoPage() {
  return (
    <>
      <h1 style={{ fontFamily: 'system-ui', margin: '16px' }}>Trattoria Demo</h1>
      <section style={{ margin: '16px' }}>
        <h2>Menù</h2>
        <ul>
          <li>Bruschette miste</li>
          <li>Tagliatelle al ragù</li>
          <li>Grigliata mista</li>
        </ul>
      </section>
      <Script
        src="/optin.js"
        strategy="afterInteractive"
        data-tenant="RISTO_DEMO"
        data-policy-version="v1"
        data-api="/api"
      />
    </>
  );
}

