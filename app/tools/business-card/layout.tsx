import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Business Card Maker - Design & Export High-Res Cards",
    description: "Create professional business cards online in minutes. Add your details, adjust colors, choose templates, and export print-ready PDFs or PNG images for free.",
    keywords: [
        "business card maker",
        "free business card generator",
        "design business cards online",
        "print ready business cards",
        "custom business card creator",
        "vcard maker"
    ],
    openGraph: {
        title: "Free Business Card Generator",
        description: "Design and export a beautiful, print-ready business card directly from your browser.",
        url: "https://assetnest.gloyas.com/tools/business-card",
        siteName: "AssetNest",
        images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Business Card Maker Preview" }],
        type: "website",
    },
};

export default function BusinessCardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
