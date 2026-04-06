import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF Cropper — Crop & Trim PDF Pages Free Online | AssetNest",
    description: "Crop and trim the margins or visible area of any PDF page online. Set precise crop regions visually, apply to all pages, and download. Free, private, no uploads.",
    keywords: [
        "crop pdf online", "pdf cropper", "trim pdf margins", "pdf page cropper",
        "crop pdf pages", "pdf margin trimmer", "pdf crop tool", "remove white margins pdf",
        "crop pdf free", "pdf cropper online", "trim pdf pages", "pdf page trimmer",
        "crop pdf without upload", "pdf margin crop", "pdf crop area"
    ],
    authors: [{ name: "AssetNest Studio" }],
    robots: { index: true, follow: true },
    alternates: { canonical: "https://www.assetnest.space/tools/pdf-cropper" },
    openGraph: {
        title: "PDF Cropper — Crop & Trim PDF Pages Free Online",
        description: "Visually crop any PDF page region instantly in your browser. Set crop area, apply to all pages, download — 100% private, no uploads.",
        url: "https://www.assetnest.space/tools/pdf-cropper",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "AssetNest PDF Cropper" }],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "PDF Cropper — Crop PDF Pages | AssetNest",
        description: "Crop and trim PDF pages visually. Free, private, in-browser — no server uploads.",
        images: ["/logo.png"],
    },
};

export default function PdfCropperLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
