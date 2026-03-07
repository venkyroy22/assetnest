import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import CookieConsent from "@/components/CookieConsent";

const siteUrl = "https://www.assetnest.space";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AssetNest — Free Tools & Creative Assets for Creators",
    template: "%s | AssetNest"
  },
  description: "AssetNest is a free resource hub for creators. Access 100+ AI tools, a directory of useful websites, and free utilities like image compressor, QR code generator, and Pinterest keywords.",
  keywords: [
    "100+ free ai tools",
    "useful websites directory",
    "free image compressor",
    "image size reducer",
    "compress image online",
    "QR code generator",
    "pinterest keywords",
    "free design tools",
    "free creator tools",
    "design assets",
    "video editing resources",
    "free overlays",
    "ui kits",
    "luts",
    "creative tools online",
    "assetNest",
    "free tools for designers",
    "best ai tools 2026",
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
    title: "AssetNest — Free Tools & Creative Assets for Creators",
    description: "Access 100+ free AI tools, a directory of useful websites, and free utilities like image compressor and QR code generator — all in one place.",
    images: [
      {
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
        alt: "AssetNest Logo — Free Tools & Creative Assets",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "AssetNest — Free Tools & Creative Assets for Creators",
    description: "Access 100+ free AI tools, useful websites directory, and creative utilities.",
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
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
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
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="canonical" href={siteUrl} />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="antialiased font-sans flex flex-col min-h-screen">
        <AppLayout>
          {children}
        </AppLayout>
        <CookieConsent />

        {/* Google AdSense - Loading after interactive to improve TBT */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5938543618083973"
          crossOrigin="anonymous"
          defer
        />

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

