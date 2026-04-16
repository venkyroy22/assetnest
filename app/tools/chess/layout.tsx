import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Grandmaster Chess | AssetNest",
    description: "Play against a powerful AI or challenge a friend locally. Clean, fast, and feature-rich brutalist chess interface.",
    keywords: ["chess", "play chess", "chess vs computer", "chess ai", "best chess game online", "free chess"],
    alternates: {
        canonical: "https://www.assetnest.space/tools/chess",
    },
    openGraph: {
        title: "Grandmaster Chess | AssetNest",
        description: "Play chess against an AI or pass-and-play on a clean, ad-free board.",
        url: "https://www.assetnest.space/tools/chess",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Grandmaster Chess",
    description: "Play against an AI or challenge yourself on a clean, ad-free board.",
    url: "https://www.assetnest.space/tools/chess",
    applicationCategory: "GameApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function ChessLayout({ children }: { children: React.ReactNode }) {
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
