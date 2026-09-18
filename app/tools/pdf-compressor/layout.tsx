import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF Compressor - Reduce PDF Size Free Online | AssetNest",
    description: "Compress and reduce PDF file size instantly in your browser. Make PDFs smaller for email, WhatsApp, or uploading. No file uploads, 100% private and free.",
    keywords: [
        "compress pdf online", "reduce pdf size", "pdf compressor free",
        "make pdf smaller", "shrink pdf file", "pdf file size reducer",
        "compress pdf without losing quality", "pdf optimizer free",
        "reduce pdf size online free", "compress pdf for email",
        "pdf size compressor", "pdf mb reducer", "online pdf compressor",
        "pdf size converter", "reduce pdf size without adobe"
    ],
    authors: [{ name: "AssetNest Studio" }],
    robots: { index: true, follow: true },
    alternates: { canonical: "https://www.assetnest.space/tools/pdf-compressor" },
    openGraph: {
        title: "PDF Compressor - Reduce PDF Size Free Online",
        description: "Compress your PDF and make it smaller instantly in the browser. No uploads, 100% private, completely free.",
        url: "https://www.assetnest.space/tools/pdf-compressor",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "AssetNest PDF Compressor" }],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "PDF Compressor - Make PDFs Smaller Free | AssetNest",
        description: "Reduce PDF file size instantly. No uploads, no limits, 100% private.",
        images: ["/logo.png"],
    },
};

export default function PdfCompressorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
