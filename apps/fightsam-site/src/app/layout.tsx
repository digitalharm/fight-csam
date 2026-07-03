import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { Provider } from '@/components/provider';
import { appName, siteUrl } from '@/lib/shared';
import { JsonLd } from '@/components/json-ld';
import { organizationSchema, websiteSchema } from '@/lib/structured-data';
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
    'Free, open-source tools to detect, report, and prevent child sexual abuse material (CSAM) — for any online platform and the developers and AI agents who build them.',
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
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
