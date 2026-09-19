import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF Signature Online Free - No Sign Up Required | AssetNest",
    description: "Fill and sign PDF online free. Create your digital signature on PDF documents instantly and securely in your browser. 100% private with no server uploads and no sign-up required. The perfect free online PDF signature download tool.",
    keywords: [
        "pdf signature online free",
        "pdf signature online free no sign up",
        "digital signature on pdf",
        "digital signature pdf download",
        "fill and sign pdf online free",
        "pdf add signature",
        "free online pdf signer",
        "alternative to ilovepdf signature",
        "electronic signature pdf free",
        "sign pdf in browser"
    ],
    alternates: {
        canonical: "https://assetnest.gloyas.com/tools/pdf-signer",
    },
    openGraph: {
        title: "Free PDF Signature Online - No Sign Up Required",
        description: "Fill, sign, and download PDF documents securely in your browser. 100% local processing with zero server uploads.",
        url: "https://assetnest.gloyas.com/tools/pdf-signer",
        siteName: "AssetNest Tools",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Free PDF Signature Online - No Sign Up Required",
        description: "Securely sign and fill PDF documents locally in your browser. Zero server uploads.",
    }
};

export default function PdfSignerLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
