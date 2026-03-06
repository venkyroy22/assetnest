import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free Media Hub — Download & Manage Media Assets Online",
    description: "Access and manage your media assets in one place. Free media hub for creators — no account required, completely free.",
    keywords: [
        "media hub",
        "free media manager",
        "asset manager online",
        "media download tool",
        "creator media hub",
        "free media assets",
        "online media tool",
    ],
    openGraph: {
        title: "Free Media Hub | AssetNest",
        description: "Access and manage your media assets in one place. Free for creators — no account required.",
        url: "https://www.assetnest.space/tools/media-hub",
    },
    alternates: {
        canonical: "https://www.assetnest.space/tools/media-hub",
    },
};

export default function MediaHubLayout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Media Hub",
        description: "Access and manage your media assets in one place. Free media hub for creators — no account required, completely free.",
        url: "https://www.assetnest.space/tools/media-hub",
        applicationCategory: "WebApplication",
        operatingSystem: "All",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    };
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

