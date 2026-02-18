import type { Metadata } from "next";

import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

import "../styles/main.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mono",
  display: "swap",
});

const appleGaramond = localFont({
  src: [
    {
      path: "../public/fonts/AppleGaramond/AppleGaramond.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/AppleGaramond/AppleGaramond-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/AppleGaramond/AppleGaramond-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/AppleGaramond/AppleGaramond-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/AppleGaramond/AppleGaramond-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/AppleGaramond/AppleGaramond-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--apple-garamond",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Cyber Twin — The version of you that never sleeps.",
  description:
    "Be the first to have a Cyber Twin. Join the early access waitlist — we'll send you an early access link before anyone else.",
  openGraph: {
    title: "Be the first to have a Cyber Twin",
    description:
      "The version of you that never sleeps. Join the early access waitlist — we'll send you an early access link before anyone else.",
    images: [
      {
        url: "/imagemetadata.png",
        width: 1200,
        height: 630,
        alt: "Cyber Twin — Early access waitlist. Be the first to have a Cyber Twin.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Be the first to have a Cyber Twin",
    description:
      "The version of you that never sleeps. Join the early access waitlist — we'll send you an early access link before anyone else.",
    images: ["/imagemetadata.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} ${appleGaramond.variable}`}>
        {children}
      </body>
    </html>
  );
}
