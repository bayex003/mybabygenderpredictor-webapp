import './globals.css';
import type { Metadata } from 'next';
import GA from '@/components/GA';
import DisclaimerBanner from '@/components/DisclaimerBanner';

const siteUrl = 'https://mybabygenderpredictor.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'My Baby Gender Predictor',
    template: '%s | My Baby Gender Predictor',
  },
  description:
    'Upload a clear ultrasound side profile and get a playful, privacy-first AI-assisted baby gender guess in seconds. Entertainment only – not medical advice.',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'My Baby Gender Predictor',
    description:
      'Fun, privacy-first baby gender predictions from your ultrasound scan. Entertainment only – not medical advice.',
    siteName: 'My Baby Gender Predictor',
    images: [
      {
        url: '/og-image.png', // add this image to /public when ready
        width: 1200,
        height: 630,
        alt: 'My Baby Gender Predictor – playful ultrasound gender guess',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Baby Gender Predictor',
    description:
      'Upload a clear ultrasound side profile for a fun, AI-assisted baby gender guess. Entertainment only – not medical advice.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // JSON-LD structured data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'My Baby Gender Predictor',
    url: siteUrl,
    description:
      'A playful, privacy-first web app that gives a fun AI-assisted baby gender guess from an ultrasound side profile. Entertainment only – not medical advice.',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {gaId && <GA id={gaId} />}
        <DisclaimerBanner />
        {children}
      </body>
    </html>
  );
}