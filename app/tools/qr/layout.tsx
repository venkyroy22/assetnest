import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "100% Free QR Code Generator - Unlimited Scans & No Watermark | AssetNest",
    description: "Generate custom QR codes 100% free with no watermarks, no registration, and unlimited scans. Personalize dot patterns, marker colors, add brand logos, and export transparent PNGs instantly inside your browser.",
    keywords: [
        "qr code generator",
        "free qr code generator",
        "100% free qr code generator",
        "unlimited qr code generator",
        "qr code generator no watermark",
        "create qr code online",
        "qr code maker",
        "custom qr code creator",
        "transparent qr code download",
        "private qr code maker"
    ],
    openGraph: {
        title: "100% Free QR Code Generator - No Watermark & Unlimited | AssetNest",
        description: "Create beautiful custom QR codes locally in your browser. 100% free, unlimited lifetime scans, and zero watermarks.",
        url: "https://www.assetnest.space/tools/qr",
    },
    alternates: {
        canonical: "https://www.assetnest.space/tools/qr",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AssetNest QR Code Generator",
    description: "Create fully custom, beautiful QR codes 100% free with no watermarks and unlimited lifetime scans. Choose colors, transparent backgrounds, customize finder markers, and add logos securely.",
    url: "https://www.assetnest.space/tools/qr",
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

