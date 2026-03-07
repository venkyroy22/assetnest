import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pinterest Keywords for Creators — Free Tool | AssetNest",
    description: "Skyrocket your Pinterest growth with our free Pinterest keyword research tool. Find the best keywords for designers, photographers, and video editors to boost your pins' reach.",
    keywords: [
        "pinterest keywords",
        "pinterest seo tool",
        "pinterest growth",
        "keywords for designers",
        "pinterest tags",
        "increase pinterest reach",
        "free pinterest tool",
        "pinterest marketing",
    ],
};

export default function KeywordsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

