import { Inter } from 'next/font/google'
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { HydrationFix } from '@/components/HydrationFix';
import { RootLayoutContent } from '@/components/RootLayoutContent';
import { MoralisAuthProvider } from "@/components/MoralisAuthProvider";

// Metadata for the site
export const metadata: Metadata = {
  title: 'BAEVII - Cross-Chain ITF Platform',
  description: 'Create and manage multi-chain crypto ITFs with AI-powered insights',
  applicationName: 'BAEVII',
  keywords: ['ITF', 'Crypto', 'DeFi', 'Finance', 'AI', 'Blockchain', 'Portfolio Management'],
  authors: [{ name: 'BAEVII Team' }],
  creator: 'BAEVII',
  publisher: 'BAEVII',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

// Define Inter font variables
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Import Poppins font (clean, professional font good for finance)
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        <HydrationFix />
        <MoralisAuthProvider>
          <RootLayoutContent>{children}</RootLayoutContent>
        </MoralisAuthProvider>
      </body>
    </html>
  );
}
