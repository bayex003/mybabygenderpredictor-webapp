import './globals.css';
import type { Metadata } from 'next';
import DisclaimerBanner from '../components/DisclaimerBanner';

export const metadata: Metadata = {
  title: 'My Baby Gender Predictor',
  description: 'A playful, privacy-first experience that offers a fun AI-assisted gender guess from an ultrasound. Not medical advice.',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <DisclaimerBanner />
        {children}
      </body>
    </html>
  );
}
