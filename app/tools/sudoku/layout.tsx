import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sudoku Pro — Play Free Online Sudoku Puzzles",
    description: "Play daily Sudoku puzzles with multiple difficulty levels. Sharpen your mind with this classic logic game featuring a clean, responsive interface.",
    keywords: [
        "sudoku online",
        "play sudoku free",
        "sudoku pro",
        "daily sudoku",
        "logic puzzle",
        "number game",
        "brain training",
        "sudoku solver",
        "hard sudoku",
        "easy sudoku"
    ],
    alternates: {
        canonical: "https://www.assetnest.space/tools/sudoku",
    },
    openGraph: {
        title: "Sudoku Pro — Daily Online Puzzles",
        description: "Sharpen your mind with daily Sudoku. Multiple difficulty levels and a clean mobile-friendly interface.",
        url: "https://www.assetnest.space/tools/sudoku",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Sudoku Pro Preview" }],
        type: "website",
    },
};

export default function SudokuLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
