import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Typing Speed Test - Free Online WPM Tester",
    description: "Test and improve your typing speed (WPM) and accuracy with our advanced typing speed test. Get real-time stats, detailed results, and professional feedback.",
    keywords: ["typing speed test", "wpm test", "typing speed", "typing accuracy", "online typing tutor", "improve typing", "free typing tool"],
    alternates: {
        canonical: "https://assetnest.gloyas.com/tools/typing-tester",
    },
    openGraph: {
        title: "Free Typing Speed Test | AssetNest",
        description: "Test and improve your WPM typing speed with real-time stats, detailed results, and professional feedback. Free, no account needed.",
        url: "https://assetnest.gloyas.com/tools/typing-tester",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Typing Speed Test",
    description: "Test and improve your typing speed (WPM) and accuracy. Real-time stats, detailed results, free forever.",
    url: "https://assetnest.gloyas.com/tools/typing-tester",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function TypingTesterLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}

