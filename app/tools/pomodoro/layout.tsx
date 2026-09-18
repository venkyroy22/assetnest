import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pomodoro Timer - Free Focus Timer with Achievements",
    description: "A beautiful Pomodoro timer with animated progress ring, achievement system, and session tracking. Free, no account needed. Stay focused and build deep work habits.",
    keywords: ["pomodoro timer", "focus timer", "productivity timer", "work timer", "pomodoro technique", "free pomodoro", "study timer", "deep work"],
    alternates: {
        canonical: "https://www.assetnest.space/tools/pomodoro",
    },
    openGraph: {
        title: "Free Pomodoro Timer | AssetNest",
        description: "Beautiful Pomodoro timer with achievements & session tracking. Free, no account needed.",
        url: "https://www.assetnest.space/tools/pomodoro",
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Pomodoro Timer",
    description: "A beautiful Pomodoro timer with animated progress ring, achievement system, and session tracking. Free, no account needed.",
    url: "https://www.assetnest.space/tools/pomodoro",
    applicationCategory: "WebApplication",
    operatingSystem: "All",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function PomodoroLayout({ children }: { children: React.ReactNode }) {
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

