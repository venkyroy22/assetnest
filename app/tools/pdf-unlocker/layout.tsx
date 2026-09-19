import { Metadata } from "next";

export const metadata: Metadata = {
    title: "PDF Password Remover - Unlock PDFs Free Online | AssetNest",
    description: "Remove passwords from your PDF files instantly. Unlock encrypted PDFs locally in your browser without uploading to any server for 100% privacy.",
    keywords: [
        "pdf password remover", "unlock pdf online", "remove pdf password", "decrypt pdf",
        "unprotect pdf", "remove password from pdf free", "pdf unlocker",
        "unlock secure pdf", "pdf security remover", "free pdf password remover",
        "local pdf unlocker", "private pdf unlocker"
    ],
    authors: [{ name: "AssetNest Studio" }],
    robots: { index: true, follow: true },
    alternates: { canonical: "https://assetnest.gloyas.com/tools/pdf-unlocker" },
    openGraph: {
        title: "PDF Password Remover - Unlock PDFs Free Online",
        description: "Remove passwords from your PDF files instantly. Unlock encrypted PDFs locally in your browser for 100% privacy.",
        url: "https://assetnest.gloyas.com/tools/pdf-unlocker",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "AssetNest PDF Password Remover" }],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "PDF Password Remover - Unlock PDFs Free Online | AssetNest",
        description: "Remove passwords from your PDF files instantly in your browser. 100% private.",
        images: ["/logo.png"],
    },
};

export default function PdfUnlockerLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
