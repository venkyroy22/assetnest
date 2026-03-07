import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "100+ Useful, Funny & Crazy Free Websites — AssetNest Directory",
    description: "Explore a curated collection of 100+ funny, useful, and crazy free websites. From interactive galaxies to deep sea exploration, uncover the best of the web.",
    keywords: [
        "useful websites",
        "funny websites",
        "crazy websites",
        "cool websites to visit",
        "internet time killers",
        "best websites index",
        "free online tools",
        "web directory",
    ],
    openGraph: {
        title: "100+ Useful, Funny & Crazy Free Websites | AssetNest",
        description: "Your ultimate hub for the most unique and engaging websites on the internet. Curated for inspiration and fun.",
        url: "https://www.assetnest.space/useful-websites",
    },
    alternates: {
        canonical: "https://www.assetnest.space/useful-websites",
    },
};

export default function UsefulWebsitesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
