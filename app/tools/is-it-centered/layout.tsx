import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Is It Centered? Eye Training",
    description: "Train your UI/UX alignment discernment. Identify whether a geometric dot is perfectly centered within a shape.",
    keywords: [
        "centered",
        "alignment training",
        "ui training",
        "ux training",
        "design tools",
        "spatial awareness",
    ],
    openGraph: {
        title: "Is It Centered? Eye Training",
        description: "Test your ability to spot pixel-imperfect alignments in UI design.",
        url: "https://www.assetnest.space/tools/is-it-centered",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Is It Centered Design Game" }],
        type: "website",
    },
};

export default function IsItCenteredLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
