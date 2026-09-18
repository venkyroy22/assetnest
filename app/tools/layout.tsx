import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Smart Tools - Free Online Tools, No Sign-up Needed",
    description: "A growing collection of free tools for creators, designers, and marketers. Image compressor, QR code generator, and more - all free, no sign-up needed.",
    keywords: ["free online tools", "image compressor", "qr code generator", "creator tools", "free design tools"],
    alternates: {
        canonical: "https://www.assetnest.space/tools",
    },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

