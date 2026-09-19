import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Image to Text Converter - Free OCR & Text Extraction",
    description: "Extract text from images (JPG, PNG, WebP) instantly using our free online OCR tool. 100% private, browser-based text extraction.",
    keywords: ["image to text", "ocr online", "extract text from image", "photo to text", "free ocr", "image to text converter", "free image to text", "online ocr", "extract text from photo"],
    alternates: {
        canonical: "https://assetnest.gloyas.com/tools/image-to-text",
    },
    openGraph: {
        title: "Image to Text | AssetNest",
        description: "Extract text from your images securely in your browser.",
        url: "https://assetnest.gloyas.com/tools/image-to-text",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Image to Text Converter",
    description: "Extract text from images instantly in your browser using OCR.",
    url: "https://assetnest.gloyas.com/tools/image-to-text",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function ImageToTextLayout({ children }: { children: React.ReactNode }) {
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
