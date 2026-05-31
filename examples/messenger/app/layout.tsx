import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeMessenger — digitalharm-oss reference app",
  description:
    "Open-source messenger boilerplate with all 10 digitalharm-oss CSAM detection & prevention tools wired in. Server-visible-content threat model (not E2EE).",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
