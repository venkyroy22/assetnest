import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF Merger — Combine Multiple PDFs Free Online | AssetNest",
    description: "Merge multiple PDF files into one instantly. Drag and drop PDFs, rearrange pages in any order, and download your merged PDF. 100% private — no uploads to servers.",
    keywords: [
        "pdf merger", "merge pdf online", "combine pdf files", "join pdf files",
        "merge pdfs free", "pdf joiner online", "combine pdfs into one",
        "merge pdf documents", "online pdf combiner", "pdf merge tool",
        "merge multiple pdfs", "pdf combiner free", "join pdf online free",
        "rearrange pdf pages", "merge pdf without upload"
    ],
    authors: [{ name: "AssetNest Studio" }],
    robots: { index: true, follow: true },
    alternates: { canonical: "https://www.assetnest.space/tools/pdf-merger" },
    openGraph: {
        title: "PDF Merger — Combine Multiple PDFs Free Online",
        description: "Merge and combine PDF files instantly in your browser. Drag to reorder pages, 100% private — nothing uploaded to any server.",
        url: "https://www.assetnest.space/tools/pdf-merger",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "AssetNest PDF Merger" }],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "PDF Merger — Combine PDFs Free Online | AssetNest",
        description: "Merge multiple PDFs into one. Rearrange pages, 100% private and in-browser.",
        images: ["/logo.png"],
    },
};

export default function PdfMergerLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
