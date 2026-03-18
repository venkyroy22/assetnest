import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF Text Extractor — Free, Private & Secure",
    description: "Extract text from your PDF files into Word documents (DOCX) instantly in your browser. 100% private, no uploads, no account needed.",
    keywords: ["pdf text extractor", "pdf to docx", "extract text from pdf", "pdf to word", "free pdf extractor"],
    alternates: {
        canonical: "https://www.assetnest.space/tools/pdf-text-extractor",
    },
    openGraph: {
        title: "PDF Text Extractor | AssetNest",
        description: "Extract text from PDFs to Word (DOCX) securely in your browser.",
        url: "https://www.assetnest.space/tools/pdf-text-extractor",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PDF Text Extractor",
    description: "Extract text from your PDF files into Word documents (DOCX) instantly in your browser.",
    url: "https://www.assetnest.space/tools/pdf-text-extractor",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function PdfTextExtractorLayout({ children }: { children: React.ReactNode }) {
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
