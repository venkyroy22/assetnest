import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free Image Compressor - Reduce Image Size Online",
    description: "Compress JPEG, PNG, and WebP images instantly in your browser. Reduce image file size with zero quality loss. No uploads, 100% private, completely free.",
    keywords: [
        "image compressor",
        "compress image online",
        "reduce image size",
        "image optimizer",
        "jpeg compressor",
        "png compressor",
        "webp converter",
        "free image compressor",
        "image file size reducer",
        "online image compression tool"
    ],
    openGraph: {
        title: "Free Image Compressor - Reduce Image Size Online | AssetNest",
        description: "Compress JPEG, PNG, and WebP images instantly in your browser. 100% private - no uploads to any server.",
        url: "https://www.assetnest.space/tools/image-compressor",
    },
    alternates: {
        canonical: "https://www.assetnest.space/tools/image-compressor",
    },
};

export default function ImageCompressorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

