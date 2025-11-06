import './globals.css';
import type { Metadata } from 'next';
import DisclaimerBanner from '../components/DisclaimerBanner';

import Script from 'next/script';

export const metadata: Metadata = {
  title: 'My Baby Gender Predictor',
  description:
    'A playful, privacy-first experience that offers a fun AI-assisted gender guess from an ultrasound. Not medical advice.',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en">
      <head>
        {/* Google Analytics */}
        {gaId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="ga-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body>
        <DisclaimerBanner />
        {children}
      </body>
    </html>
  );
}