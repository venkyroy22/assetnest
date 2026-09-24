"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Flame, ChevronDown, ArrowRightLeft } from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
    bg: "#141414",
    surface: "#1c1c1c",
    surfaceHi: "#242424",
    surfaceBorder: "rgba(255,255,255,0.07)",
    text: "#f0ede8",
    textSec: "#a0a0a0",
    muted: "#666",
    border: "#2a2a2a",
    accent: "#10b981",
    accentLight: "#34d399",
    accentDim: "rgba(16,185,129,0.12)",
    accentGlow: "rgba(16,185,129,0.25)",
    red: "#ef4444",
    redDim: "rgba(239,68,68,0.12)",
    orange: "#f59e0b",
    orangeDim: "rgba(245,158,11,0.12)",
    blue: "#3b82f6",
    blueDim: "rgba(59,130,246,0.12)",
    purple: "#8b5cf6",
    purpleDim: "rgba(139,92,246,0.12)",
};

// ─── Activity Level Definitions ───────────────────────────────────────────────
const ACTIVITY_LEVELS = [
    { value: "bmr", label: "Basal Metabolic Rate (BMR)", multiplier: 1.0, desc: "No activity, complete rest" },
    { value: "sedentary", label: "Sedentary (office job)", multiplier: 1.2, desc: "Little or no exercise" },
    { value: "light", label: "Lightly Active", multiplier: 1.375, desc: "Light exercise 1-3 days/week" },
    { value: "moderate", label: "Moderately Active", multiplier: 1.55, desc: "Moderate exercise 3-5 days/week" },
    { value: "active", label: "Very Active", multiplier: 1.725, desc: "Hard exercise 6-7 days/week" },
    { value: "veryActive", label: "Extra Active", multiplier: 1.9, desc: "Very hard exercise, physical job" },
];

// ─── Weight Goal Rows ─────────────────────────────────────────────────────────
const WEIGHT_GOALS = [
    { label: "Extreme weight loss", rate: "1 kg/week", factor: 0.59, color: T.red },
    { label: "Weight loss", rate: "0.5 kg/week", factor: 0.79, color: T.orange },
    { label: "Mild weight loss", rate: "0.25 kg/week", factor: 0.90, color: T.accentLight },
    { label: "Maintain weight", rate: "—", factor: 1.0, color: T.accent },
    { label: "Mild weight gain", rate: "0.25 kg/week", factor: 1.10, color: T.blue },
    { label: "Weight gain", rate: "0.5 kg/week", factor: 1.21, color: T.purple },
    { label: "Extreme weight gain", rate: "1 kg/week", factor: 1.41, color: T.purple },
];

// ─── Macro Presets ────────────────────────────────────────────────────────────
const MACRO_PRESETS = [
    { label: "Balanced", protein: 30, carbs: 40, fat: 30 },
    { label: "Low Carb", protein: 40, carbs: 20, fat: 40 },
    { label: "High Protein", protein: 40, carbs: 35, fat: 25 },
    { label: "Keto", protein: 20, carbs: 5, fat: 75 },
];

// ─── Energy Units ─────────────────────────────────────────────────────────────
const ENERGY_UNITS = [
    { value: "kcal", label: "Calories (kcal)", factor: 1 },
    { value: "cal", label: "calories (cal)", factor: 1000 },
    { value: "kj", label: "Kilojoules (kJ)", factor: 4.184 },
    { value: "j", label: "Joules (J)", factor: 4184 },
];

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    background: T.surfaceHi,
    border: `1px solid ${T.border}`,
    color: T.text,
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23a0a0a0' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: 32,
};

const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: T.textSec,
    marginBottom: 6,
    display: "block",
};

