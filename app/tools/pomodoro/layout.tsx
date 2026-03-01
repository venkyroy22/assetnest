import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pomodoro Timer — Free Focus Timer with Achievements",
    description: "A beautiful Pomodoro timer with animated progress ring, achievement system, and session tracking. Free, no account needed. Stay focused and build deep work habits.",
    keywords: ["pomodoro timer", "focus timer", "productivity timer", "work timer", "pomodoro technique", "free pomodoro", "study timer", "deep work"],
    alternates: {
        canonical: "https://assetnest.vercel.app/tools/pomodoro",
    },
};

export default function PomodoroLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
