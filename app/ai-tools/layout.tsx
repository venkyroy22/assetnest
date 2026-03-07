import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "100+ Best Free AI Tools for 2026 — AssetNest AI Tools",
    description: "Discover a curated list of over 100 free AI tools for creators, writers, and coders. From image generation to code assistants, find the best AI power-ups for your projects.",
    keywords: [
        "free ai tools",
        "best ai tools 2026",
        "ai image generators",
        "ai writing assistants",
        "ai coding tools",
        "useful ai apps",
        "generative ai directory",
        "free online ai",
    ],
    openGraph: {
        title: "100+ Best Free AI Tools for 2026 | AssetNest",
        description: "Explore the ultimate directory of free AI tools. Smart power-ups for your creative and professional workflow.",
        url: "https://www.assetnest.space/ai-tools",
    },
    alternates: {
        canonical: "https://www.assetnest.space/ai-tools",
    },
};

export default function AIToolsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
