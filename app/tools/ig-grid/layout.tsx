import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free Instagram Grid Planner — Visualize Your Feed Layout",
    description: "Plan your Instagram grid layout visually. Upload photos, drag and drop to rearrange, and preview how your profile will look before posting. Free, no account needed.",
    keywords: [
        "instagram layout planner",
        "instagram feed planner",
        "instagram grid planner",
        "instagram feed layout",
        "instagram grid layout planner",
        "instagram planning grid",
        "grid planning instagram",
        "free instagram planner",
        "instagram layout online",
        "instagram planner free",
        "instagram feed planner free",
        "plan instagram feed",
        "plan instagram free",
        "instagram grid planner free",
        "free ig planner",
        "free instagram feed planner",
        "instagram grid planner online free",
        "free ig feed planner",
        "ig feed layout",
        "ig feed planner",
        "instagram grid template free online",
        "instagram-grid-planner",
        "live instagram feed free",
        "free instagram grid planner",
        "ig feed planner free",
        "instagram feed preview online free",
        "ig grid planner",
        "instagram grid planner desktop",
        "instagram layout planner desktop",
        "desktop instagram planner free",
        "instagram feed planner free desktop",
        "desktop instagram feed planner",
        "free instagram planning",
        "instagram planner free desktop",
        "desktop instagram grid planner",
        "instagram grid planner desktop free",
        "instagram planner online",
        "free instagram feed planner desktop",
        "instagram feed planner for desktop"
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

