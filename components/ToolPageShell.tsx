"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ChevronDown, X } from "lucide-react";

/* ─────────────────────────────────────────
   GLOBAL STYLES - injected once via this shell
   (replaces the duplicated GLOBAL_STYLES in every page)
   ───────────────────────────────────────── */
export const TOOL_GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

.ig-root {
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #000;
}
.ig-display {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  letter-spacing: -0.02em;
}
.ig-label {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  font-size: 10px;
  color: #000;
}
.ig-btn {
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.ig-btn:active {
  transform: translate(2px, 2px) !important;
  box-shadow: none !important;
}
input[type=range] { accent-color: #000000; }
::-webkit-scrollbar { display: none; }

/* Two-column desktop grid */
@media (min-width: 900px) {
  .tool-outer { max-width: 1200px; margin: 0 auto; padding: 32px 40px 80px !important; }
  .tool-desktop-grid { display: grid !important; grid-template-columns: 1fr 420px; gap: 36px; align-items: start; }
  .tool-mobile-only { display: none !important; }
  .tool-desktop-only { display: flex !important; }
  .tool-sidebar-sticky { position: sticky !important; top: 28px; }
  .tool-bottom-safe { display: none !important; }
}
@media (max-width: 899px) {
  .tool-desktop-only { display: none !important; }
  .tool-outer { padding: 0 0 100px !important; }
}
`;

/* ─────────────────────────────────────────
   ACCORDION (shared, replaces LocalAccordion in all pages)
   ───────────────────────────────────────── */
export function ToolAccordion({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 w-full">{children}</div>;
}

interface ToolAccordionItemProps {
  title: string;
  children: React.ReactNode;
}
export function ToolAccordionItem({ title, children }: ToolAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-2 border-black rounded-2xl bg-zinc-50 overflow-hidden shadow-[3px_3px_0_#000] transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between text-left transition-all hover:bg-zinc-100/80"
      >
        <span className="font-bold text-sm sm:text-base text-black pr-4">{title}</span>
        <ChevronDown
          size={18}
          className={`text-black shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[800px] border-t-2 border-black bg-white" : "max-h-0"
        }`}
      >
        <div className="p-5 text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   BADGE CHIP (100% Private / Client-side etc.)
   ───────────────────────────────────────── */
interface BadgeChipProps {
  icon: React.ReactNode;
  label: string;
  color?: string; // bg color, defaults to yellow
}
export function BadgeChip({ icon, label, color = "#fef08a" }: BadgeChipProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 12px",
        borderRadius: 99,
        background: color,
        border: "2px solid #000000",
        fontSize: 11,
        fontWeight: 800,
        color: "#000",
        letterSpacing: "0.04em",
        boxShadow: "2px 2px 0 #000",
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      {icon}{label}
    </span>
  );
}

/* ─────────────────────────────────────────
   TOOL PAGE SHELL - main wrapper
   ───────────────────────────────────────── */
export interface ToolBadge {
  icon: React.ReactNode;
  label: string;
  color?: string;
}

export interface ToolPageShellProps {
  /** Tool display name shown in header and h1 */
  toolName: string;
  /** Icon element inside the colored square in the header */
  toolIcon: React.ReactNode;
  /** Background color of the icon square (e.g. "#F97316") */
  iconBg: string;
  /** Short description shown below the h1 */
  description: string;
  /** Badge chips (defaults to 100% Private + Client-side) */
  badges?: ToolBadge[];
  /** Help modal content - if provided, the ? button is shown */
  helpContent?: React.ReactNode;
  /** Left panel content (controls, inputs, tabs, etc.) */
  children: React.ReactNode;
  /** Right panel content (preview, output card) - if provided triggers two-column layout */
  rightPanel?: React.ReactNode;
  /** Extra CSS string to inject */
  extraStyles?: string;
  /** Custom root style */
  style?: React.CSSProperties;
  /** Custom root className */
  className?: string;
}

const DEFAULT_BADGES: ToolBadge[] = [
  {
    label: "100% Private",
    color: "#fef08a",
    icon: (
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Client-side",
    color: "#fef08a",
    icon: (
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
];

export function ToolPageShell({
  toolName,
  toolIcon,
  iconBg,
  description,
  badges = DEFAULT_BADGES,
  helpContent,
  children,
  rightPanel,
  extraStyles = "",
  style,
  className = "",
}: ToolPageShellProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={`min-h-screen text-black font-sans pb-24 relative overflow-hidden ig-root ${className}`} style={{ background: "#F4ECD8", ...style }}>
      <style>{TOOL_GLOBAL_STYLES + extraStyles}</style>

      {/* ── TOP HEADER BAR ── */}
      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 40px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 10,
        }}
        className="px-4 sm:px-6 lg:px-10 pt-5 sm:pt-8"
      >
        {/* Left: Back button */}
        <Link
          href="/tools"
          className="ig-btn flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black rounded-xl text-black font-bold text-[11px] shadow-[2px_2px_0_#000] hover:bg-zinc-50 transition-colors"
          style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.04em" }}
        >
          <ArrowLeft size={12} strokeWidth={2.5} />
          BACK
        </Link>

        {/* Right: Icon + Tool name + Help */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: iconBg,
              border: "2px solid #000",
              boxShadow: "2.5px 2.5px 0 #000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {toolIcon}
          </div>
          <span
            className="ig-display font-black tracking-tight text-black"
            style={{ fontSize: "clamp(14px, 2vw, 18px)" }}
          >
            {toolName}
          </span>
          {helpContent && (
            <button
              onClick={() => setShowHelp(true)}
              className="p-1.5 bg-white border-2 border-black rounded-full text-black hover:bg-zinc-100 transition-all shadow-[1.5px_1.5px_0_#000]"
              title="Help"
            >
              <HelpCircle size={13} />
            </button>
          )}
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="tool-outer" style={{ position: "relative", zIndex: 1, padding: "0 0 80px" }}>

        {/* DESKTOP: two-column grid */}
        <div className="tool-desktop-grid" style={{ display: "none" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Title block */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {badges.map((b, i) => (
                  <BadgeChip key={i} icon={b.icon} label={b.label} color={b.color} />
                ))}
              </div>
              <h1
                className="ig-display"
                style={{
                  margin: 0,
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: "#000",
                  letterSpacing: "-0.03em",
                }}
              >
                {toolName}
              </h1>
              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 14.5,
                  color: "#52525b",
                  lineHeight: 1.65,
                  maxWidth: 520,
                  fontWeight: 500,
                }}
              >
                {description}
              </p>
            </div>

            {/* Tool controls */}
            {children}
          </div>

          {/* Right column - sticky preview */}
          {rightPanel && (
            <div className="tool-sidebar-sticky">
              {rightPanel}
            </div>
          )}
        </div>

        {/* MOBILE: single column */}
        <div className="tool-mobile-only" style={{ display: "flex", flexDirection: "column", paddingBottom: 90 }}>
          {/* Mobile title strip */}
          <div style={{ padding: "12px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
              <div>
                <h1
                  className="ig-display"
                  style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#000", letterSpacing: "-0.03em", lineHeight: 1.1 }}
                >
                  {toolName}
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#52525b", fontWeight: 500, lineHeight: 1.5 }}>
                  Client-side · Zero uploads
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <BadgeChip
                  label="Private"
                  color="#fef08a"
                  icon={
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>

          {/* Mobile preview slot (if provided) */}
          {rightPanel && (
            <div style={{ padding: "0 20px 16px" }}>
              {rightPanel}
            </div>
          )}

          {/* Mobile controls */}
          <div style={{ padding: "0 20px" }}>
            {children}
          </div>
        </div>
      </div>

      {/* ── HELP MODAL ── */}
      {helpContent && showHelp && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff",
              border: "2px solid #000",
              borderRadius: 24,
              boxShadow: "6px 6px 0 #000",
              maxWidth: 520,
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              padding: 28,
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowHelp(false)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "#fff", border: "2px solid #000",
                borderRadius: "50%", width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", boxShadow: "2px 2px 0 #000",
              }}
            >
              <X size={14} />
            </button>
            {helpContent}
          </div>
        </div>
      )}
    </div>
  );
}
