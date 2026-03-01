import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

const siteUrl = "https://assetnest.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AssetNest — Free Tools & Creative Assets for Creators",
    template: "%s | AssetNest"
  },
  description: "AssetNest is a free resource hub for creators, designers, and marketers. Access free tools like image compressor, QR code generator, Pinterest keywords, and curated creative assets.",
  keywords: [
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
    "free tools for designers"
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
    description: "Free image compressor, QR code generator, Pinterest keywords and more — all in one place for creators and designers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AssetNest — Free Tools & Creative Assets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AssetNest — Free Tools & Creative Assets for Creators",
    description: "Free image compressor, QR code generator, Pinterest keywords and more.",
    images: ["/og-image.png"],
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
  verification: {
    // google: "YOUR_GOOGLE_SEARCH_CONSOLE_VERIFICATION_CODE",  // Add when you have it
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="canonical" href={siteUrl} />
        <meta name="theme-color" content="#000000" />
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
      </head>
      <body className="antialiased font-sans flex flex-col min-h-screen">
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
