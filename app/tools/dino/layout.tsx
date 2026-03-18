import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dino Run — Infinite Runner Adventure Game",
    description: "Play Dino Run, the infinite runner adventure. Jump over obstacles, survive as long as possible, and set new high scores in this classic arcade-style game.",
    keywords: [
        "dino run",
        "infinite runner",
        "offline dino game",
        "chrome dino alternative",
        "arcade game online",
        "pixel art game",
        "google dino game",
        "free runner game"
    ],
    alternates: {
        canonical: "https://www.assetnest.space/tools/dino",
    },
    openGraph: {
        title: "Dino Run — Infinite Runner Adventure",
        description: "How far can you run? Jump over obstacles and set high scores in this addictive infinite runner.",
        url: "https://www.assetnest.space/tools/dino",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Dino Run Preview" }],
        type: "website",
    },
};

export default function DinoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
