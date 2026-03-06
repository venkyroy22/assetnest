import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free Instagram Grid Planner — Visualize Your Feed Layout",
    description: "Plan your Instagram grid layout visually. Upload photos, drag and drop to rearrange, and preview how your profile will look before posting. Free, no account needed.",
    keywords: [
        "instagram grid planner",
        "instagram feed planner",
        "instagram layout planner",
        "plan instagram feed",
        "instagram grid preview",
        "social media planner",
        "instagram profile planner",
        "free instagram tool",
    ],
    openGraph: {
        title: "Free Instagram Grid Planner | AssetNest",
        description: "Plan your Instagram feed layout visually — drag, drop, and preview before posting. Free, no login required.",
        url: "https://www.assetnest.space/tools/ig-grid",
    },
    alternates: {
        canonical: "https://www.assetnest.space/tools/ig-grid",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Instagram Grid Planner",
    description: "Plan your Instagram grid layout visually. Upload photos, drag and drop to rearrange, and preview how your profile will look before posting.",
    url: "https://www.assetnest.space/tools/ig-grid",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function IGGridLayout({ children }: { children: React.ReactNode }) {
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

