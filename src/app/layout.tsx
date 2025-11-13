import './globals.css';
import type { Metadata } from 'next';
import GA from '@/components/GA';
import DisclaimerBanner from '@/components/DisclaimerBanner';

export const metadata: Metadata = {
  title: 'My Baby Gender Predictor',
  description:
    'A playful, privacy-first experience that offers a fun AI-assisted gender guess from an ultrasound. Not medical advice.',
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.svg',           // primary favicon
    shortcut: '/favicon.svg',       // ensures browser fallback
    apple: '/favicon.svg',          // iOS home-screen icon
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en">
      <body>
        {gaId && <GA id={gaId} />}
        <DisclaimerBanner />
        {children}
      </body>
    </html>
  );
}