import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free QR Code Generator — Create QR Codes Online",
    description: "Generate QR codes for URLs, text, Wi-Fi, and more in seconds. Free, no account required. Download as PNG. Built for creators and businesses.",
    keywords: [
        "qr code generator",
        "free qr code",
        "create qr code online",
        "qr code maker",
        "url qr code",
        "wifi qr code",
        "qr code download",
        "custom qr code",
    ],
    openGraph: {
        title: "Free QR Code Generator | AssetNest",
        description: "Generate QR codes for URLs, text, Wi-Fi, and more in seconds. Free, no account required.",
        url: "https://assetnest.vercel.app/tools/qr",
    },
    alternates: {
        canonical: "https://assetnest.vercel.app/tools/qr",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "QR Code Generator",
    description: "Generate QR codes for URLs, text, Wi-Fi, and more. Free, no account required. Download as PNG.",
    url: "https://assetnest.vercel.app/tools/qr",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function QRLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}
