import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Smart Notes — Beautiful, Private Workspaces",
    description: "A beautiful, versatile workspace for capturing thoughts, drafting articles, and organizing your notes securely right in your browser. 100% private, no account needed.",
    keywords: ["notes", "notepad", "workspace", "markdown editor", "browser notes", "smart notes", "productivity tools"],
    alternates: {
        canonical: "https://www.assetnest.space/tools/notes",
    },
    openGraph: {
        title: "Smart Notes | AssetNest",
        description: "A beautiful, versatile workspace for capturing thoughts and organizing your notes securely right in your browser.",
        url: "https://www.assetnest.space/tools/notes",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Smart Notes",
    description: "A beautiful, versatile workspace for capturing thoughts, drafting articles, and organizing your notes securely right in your browser.",
    url: "https://www.assetnest.space/tools/notes",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function NotesLayout({ children }: { children: React.ReactNode }) {
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
