"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface Settings {
  theme: "dark" | "light" | "amoled";
  eyeProtectEnabled: boolean;
  reduceMotion: boolean;
  fixedNavbar: boolean;
  uiScale: "compact" | "standard" | "large";
}

export const defaultSettings: Settings = {
  theme: "dark",
  eyeProtectEnabled: false,
  reduceMotion: false,
  fixedNavbar: true,
  uiScale: "standard",
};

interface SettingsContextProps {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetAllData: () => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(defaultSettings);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("assetnest_settings");
    if (saved) {
      try {
        setSettingsState({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {}
    }
  }, []);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("assetnest_settings", JSON.stringify(next));
      return next;
    });
  };

  const resetAllData = () => {
    localStorage.clear();
    setSettingsState(defaultSettings);
    window.location.reload();
  };

  // Apply visual effects globally
  useEffect(() => {
    if (!mounted) return;
    
    // Apply eye protection filter to html
    const root = document.documentElement;
    if (settings.eyeProtectEnabled) {
      root.style.filter = "sepia(55%) contrast(85%) hue-rotate(-15deg)";
    } else {
      root.style.filter = "none";
    }

    // Apply AMOLED
    if (settings.theme === "amoled") {
      document.body.style.backgroundColor = "#000000";
    } else if (settings.theme === "dark") {
      document.body.style.backgroundColor = ""; // Reset to tailwind body color
    }
    
    // Light Mode Hook (Currently a structural stub for phase 2)
    if (settings.theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    }

    // Apply UI Scale
    if (settings.uiScale === "compact") {
      root.style.fontSize = "14px";
    } else if (settings.uiScale === "large") {
      root.style.fontSize = "18px";
    } else {
      root.style.fontSize = "16px";
    }

  }, [settings, mounted]);

  // Inject global overrides for things like reduced motion
  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetAllData, isSettingsOpen, setSettingsOpen }}>
      {settings.reduceMotion && mounted && (
        <style dangerouslySetInnerHTML={{ __html: `
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        `}} />
      )}
      {settings.theme === "amoled" && mounted && (
        <style dangerouslySetInnerHTML={{ __html: `
          body { background-color: #000000 !important; }
          .bg-zinc-950 { background-color: #000000 !important; }
        `}} />
      )}
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
