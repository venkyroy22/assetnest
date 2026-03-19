import { Metadata } from "next";

export const metadata: Metadata = {
    title: "E-Signature Creator — Draw & Download Transparent Signatures",
    description: "Draw your signature smoothly online using your mouse or touch screen. Download instantly as a transparent PNG or SVG for your documents. 100% free and private.",
    keywords: [
        "e-signature creator",
        "online signature maker",
        "draw signature online",
        "transparent signature generator",
        "sign documents online free",
        "digital signature creator",
        "png signature",
        "svg signature maker"
    ],
    openGraph: {
        title: "E-Signature Creator — Free Digital Signatures",
        description: "Draw your signature securely in your browser and download as a transparent image.",
        url: "https://www.assetnest.space/tools/e-signature",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "E-Signature Creator Preview" }],
        type: "website",
    },
};

export default function ESignatureLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
