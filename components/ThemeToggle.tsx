"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    // Define applyTheme before it's used in useEffect
    const applyTheme = (t: "light" | "dark") => {
        if (t === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.classList.remove("light");
        } else {
            document.documentElement.classList.add("light");
            document.documentElement.classList.remove("dark");
        }
    };

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        const initialTheme = savedTheme || systemTheme;

        setTheme(initialTheme);
        applyTheme(initialTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    };

    if (!mounted) {
        return (
            <div className="p-2 w-9 h-9 border border-border rounded-md opacity-0" />
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 border border-border hover:border-foreground transition-all rounded-md flex items-center justify-center w-9 h-9"
            aria-label="Toggle Theme"
        >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
    );
}
