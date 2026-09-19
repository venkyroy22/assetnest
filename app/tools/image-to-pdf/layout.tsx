import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Image to PDF Converter - JPG, PNG, WebP to PDF Free | AssetNest",
    description: "Convert JPG, PNG, and WebP images into a PDF instantly. Upload multiple images, drag to reorder pages, set page size and quality. Free, private, no file uploads needed.",
    keywords: [
        "image to pdf", "jpg to pdf", "png to pdf", "convert image to pdf online",
        "photos to pdf", "jpeg to pdf online free", "webp to pdf",
        "multiple images to pdf", "picture to pdf", "convert photos to pdf",
        "jpg to pdf converter free", "images to pdf online",
        "png to pdf converter", "photo to pdf online", "make pdf from images",
        "create pdf from photos", "picture to pdf converter free"
    ],
    authors: [{ name: "AssetNest Studio" }],
    robots: { index: true, follow: true },
    alternates: { canonical: "https://assetnest.gloyas.com/tools/image-to-pdf" },
    openGraph: {
        title: "Image to PDF Converter - JPG, PNG, WebP to PDF Free",
        description: "Turn your images into a PDF in seconds. Upload multiple photos, reorder them, set page size - all free and 100% private in your browser.",
        url: "https://assetnest.gloyas.com/tools/image-to-pdf",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "AssetNest Image to PDF Converter" }],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Image to PDF - JPG, PNG, WebP Converter | AssetNest",
        description: "Convert any image to PDF instantly. Multiple images, drag to reorder, 100% private.",
        images: ["/logo.png"],
    },
};

export default function ImageToPdfLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
