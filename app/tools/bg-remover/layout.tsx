import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Background Remover - 100% Free & Private Online AI Tool",
    description: "Remove the background from any image instantly in your browser. Our AI runs 100% locally on your device - your photos never leave your computer. High-quality transparent PNG output.",
    keywords: [
        "Image background remover",
        "background remover",
        "Free background remover",
        "background remover online",
        "background remover free",
        "remove background online",
        "bg remover",
        "remove bg free",
        "transparent background maker",
        "ai background removal",
        "photo editor",
        "private bg remover",
        "no signup bg remover",
        "free background eraser",
        "bg removal no upload"
    ],
    authors: [{ name: "AssetNest Studio" }],
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    alternates: {
        canonical: "https://assetnest.gloyas.com/tools/bg-remover",
    },
    openGraph: {
        title: "Background Remover - 100% Free & Private Online AI Tool",
        description: "Remove image backgrounds instantly in your browser. 100% private, no uploads, high-quality PNG.",
        url: "https://assetnest.gloyas.com/tools/bg-remover",
        siteName: "AssetNest",
        images: [
            {
                url: "/logo.png", // Assuming the public logo file from earlier conversations
                width: 1200,
                height: 630,
                alt: "AssetNest Background Remover Preview",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Background Remover - Free & Private AI Tool",
        description: "Instantly erase backgrounds straight from your browser. Keep your photos 100% private.",
        images: ["/logo.png"],
    },
};

export default function BgRemoverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
