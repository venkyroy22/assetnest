import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free Image Cropper - Crop Images Online with Custom Ratios",
    description: "Crop images online with precision aspect ratios and custom dimensions. Free, browser-based, 100% private - no uploads to any server. Download in high quality.",
    keywords: [
        "image cropper",
        "crop image online",
        "free image cropper",
        "crop photo online",
        "image crop tool",
        "aspect ratio crop",
        "custom crop image",
        "online photo cropper",
    ],
    openGraph: {
        title: "Free Image Cropper | AssetNest",
        description: "Crop images online with precision aspect ratios. 100% private - files never leave your browser. Free forever.",
        url: "https://assetnest.gloyas.com/tools/image-cropper",
    },
    alternates: {
        canonical: "https://assetnest.gloyas.com/tools/image-cropper",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Image Cropper",
    description: "Crop images online with precision aspect ratios and custom dimensions. Free, browser-based, 100% private.",
    url: "https://assetnest.gloyas.com/tools/image-cropper",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function ImageCropperLayout({ children }: { children: React.ReactNode }) {
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