const panelStyle: React.CSSProperties = {
    background: T.surface,
    border: `1px solid ${T.surfaceBorder}`,
    borderRadius: 12,
    padding: 24,
};

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const target = Math.round(value);
        const start = display;
        const diff = target - start;
        if (diff === 0) return;
        const steps = 30;
        const stepTime = 400 / steps;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(start + diff * eased));
            if (step >= steps) {
                clearInterval(timer);
                setDisplay(target);
            }
        }, stepTime);
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return <>{display.toLocaleString()}{suffix}</>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CalorieCalculator() {
    // ─── State ────────────────────────────────────────────────────────────────
    const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");
    const [gender, setGender] = useState<"male" | "female">("male");
    const [age, setAge] = useState<number | "">("");
    const [weightLbs, setWeightLbs] = useState<number | "">("");
    const [weightKg, setWeightKg] = useState<number | "">("");
    const [heightFt, setHeightFt] = useState<number | "">("");
    const [heightIn, setHeightIn] = useState<number | "">("");
    const [heightCm, setHeightCm] = useState<number | "">("");
    const [activity, setActivity] = useState("moderate");
    const [formula, setFormula] = useState<"mifflin" | "harris" | "katch">("mifflin");
    const [bodyFat, setBodyFat] = useState(20);
    const [resultUnit, setResultUnit] = useState<"calories" | "kj">("calories");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [macroPreset, setMacroPreset] = useState(0);
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    // Energy converter state
    const [convFrom, setConvFrom] = useState("kcal");
    const [convTo, setConvTo] = useState("kj");
    const [convValue, setConvValue] = useState(2000);

    // ─── Unit conversion helpers ──────────────────────────────────────────────
    const getWeightKg = useCallback((): number | null => {
        if (unitSystem === "metric") return weightKg === "" ? null : weightKg;
        return weightLbs === "" ? null : weightLbs * 0.453592;
    }, [unitSystem, weightKg, weightLbs]);

    const getHeightCm = useCallback((): number | null => {
        if (unitSystem === "metric") return heightCm === "" ? null : heightCm;
        if (heightFt === "" || heightIn === "") return null;
        return (heightFt * 12 + heightIn) * 2.54;
    }, [unitSystem, heightCm, heightFt, heightIn]);

    // ─── BMR Calculation ──────────────────────────────────────────────────────
    const bmr = useMemo(() => {
        const w = getWeightKg();
        const h = getHeightCm();
        const a = age === "" ? null : age;

        if (w === null || h === null || a === null) return null;

        if (formula === "mifflin") {
            return gender === "male"
                ? 10 * w + 6.25 * h - 5 * a + 5
                : 10 * w + 6.25 * h - 5 * a - 161;
        }
        if (formula === "harris") {
            return gender === "male"
                ? 13.397 * w + 4.799 * h - 5.677 * a + 88.362
                : 9.247 * w + 3.098 * h - 4.330 * a + 447.593;
        }
        // katch-mcardle
        const lbm = w * (1 - bodyFat / 100);
        return 370 + 21.6 * lbm;
    }, [getWeightKg, getHeightCm, age, gender, formula, bodyFat]);

    // ─── TDEE ─────────────────────────────────────────────────────────────────
    const activityData = ACTIVITY_LEVELS.find(a => a.value === activity) || ACTIVITY_LEVELS[1];
    const tdee = bmr === null ? null : bmr * activityData.multiplier;

    // ─── Display value (calories or kJ) ───────────────────────────────────────
    const displayVal = useCallback((cal: number) => {
        return resultUnit === "kj" ? Math.round(cal * 4.184) : Math.round(cal);
    }, [resultUnit]);
    const unitLabel = resultUnit === "kj" ? "kJ" : "Cal";

    // ─── Zigzag schedule ──────────────────────────────────────────────────────
    const zigzag = useMemo(() => {
        if (tdee === null) return { maintain: [], loss: [] };
        const target = Math.round(tdee);
        const lossTarget = Math.round(tdee * 0.79);
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const generateSchedule = (avg: number) => {
            const variations = [1.0, 0.92, 1.08, 0.96, 1.04, 0.88, 1.12];
            const raw = variations.map(v => Math.round(avg * v));
            const sum = raw.reduce((a, b) => a + b, 0);
            const diff = avg * 7 - sum;
            raw[6] += diff;
            return days.map((d, i) => ({ day: d, calories: raw[i] }));
        };

        return {
            maintain: generateSchedule(target),
            loss: generateSchedule(lossTarget),
        };
    }, [tdee]);

    // ─── Macros ───────────────────────────────────────────────────────────────
    const macro = MACRO_PRESETS[macroPreset];
    const macroGrams = useMemo(() => {
        if (tdee === null) return { protein: 0, carbs: 0, fat: 0 };
        const cal = Math.round(tdee);
        return {
            protein: Math.round((cal * macro.protein / 100) / 4),
            carbs: Math.round((cal * macro.carbs / 100) / 4),
            fat: Math.round((cal * macro.fat / 100) / 9),
        };
    }, [tdee, macro]);

    // ─── Energy conversion result ─────────────────────────────────────────────
    const convResult = useMemo(() => {
        const fromUnit = ENERGY_UNITS.find(u => u.value === convFrom)!;
        const toUnit = ENERGY_UNITS.find(u => u.value === convTo)!;
        const kcal = convValue / fromUnit.factor;
        return kcal * toUnit.factor;
    }, [convFrom, convTo, convValue]);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 16px", color: T.text }}>

            {/* ─── Header ──────────────────────────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div style={{
                    display: "inline-flex", padding: 14, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${T.accentDim}, transparent)`,
                    border: `1px solid ${T.accentGlow}`, marginBottom: 16,
                }}>
                    <Flame size={32} color={T.accent} />
                </div>
                <h1 style={{ fontSize: 30, margin: "0 0 8px 0", fontWeight: 700 }}>
                    Calorie Calculator
                </h1>
                <p style={{ color: T.muted, margin: 0, maxWidth: 600, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                    Calculate your daily calorie needs using multiple BMR formulas. Get TDEE, weight loss/gain plans, zigzag cycling schedules, and macronutrient breakdowns.
                </p>
            </div>

            {/* ─── Main Grid: Inputs + Results ─────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

                {/* ═══ LEFT PANEL — INPUTS ═══ */}
                <div style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 20 }}>
                    <h2 style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>Your Details</h2>

                    {/* Unit System Toggle */}
                    <div>
                        <label style={labelStyle}>Unit System</label>
                        <div style={{
                            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
                            background: T.surfaceHi, borderRadius: 8, padding: 3,
                            border: `1px solid ${T.border}`,
                        }}>
                            {(["metric", "imperial"] as const).map(u => (
                                <button
                                    key={u}
                                    onClick={() => setUnitSystem(u)}
                                    style={{
                                        padding: "8px 0", borderRadius: 6, border: "none",
                                        background: unitSystem === u ? T.accent : "transparent",
                                        color: unitSystem === u ? "#fff" : T.textSec,
                                        fontWeight: unitSystem === u ? 600 : 400,
                                        fontSize: 13, cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {u === "metric" ? "Metric (kg, cm)" : "Imperial (lbs, ft)"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Age */}
                    <div>
                        <label style={labelStyle}>Age</label>
                        <input
                            type="number" min={15} max={80} value={age}
                            onChange={e => setAge(e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 0))}
                            style={inputStyle}
                        />
                    </div>

                    {/* Gender */}
                    <div>
                        <label style={labelStyle}>Gender</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            {(["male", "female"] as const).map(g => (
                                <button
                                    key={g}
                                    onClick={() => setGender(g)}
                                    style={{
                                        padding: "10px 0", borderRadius: 8,
                                        border: `1px solid ${gender === g ? T.accent : T.border}`,
                                        background: gender === g ? T.accentDim : T.surfaceHi,
                                        color: gender === g ? T.accentLight : T.textSec,
                                        fontWeight: 500, fontSize: 13, cursor: "pointer",
                                        transition: "all 0.2s",
                                    }}
                                >
                                    {g === "male" ? "♂ Male" : "♀ Female"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Height */}
                    <div>
                        <label style={labelStyle}>Height</label>
                        {unitSystem === "imperial" ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="number" min={1} max={8} value={heightFt}
                                        onChange={e => setHeightFt(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                                        style={{ ...inputStyle, paddingRight: 30 }}
                                    />
                                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 13 }}>ft</span>
                                </div>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="number" min={0} max={11} value={heightIn}
                                        onChange={e => setHeightIn(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                                        style={{ ...inputStyle, paddingRight: 30 }}
                                    />
                                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 13 }}>in</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ position: "relative" }}>
                                <input
                                    type="number" min={50} max={250} value={heightCm}
                                    onChange={e => setHeightCm(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                                    style={{ ...inputStyle, paddingRight: 36 }}
                                />
                                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 13 }}>cm</span>
                            </div>
                        )}
                    </div>

                    {/* Weight */}
                    <div>
                        <label style={labelStyle}>Weight</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="number" min={1}
                                value={unitSystem === "imperial" ? weightLbs : weightKg}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (unitSystem === "imperial") setWeightLbs(val === "" ? "" : parseFloat(val) || 0);
                                    else setWeightKg(val === "" ? "" : parseFloat(val) || 0);
                                }}
                                style={{ ...inputStyle, paddingRight: 36 }}
                            />
                            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 13 }}>
                                {unitSystem === "imperial" ? "lbs" : "kg"}
                            </span>
                        </div>
                    </div>

                    {/* Activity Level */}
                    <div>
                        <label style={labelStyle}>Activity Level</label>
                        <select value={activity} onChange={e => setActivity(e.target.value)} style={selectStyle}>
                            {ACTIVITY_LEVELS.map(a => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: 12, color: T.muted, margin: "6px 0 0 0" }}>
                            {activityData.desc}
                        </p>
                    </div>

                    {/* Advanced Settings */}
                    <div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                background: "none", border: "none", color: T.accent,
                                cursor: "pointer", fontSize: 13, fontWeight: 500, padding: 0,
                            }}
                        >
                            <ChevronDown size={14} style={{
                                transform: showAdvanced ? "rotate(180deg)" : "rotate(0)",
                                transition: "transform 0.25s",
                            }} />
                            Advanced Settings
                        </button>

                        {showAdvanced && (
                            <div style={{
                                marginTop: 12, display: "flex", flexDirection: "column", gap: 14,
                                padding: 16, borderRadius: 8,
                                background: T.surfaceHi, border: `1px solid ${T.border}`,
                                animation: "fadeIn 0.25s ease",
                            }}>
                                {/* Formula */}
                                <div>
                                    <label style={labelStyle}>BMR Formula</label>
                                    <select value={formula} onChange={e => setFormula(e.target.value as "mifflin" | "harris" | "katch")} style={selectStyle}>
                                        <option value="mifflin">Mifflin-St Jeor (recommended)</option>
                                        <option value="harris">Revised Harris-Benedict</option>
                                        <option value="katch">Katch-McArdle</option>
                                    </select>
                                </div>

                                {/* Body Fat (only for Katch) */}
                                {formula === "katch" && (
                                    <div>
                                        <label style={labelStyle}>Body Fat %</label>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                type="number" min={3} max={60} value={bodyFat}
                                                onChange={e => setBodyFat(parseFloat(e.target.value) || 0)}
                                                style={{ ...inputStyle, paddingRight: 30 }}
                                            />
                                            <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 13 }}>%</span>
                                        </div>
                                    </div>
                                )}

                                {/* Result unit */}
                                <div>
                                    <label style={labelStyle}>Display Unit</label>
                                    <select value={resultUnit} onChange={e => setResultUnit(e.target.value as "calories" | "kj")} style={selectStyle}>
                                        <option value="calories">Calories (kcal)</option>
                                        <option value="kj">Kilojoules (kJ)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ RIGHT PANEL — RESULTS ═══ */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    {bmr === null || tdee === null ? (
                        <div style={{
                            ...panelStyle,
                            display: "flex", flexDirection: "column", alignItems: "center",
                            justifyContent: "center", minHeight: 400, textAlign: "center",
                        }}>
                            <Flame size={48} color={T.muted} style={{ marginBottom: 16, opacity: 0.5 }} />
                            <h3 style={{ fontSize: 18, margin: "0 0 8px 0", color: T.textSec }}>Awaiting Details</h3>
                            <p style={{ color: T.muted, margin: 0, fontSize: 14 }}>
                                Please enter your age, height, and weight to calculate your customized calorie needs.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Maintenance Calories Hero */}
                            <div style={{
                        ...panelStyle,
                        background: `linear-gradient(135deg, ${T.surface} 0%, #1a2e25 100%)`,
                        border: `1px solid ${T.accentGlow}`,
                        textAlign: "center",
                        position: "relative",
                        overflow: "hidden",
                    }}>
                        <div style={{
                            position: "absolute", top: -60, right: -60, width: 160, height: 160,
                            borderRadius: "50%", background: T.accentGlow, filter: "blur(60px)",
                            pointerEvents: "none",
                        }} />
                        <p style={{ fontSize: 13, color: T.textSec, margin: "0 0 4px 0", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
                            Maintenance Calories
                        </p>
                        <div style={{ fontSize: 48, fontWeight: 700, color: T.accentLight, lineHeight: 1.1 }}>
                            <AnimatedNumber value={displayVal(tdee)} />
                        </div>
                        <p style={{ fontSize: 14, color: T.muted, margin: "4px 0 0 0" }}>
                            {unitLabel}/day
                        </p>
                    </div>

                    {/* BMR + TDEE Stats */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ ...panelStyle, textAlign: "center", padding: 16 }}>
                            <p style={{ fontSize: 11, color: T.muted, margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: 0.8 }}>BMR</p>
                            <div style={{ fontSize: 22, fontWeight: 700 }}>
                                <AnimatedNumber value={displayVal(bmr)} suffix={` ${unitLabel}`} />
                            </div>
                        </div>
                        <div style={{ ...panelStyle, textAlign: "center", padding: 16 }}>
                            <p style={{ fontSize: 11, color: T.muted, margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: 0.8 }}>TDEE</p>
                            <div style={{ fontSize: 22, fontWeight: 700, color: T.accent }}>
                                <AnimatedNumber value={displayVal(tdee)} suffix={` ${unitLabel}`} />
                            </div>
                        </div>
                    </div>

                    {/* Weight Loss / Gain Table */}
                    <div style={panelStyle}>
                        <h3 style={{ fontSize: 16, margin: "0 0 16px 0", fontWeight: 600 }}>Weight Loss / Gain Plans</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {WEIGHT_GOALS.map((goal, i) => {
                                const cal = displayVal(tdee * goal.factor);
                                const pct = Math.min(100, (goal.factor / 1.5) * 100);
                                const isMaintain = goal.factor === 1.0;
                                return (
                                    <div key={i} style={{
                                        display: "grid", gridTemplateColumns: "1fr auto",
                                        alignItems: "center", gap: 12,
                                        padding: "10px 12px", borderRadius: 8,
                                        background: isMaintain ? T.accentDim : T.surfaceHi,
                                        border: isMaintain ? `1px solid ${T.accentGlow}` : `1px solid transparent`,
                                    }}>
                                        <div>
                                            <div style={{
                                                fontSize: 13, fontWeight: isMaintain ? 600 : 400,
                                                color: isMaintain ? T.accentLight : T.text,
                                                marginBottom: 4,
                                            }}>
                                                {goal.label}
                                                <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>{goal.rate}</span>
                                            </div>
                                            {/* Progress bar */}
                                            <div style={{
                                                height: 4, borderRadius: 2, background: T.border,
                                                overflow: "hidden",
                                            }}>
                                                <div style={{
                                                    height: "100%", borderRadius: 2,
                                                    width: `${pct}%`,
                                                    background: `linear-gradient(90deg, ${goal.color}, ${goal.color}aa)`,
                                                    transition: "width 0.5s ease",
                                                }} />
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: 15, fontWeight: 600,
                                            color: isMaintain ? T.accentLight : T.text,
                                            whiteSpace: "nowrap",
                                        }}>
                                            {cal.toLocaleString()} <span style={{ fontSize: 11, color: T.muted }}>{unitLabel}/day</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                        </>
                    )}
                </div>
            </div>

            {/* ─── Results Details: Zigzag & Macros (when calculated) ─── */}
            {bmr !== null && tdee !== null && (
                <>
                    {/* ─── Zigzag Calorie Cycling ──────────────────────────────────────── */}
                    <div style={{ ...panelStyle, marginTop: 24 }}>
                <h3 style={{ fontSize: 16, margin: "0 0 6px 0", fontWeight: 600 }}>Zigzag Calorie Cycling</h3>
                <p style={{ fontSize: 13, color: T.muted, margin: "0 0 16px 0" }}>
                    Alternate daily calories to prevent metabolic adaptation while hitting your weekly target.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {(["maintain", "loss"] as const).map(type => (
                        <div key={type}>
                            <p style={{
                                fontSize: 12, fontWeight: 600, textTransform: "uppercase",
                                letterSpacing: 0.8, marginBottom: 10,
                                color: type === "maintain" ? T.accent : T.orange,
                            }}>
                                {type === "maintain" ? "Maintenance Schedule" : "Weight Loss Schedule"}
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {zigzag[type].map((d, i) => (
                                    <div key={i} style={{
                                        display: "flex", justifyContent: "space-between",
                                        padding: "6px 10px", borderRadius: 6,
                                        background: i % 2 === 0 ? T.surfaceHi : "transparent",
                                        fontSize: 13,
                                    }}>
                                        <span style={{ color: T.textSec, fontWeight: 500 }}>{d.day}</span>
                                        <span style={{ fontWeight: 600 }}>
                                            {displayVal(d.calories).toLocaleString()} {unitLabel}
                                        </span>
                                    </div>
                                ))}
                                <div style={{
                                    display: "flex", justifyContent: "space-between",
                                    padding: "8px 10px", borderRadius: 6,
                                    borderTop: `1px solid ${T.border}`, marginTop: 4,
                                    fontSize: 13, fontWeight: 600,
                                    color: type === "maintain" ? T.accent : T.orange,
                                }}>
                                    <span>Weekly Avg</span>
                                    <span>
                                        {displayVal(Math.round(zigzag[type].reduce((s, d) => s + d.calories, 0) / 7)).toLocaleString()} {unitLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Macronutrient Breakdown ─────────────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24 }}>
                <h3 style={{ fontSize: 16, margin: "0 0 16px 0", fontWeight: 600 }}>Macronutrient Breakdown</h3>

                {/* Preset tabs */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                    {MACRO_PRESETS.map((p, i) => (
                        <button key={i}
                            onClick={() => setMacroPreset(i)}
                            style={{
                                padding: "6px 14px", borderRadius: 20, border: "none",
                                background: macroPreset === i ? T.accent : T.surfaceHi,
                                color: macroPreset === i ? "#fff" : T.textSec,
                                fontWeight: macroPreset === i ? 600 : 400,
                                fontSize: 12, cursor: "pointer",
                                transition: "all 0.2s",
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "center" }}>
                    {/* Donut Chart */}
                    <div style={{ position: "relative", width: 160, height: 160 }}>
                        <div style={{
                            width: 160, height: 160, borderRadius: "50%",
                            background: `conic-gradient(
                                ${T.accent} 0deg ${macro.protein * 3.6}deg,
                                ${T.blue} ${macro.protein * 3.6}deg ${(macro.protein + macro.carbs) * 3.6}deg,
                                ${T.orange} ${(macro.protein + macro.carbs) * 3.6}deg 360deg
                            )`,
                            transition: "all 0.5s ease",
                        }} />
                        <div style={{
                            position: "absolute", top: "50%", left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 100, height: 100, borderRadius: "50%",
                            background: T.surface,
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                        }}>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(tdee)}</div>
                            <div style={{ fontSize: 10, color: T.muted }}>{unitLabel}/day</div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                            { label: "Protein", pct: macro.protein, grams: macroGrams.protein, color: T.accent, cal: 4 },
                            { label: "Carbs", pct: macro.carbs, grams: macroGrams.carbs, color: T.blue, cal: 4 },
                            { label: "Fat", pct: macro.fat, grams: macroGrams.fat, color: T.orange, cal: 9 },
                        ].map((m, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "10px 14px", borderRadius: 8,
                                background: T.surfaceHi, border: `1px solid ${T.border}`,
                            }}>
                                <div style={{
                                    width: 12, height: 12, borderRadius: 3,
                                    background: m.color, flexShrink: 0,
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</div>
                                    <div style={{ fontSize: 11, color: T.muted }}>{m.pct}% • {m.grams}g • {m.grams * m.cal} cal</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
                </>
            )}

            {/* ─── Food Energy Converter ───────────────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <ArrowRightLeft size={18} color={T.accent} />
                    <h3 style={{ fontSize: 16, margin: 0, fontWeight: 600 }}>Food Energy Converter</h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end" }}>
                    <div>
                        <label style={labelStyle}>From</label>
                        <select value={convFrom} onChange={e => setConvFrom(e.target.value)} style={selectStyle}>
                            {ENERGY_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                        <input
                            type="number" value={convValue}
                            onChange={e => setConvValue(parseFloat(e.target.value) || 0)}
                            style={{ ...inputStyle, marginTop: 8 }}
                        />
                    </div>
                    <div style={{ padding: "0 0 8px 0", color: T.muted }}>
                        <ArrowRightLeft size={20} />
                    </div>
                    <div>
                        <label style={labelStyle}>To</label>
                        <select value={convTo} onChange={e => setConvTo(e.target.value)} style={selectStyle}>
                            {ENERGY_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                        </select>
                        <div style={{
                            ...inputStyle, marginTop: 8,
                            background: T.accentDim, border: `1px solid ${T.accentGlow}`,
                            fontWeight: 600, color: T.accentLight,
                        }}>
                            {convResult.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── SEO Content ─────────────────────────────────────────────────── */}
            <div style={{ marginTop: 48, borderTop: `1px solid ${T.border}`, paddingTop: 32 }}>

                {/* How it Works */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 12, fontWeight: 600 }}>How Does This Calculator Work?</h2>
                    <p style={{ color: T.textSec, lineHeight: 1.7, fontSize: 14 }}>
                        This calculator estimates your daily calorie needs in three steps. First, it calculates your
                        <strong> Basal Metabolic Rate (BMR)</strong> — the number of calories your body burns at complete rest
                        just to maintain vital functions like breathing, circulation, and cell production. Second, it multiplies
                        your BMR by an <strong>activity factor</strong> to estimate your <strong>Total Daily Energy Expenditure (TDEE)</strong>,
                        which represents the total calories you burn in a day including physical activity. Finally, it applies
                        adjustments based on your weight goal to produce a calorie target for weight loss, maintenance, or weight gain.
                    </p>
                </div>

                {/* Understanding Results */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 12, fontWeight: 600 }}>Understanding Your Results</h2>
                    <p style={{ color: T.textSec, lineHeight: 1.7, fontSize: 14 }}>
                        Your <strong>maintenance calories</strong> (TDEE) is the number of calories you need to eat to maintain
                        your current weight. Eating below this number creates a <strong>calorie deficit</strong>, leading to weight loss.
                        Eating above creates a <strong>calorie surplus</strong>, leading to weight gain. A deficit of approximately
                        500 calories per day equates to roughly 0.5 kg (1 lb) of weight loss per week, since one pound of body fat
                        stores about 3,500 calories. However, individual results vary based on metabolism, body composition, and other factors.
                    </p>
                </div>

                {/* BMR Formulas */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 12, fontWeight: 600 }}>BMR Estimation Formulas</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                            {
                                name: "Mifflin-St Jeor (Recommended)",
                                desc: "Developed in 1990, this is considered the most accurate formula for most people. It estimates BMR based on weight, height, age, and gender.",
                                formula: "Male: 10W + 6.25H − 5A + 5 | Female: 10W + 6.25H − 5A − 161",
                            },
                            {
                                name: "Revised Harris-Benedict",
                                desc: "Originally created in 1919 and revised in 1984 by Roza and Shizgal. It is one of the oldest and most widely referenced formulas.",
                                formula: "Male: 13.397W + 4.799H − 5.677A + 88.362 | Female: 9.247W + 3.098H − 4.330A + 447.593",
                            },
                            {
                                name: "Katch-McArdle",
                                desc: "Uses lean body mass (LBM) instead of total weight, making it more accurate for people who know their body fat percentage. Gender-neutral.",
                                formula: "BMR = 370 + 21.6 × LBM (where LBM = weight × (1 − bodyfat%))",
                            },
                        ].map((f, i) => (
                            <div key={i} style={{
                                padding: 16, borderRadius: 8,
                                background: T.surfaceHi, border: `1px solid ${T.border}`,
                            }}>
                                <h4 style={{ margin: "0 0 6px 0", fontSize: 15, color: T.accentLight }}>{f.name}</h4>
                                <p style={{ color: T.textSec, fontSize: 13, lineHeight: 1.5, margin: "0 0 8px 0" }}>{f.desc}</p>
                                <code style={{
                                    fontSize: 12, color: T.muted,
                                    background: T.surface, padding: "4px 8px", borderRadius: 4,
                                    display: "inline-block",
                                }}>{f.formula}</code>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Calorie Counting Tips */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 12, fontWeight: 600 }}>Calorie Counting Tips</h2>
                    <ul style={{ color: T.textSec, lineHeight: 1.8, fontSize: 14, paddingLeft: 20 }}>
                        <li>Use a food scale for accurate portion sizes — eyeballing can be off by 30–50%.</li>
                        <li>Track everything, including cooking oils, sauces, and drinks — these add up quickly.</li>
                        <li>Be consistent with your tracking for at least 2–4 weeks before making adjustments.</li>
                        <li>Weigh yourself at the same time daily (morning, after bathroom) and use a weekly average.</li>
                        <li>Don&apos;t drastically cut calories — a moderate deficit of 300–500 cal/day is sustainable long-term.</li>
                        <li>Prioritize protein intake to preserve muscle mass during a calorie deficit.</li>
                    </ul>
                </div>

                {/* Zigzag Cycling Explanation */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 12, fontWeight: 600 }}>What Is Zigzag Calorie Cycling?</h2>
                    <p style={{ color: T.textSec, lineHeight: 1.7, fontSize: 14 }}>
                        Zigzag calorie cycling (also called calorie shifting) is an approach where you vary your daily calorie
                        intake while keeping the same weekly average. For example, instead of eating 2,000 calories every day,
                        you might eat 1,800 on some days and 2,200 on others. This strategy can help prevent metabolic adaptation —
                        the natural slowdown in metabolism that occurs when you eat the same restricted amount consistently.
                        It can also make dieting more psychologically sustainable by allowing higher-calorie days for social meals
                        or intense training days.
                    </p>
                </div>

                {/* FAQs */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 16, fontWeight: 600 }}>Frequently Asked Questions</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[
                            {
                                q: "How accurate is this calorie calculator?",
                                a: "Calorie calculators provide estimates based on statistical formulas. They are typically accurate within 10% for most people. For a more precise measurement, consider indirect calorimetry or metabolic testing. Use the calculator as a starting point and adjust based on your actual results over 2–4 weeks."
                            },
                            {
                                q: "Which BMR formula should I use?",
                                a: "The Mifflin-St Jeor equation is recommended for most people as it has been shown to be the most accurate in recent studies. If you know your body fat percentage, the Katch-McArdle formula can provide more personalized results since it accounts for lean body mass."
                            },
                            {
                                q: "How do I choose my activity level?",
                                a: "Be honest and conservative. Most people with desk jobs who exercise 3–4 times per week fall into the 'Moderately Active' category. If you're unsure, choose a lower activity level and adjust upward if you're losing weight faster than expected."
                            },
                            {
                                q: "Is it safe to eat below my BMR?",
                                a: "Generally, it's not recommended to eat below your BMR for extended periods. Your BMR represents the minimum energy your body needs for basic functions. Eating significantly below it can lead to muscle loss, nutrient deficiencies, metabolic slowdown, and other health issues. A moderate deficit below your TDEE (not BMR) is the safer approach."
                            },
                            {
                                q: "How fast should I lose weight?",
                                a: "A safe and sustainable rate is 0.5–1 kg (1–2 lbs) per week for most people. Faster weight loss increases the risk of muscle loss, nutritional deficiencies, and metabolic adaptation. Extremely rapid weight loss is rarely sustainable and often leads to yo-yo dieting."
                            },
                            {
                                q: "Do I need to count calories to lose weight?",
                                a: "Not necessarily. Calorie counting is one tool among many. Some people succeed with portion control, intuitive eating, or simply improving food quality. However, calorie counting provides data-driven awareness of your intake and can be especially helpful when starting a weight management journey or breaking through a plateau."
                            },
                            {
                                q: "How do macronutrients (protein, carbs, fat) affect weight loss?",
                                a: "While total calories determine whether you lose or gain weight, macronutrient distribution affects body composition, energy levels, and satiety. Higher protein intake (25–35% of calories) helps preserve muscle mass during a deficit and increases satiety. Carbohydrates fuel intense exercise, while dietary fats are essential for hormonal health."
                            },
                            {
                                q: "Why does my metabolism slow down when dieting?",
                                a: "This is called 'metabolic adaptation' or 'adaptive thermogenesis.' When you eat less, your body gradually reduces its energy expenditure to conserve fuel. This includes reduced non-exercise activity (fidgeting, posture), lower thermic effect of food, and hormonal changes. Zigzag cycling and periodic diet breaks can help mitigate this effect."
                            },
                            {
                                q: "Should I eat back calories burned during exercise?",
                                a: "It depends on your goal. If your TDEE already accounts for exercise (via the activity multiplier), you generally don't need to eat back exercise calories. If you track exercise separately, you may eat back 50–75% of estimated exercise calories (since trackers often overestimate burn). Listen to your body and adjust based on results."
                            },
                            {
                                q: "How do calories relate to kilojoules?",
                                a: "1 Calorie (kcal) = 4.184 kilojoules (kJ). Kilojoules are the metric unit of energy used in many countries outside the US. Our calculator supports both units — you can switch between them in the Advanced Settings."
                            },
                        ].map((faq, i) => (
                            <div key={i} style={{
                                borderRadius: 8,
                                border: `1px solid ${T.border}`,
                                background: T.surface,
                                overflow: "hidden",
                            }}>
                                <button
                                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                                    style={{
                                        width: "100%", padding: "14px 16px",
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        background: "none", border: "none",
                                        color: T.text, fontSize: 14, fontWeight: 500,
                                        cursor: "pointer", textAlign: "left",
                                    }}
                                >
                                    {faq.q}
                                    <ChevronDown size={16} style={{
                                        transform: faqOpen === i ? "rotate(180deg)" : "rotate(0)",
                                        transition: "transform 0.25s",
                                        flexShrink: 0,
                                        color: T.muted,
                                    }} />
                                </button>
                                {faqOpen === i && (
                                    <div style={{
                                        padding: "0 16px 14px 16px",
                                        color: T.textSec, fontSize: 13, lineHeight: 1.6,
                                    }}>
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Inline CSS Keyframes ─────────────────────────────────────────── */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
