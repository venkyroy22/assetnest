import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import CookieConsent from "@/components/CookieConsent";
import SmoothScroll from "@/components/SmoothScroll";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import CelebrationPortal from "@/components/CelebrationPortal";
import CryptoPolyfill from "@/components/CryptoPolyfill";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const siteUrl = "https://www.assetnest.space";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AssetNest — Free Tools & AI Image Prompts for Creators",
    template: "%s | AssetNest"
  },
  description: "AssetNest is a professional resource hub for creators. Access powerful, 100% private tools like PDF Merger, Image Compressor, QR Generator, and Premium AI Image Prompts.",
  keywords: [
    "PDF Merger online",
    "free image compressor",
    "image size reducer",
    "compress image online",
    "QR code generator",
    "AI image prompts",
    "ai art generation",
    "free creator tools",
    "design utilities",
    "video editing resources",
    "productivity tools",
    "assetNest",
    "free tools for designers",
    "best creative tools 2026",
  ],
  authors: [{ name: "AssetNest", url: siteUrl }],
  creator: "AssetNest",
  publisher: "AssetNest",
  category: "technology",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "AssetNest",
    title: "AssetNest — Free Tools & AI Image Prompts for Creators",
    description: "Access powerful free utilities like PDF Merger, Image Compressor and QR code generator — all in one place.",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
        alt: "AssetNest Logo — Free Tools & AI Prompts",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "AssetNest — Free Tools & AI Image Prompts for Creators",
    description: "Access free utilities and creative resources.",
    images: [`${siteUrl}/logo.png`],
    creator: "@assetnest",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    // google: "YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${outfit.variable}`} style={{ colorScheme: 'dark' }}>
      <head>

        <meta name="theme-color" content="#141414" />
        {/* Google AdSense - Loading in head for better verification */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5938543618083973"
          crossOrigin="anonymous"
        />
        {/* Monetization Network Script (Popunder) */}
        <script
          async
          src="https://pl30573990.effectivecpmnetwork.com/95/18/16/9518166894fdde3ffb07543fb513f74b.js"
        />
      </head>

      <body className="antialiased font-sans flex flex-col min-h-screen">
        <CryptoPolyfill />
        <SmoothScroll>
          <AppLayout>
            {children}
          </AppLayout>
        </SmoothScroll>
        <CookieConsent />
        <SpeedInsights />
        <Analytics />
        <CelebrationPortal />

        {/* JSON-LD Structured Data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "AssetNest",
              "url": siteUrl,
              "description": "Free tools and creative assets for creators, designers, and marketers.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": `${siteUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </body>
    </html>
  );
}
