import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Creator Tools & Resources — AssetNest",
    description: "Discover a suite of powerful free tools and resources for creators, designers, and marketers.",
    keywords: ["creator tools", "design tools", "free online tools", "productivity tools"],
};

export default function KeywordsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

