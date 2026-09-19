import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free Image Converter - Convert PNG, JPEG, WebP Online",
    description: "Convert images between PNG, JPEG, WebP, and more formats instantly in your browser. No uploads, 100% private, completely free.",
    keywords: [
        "image converter",
        "convert image online",
        "png to jpg",
        "jpg to png",
        "webp converter",
        "avif to jpg",
        "heic to jpg",
        "free image converter",
        "image converter free",
        "image format converter",
        "online image converter",
        "convert to webp",
    ],
    openGraph: {
        title: "Free Image Converter | AssetNest",
        description: "Convert PNG, JPEG, WebP images in your browser - 100% private, no uploads, free forever.",
        url: "https://assetnest.gloyas.com/tools/image-converter",
    },
    alternates: {
        canonical: "https://assetnest.gloyas.com/tools/image-converter",
    },
};

export default function ImageConverterLayout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Image Converter",
        description: "Convert images between PNG, JPEG, WebP, and more formats instantly in your browser. No uploads, 100% private, completely free.",
        url: "https://assetnest.gloyas.com/tools/image-converter",
        applicationCategory: "WebApplication",
        operatingSystem: "All",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    };
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

