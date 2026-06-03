import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { Provider } from '@/components/provider';
import { appName, siteUrl } from '@/lib/shared';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${appName} — open-source CSAM safety toolkit`,
    template: `%s · ${appName}`,
  },
  description:
    'Open-source tools to detect, report, and prevent CSAM — for developers and their coding agents.',
  applicationName: appName,
  alternates: { canonical: '/' },
  openGraph: {
    siteName: appName,
    type: 'website',
    url: '/',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
