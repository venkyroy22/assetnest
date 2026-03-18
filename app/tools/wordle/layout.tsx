import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Wordle Clone — Daily Word Guessing Game",
    description: "Guess the hidden 5-letter word in 6 tries. Challenge your vocabulary with our free online Wordle clone. A new word every time you play!",
    keywords: [
        "wordle online",
        "wordle clone",
        "word guessing game",
        "daily word game",
        "vocabulary puzzle",
        "5 letter word game",
        "play wordle free",
        "nyt wordle alternative"
    ],
    alternates: {
        canonical: "https://www.assetnest.space/tools/wordle",
    },
    openGraph: {
        title: "Wordle Clone — Challenge Your Vocabulary",
        description: "Guess the hidden word in 6 tries. Challenge your brain with this addictive daily word game.",
        url: "https://www.assetnest.space/tools/wordle",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Wordle Clone Preview" }],
        type: "website",
    },
};

export default function WordleLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
