import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF Splitter - Extract & Split PDF Pages Free Online | AssetNest",
    description: "Split a PDF into individual pages or extract specific page ranges online. Visually pick the pages you want, download them as a new PDF. Free, private, no uploads.",
    keywords: [
        "split pdf online", "extract pages from pdf", "pdf splitter free",
        "split pdf into pages", "pdf page extractor", "separate pdf pages",
        "remove pages from pdf", "pdf cutter online", "extract specific pages from pdf",
        "pdf page splitter", "split pdf file", "pdf split tool",
        "pdf page extractor online free", "delete pages from pdf",
        "pdf page separator online"
    ],
    authors: [{ name: "AssetNest Studio" }],
    robots: { index: true, follow: true },
    alternates: { canonical: "https://assetnest.gloyas.com/tools/pdf-splitter" },
    openGraph: {
        title: "PDF Splitter - Extract & Split PDF Pages Free Online",
        description: "Extract specific pages from any PDF instantly in your browser. Visual page selector, 100% private - no uploads needed.",
        url: "https://assetnest.gloyas.com/tools/pdf-splitter",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "AssetNest PDF Splitter" }],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "PDF Splitter - Split & Extract PDF Pages | AssetNest",
        description: "Extract pages from PDFs visually. Free, private, in-browser - no server uploads.",
        images: ["/logo.png"],
    },
};

export default function PdfSplitterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
