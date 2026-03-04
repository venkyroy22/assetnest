import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Speed Typist — Free Online Typing Speed Test",
    description: "Test and improve your typing speed (WPM) and accuracy with our premium typing tester. Get real-time stats, detailed results, and professional feedback.",
    keywords: ["typing test", "wpm test", "typing speed", "typing accuracy", "online typing tutor", "improve typing", "free typing tool"],
    alternates: {
        canonical: "https://assetnest.vercel.app/tools/typing-tester",
    },
};

export default function TypingTesterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
