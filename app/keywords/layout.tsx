import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pinterest Keywords for Creators",
    description: "Boost your reach on Pinterest with curated keyword lists for designers and video editors.",
};

export default function KeywordsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

