import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Pixel Perfect Eye Training",
    description: "Train your UI/UX spatial awareness by drawing exact pixel dimensions from memory. A clone of the Pixactly challenge.",
    keywords: [
        "pixel perfect",
        "pixactly",
        "ui training",
        "ux training",
        "design tools",
        "dimensions game",
    ],
    openGraph: {
        title: "Pixel Perfect Eye Training",
        description: "Test your ability to draw exact pixel dimensions visually without rulers.",
        url: "https://www.assetnest.space/tools/pixel-perfect",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Pixel Perfect Design Game" }],
        type: "website",
    },
};

export default function PixelPerfectLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
