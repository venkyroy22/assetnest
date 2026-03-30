import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Image Prompts for Creators | AssetNest",
    description: "Unlock the power of AI with curated prompt lists for leading image generation models. Elevate your creative workflow with professional prompts.",
    keywords: [
        "ai prompts",
        "ai image generation",
        "marketing prompts",
        "creative prompts",
        "prompt engineering",
        "free ai prompts",
    ],
};

export default function PromptsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
