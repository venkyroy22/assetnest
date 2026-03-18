import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Quick Math — Test Your Mental Arithmetic Speed",
    description: "Improve your math skills with Quick Math. Solve as many arithmetic problems as you can in 60 seconds. Perfect for brain training and students.",
    keywords: [
        "quick math",
        "mental arithmetic",
        "math speed test",
        "arithmetic practice",
        "math game for kids",
        "brain training math",
        "solve math fast",
        "multiplication practice",
        "addition game"
    ],
    alternates: {
        canonical: "https://www.assetnest.space/tools/math",
    },
    openGraph: {
        title: "Quick Math — Arithmetic Speed Challenge",
        description: "Test your mental arithmetic! How many problems can you solve in 60 seconds?",
        url: "https://www.assetnest.space/tools/math",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Quick Math Preview" }],
        type: "website",
    },
};

export default function MathLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
