import type { Metadata } from "next";
import "./globals.css";
import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: {
    default: "AssetNest | A Home for Designers & Editors",
    template: "%s | AssetNest"
  },
  description: "Global resource hub for designers and video editors. Free and premium creative assets, Pinterest keywords, and curated tools.",
  keywords: ["design assets", "video editing resources", "pinterest keywords", "creative tools", "free overlays", "ui kits", "luts"],
  authors: [{ name: "AssetNest" }],
  creator: "AssetNest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://assetnest.design",
    siteName: "AssetNest",
    title: "AssetNest | Creative Assets Hub",
    description: "Premium and free resources for creators worldwide.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AssetNest Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AssetNest | Creative Assets Hub",
    description: "Premium and free resources for creators worldwide.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
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
      </head>
      <body className="antialiased font-sans flex flex-col min-h-screen">
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
