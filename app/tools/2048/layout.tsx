import { Metadata } from "next";

export const metadata: Metadata = {
    title: "2048 Game — Play the Classic Number Puzzle Online",
    description: "Play the addictive 2048 game online. Merge tiles, reach the 2048 tile, and challenge your brain with this classic sliding tile puzzle. Free and browser-based.",
    keywords: [
        "2048 game",
        "play 2048 online",
        "number puzzle",
        "sliding tile puzzle",
        "brain game",
        "2048 original",
        "2048 game free",
        "mathematical puzzle",
        "logic game"
    ],
    alternates: {
        canonical: "https://www.assetnest.space/tools/2048",
    },
    openGraph: {
        title: "2048 Game — Classic Number Puzzle",
        description: "Merge tiles to reach 2048! Play the classic addictive puzzle game directly in your browser.",
        url: "https://www.assetnest.space/tools/2048",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "2048 Game Preview" }],
        type: "website",
    },
};

export default function Game2048Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
