"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Activity, ChevronDown, Info } from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
    bg: "#0f0f0f",
    surface: "#1a1a1a",
    surfaceHi: "#222222",
    surfaceBright: "#2a2a2a",
    surfaceBorder: "rgba(255,255,255,0.07)",
    text: "#f0ede8",
    textSec: "#a0a0a0",
    muted: "#666",
    border: "#2a2a2a",
    accent: "#6366f1",
    accentLight: "#818cf8",
    accentDim: "rgba(99,102,241,0.12)",
    accentGlow: "rgba(99,102,241,0.25)",
    green: "#10b981",
    greenDim: "rgba(16,185,129,0.12)",
    greenLight: "#34d399",
    yellow: "#f59e0b",
    yellowDim: "rgba(245,158,11,0.12)",
    orange: "#f97316",
    orangeDim: "rgba(249,115,22,0.12)",
    red: "#ef4444",
    redDim: "rgba(239,68,68,0.12)",
    blue: "#3b82f6",
    blueDim: "rgba(59,130,246,0.12)",
    purple: "#8b5cf6",
    purpleDim: "rgba(139,92,246,0.12)",
    teal: "#14b8a6",
    tealDim: "rgba(20,184,166,0.12)",
    crimson: "#dc2626",
    crimsonDim: "rgba(220,38,38,0.12)",
};

// ─── BMI Categories ───────────────────────────────────────────────────────────
const BMI_CATEGORIES = [
    { label: "Severe Thinness", range: "< 16", min: 0, max: 16, color: T.crimson, colorDim: T.crimsonDim },
    { label: "Moderate Thinness", range: "16 – 17", min: 16, max: 17, color: T.orange, colorDim: T.orangeDim },
    { label: "Mild Thinness", range: "17 – 18.5", min: 17, max: 18.5, color: T.yellow, colorDim: T.yellowDim },
    { label: "Normal", range: "18.5 – 25", min: 18.5, max: 25, color: T.green, colorDim: T.greenDim },
    { label: "Overweight", range: "25 – 30", min: 25, max: 30, color: T.yellow, colorDim: T.yellowDim },
    { label: "Obese Class I", range: "30 – 35", min: 30, max: 35, color: T.orange, colorDim: T.orangeDim },
    { label: "Obese Class II", range: "35 – 40", min: 35, max: 40, color: T.red, colorDim: T.redDim },
    { label: "Obese Class III", range: "> 40", min: 40, max: 100, color: T.crimson, colorDim: T.crimsonDim },
];

// ─── FAQs ─────────────────────────────────────────────────────────────────────
const FAQS = [
    {
        q: "What is BMI?",
        a: "Body Mass Index (BMI) is a simple calculation using a person's height and weight. The formula is BMI = kg/m², where kg is a person's weight in kilograms and m² is their height in metres squared. A BMI of 25.0 or more is overweight, while the healthy range is 18.5 to 24.9."
    },
    {
        q: "Is BMI accurate for everyone?",
        a: "BMI is a useful screening tool but has limitations. It does not distinguish between muscle mass and fat mass. Athletes and muscular individuals may have a high BMI without excess body fat. Similarly, elderly individuals may have a normal BMI while carrying excess fat. Other measures like waist circumference and body fat percentage can provide additional context."
    },
    {
        q: "What are the risks of a high BMI?",
        a: "A BMI above 25 is associated with increased risk of cardiovascular disease, type 2 diabetes, high blood pressure, sleep apnea, certain cancers, and joint problems. The higher the BMI, the greater the risk. However, BMI should be considered alongside other health indicators."
    },
    {
        q: "How is BMI different for children?",
        a: "For children and teens (ages 2-20), BMI is calculated the same way as for adults, but the results are interpreted differently. Instead of fixed categories, the BMI is compared to age- and sex-specific percentiles because body composition varies as children grow."
    },
    {
        q: "What is BMI Prime?",
        a: "BMI Prime is the ratio of your BMI to the upper limit of 'normal' BMI (25 kg/m²). A BMI Prime of 1.0 means you are exactly at the upper boundary of normal weight. Values below 1.0 indicate underweight or normal range, while values above 1.0 indicate overweight or obese."
    },
    {
        q: "What is the Ponderal Index?",
        a: "The Ponderal Index (PI) is similar to BMI but uses height cubed instead of height squared: PI = mass / height³. It is considered a more accurate measure for very tall or very short individuals, as it compensates better for height differences. A normal PI is approximately 11–15 kg/m³."
    },
];

// ─── Children BMI Categories (CDC) ────────────────────────────────────────────
const CHILDREN_BMI = [
    { label: "Underweight", range: "< 5%", color: T.blue },
    { label: "Healthy weight", range: "5% – 85%", color: T.green },
    { label: "At risk of overweight", range: "85% – 95%", color: T.yellow },
    { label: "Overweight", range: "> 95%", color: T.red },
];

// ─── Overweight Health Risks ──────────────────────────────────────────────────
const OVERWEIGHT_RISKS = [
    "High blood pressure",
    "Higher levels of LDL cholesterol (\"bad cholesterol\"), lower levels of HDL cholesterol, and high levels of triglycerides",
    "Type II diabetes",
    "Coronary heart disease",
    "Stroke",
    "Gallbladder disease",
    "Osteoarthritis, a type of joint disease caused by breakdown of joint cartilage",
    "Sleep apnea and breathing problems",
    "Certain cancers (endometrial, breast, colon, kidney, gallbladder, liver)",
    "Low quality of life",
    "Mental illnesses such as clinical depression, anxiety, and others",
    "Body pains and difficulty with certain physical functions",
    "Generally, an increased risk of mortality compared to those with a healthy BMI",
];

// ─── Underweight Health Risks ─────────────────────────────────────────────────
const UNDERWEIGHT_RISKS = [
    "Malnutrition, vitamin deficiencies, anemia (lowered ability to carry blood vessels)",
    "Osteoporosis, a disease that causes bone weakness, increasing the risk of breaking a bone",
    "A decrease in immune function",
    "Growth and development issues, particularly in children and teenagers",
    "Possible reproductive issues for women due to hormonal imbalances that can disrupt the menstrual cycle. Underweight women also have a higher chance of miscarriage in the first trimester",
    "Potential complications as a result of surgery",
    "Generally, an increased risk of mortality compared to those with a healthy BMI",
];

// ─── Adult BMI Limitations ────────────────────────────────────────────────────
const ADULT_LIMITATIONS = [
    "Older adults tend to have more body fat than younger adults with the same BMI.",
    "Women tend to have more body fat than men for an equivalent BMI.",
    "Muscular individuals and highly trained athletes may have higher BMIs due to large muscle mass.",
];

// ─── BMI Prime Table ──────────────────────────────────────────────────────────
const BMI_PRIME_TABLE = [
    { label: "Severe Thinness", bmiRange: "< 16", primeRange: "< 0.64", color: T.crimson, colorDim: T.crimsonDim },
    { label: "Moderate Thinness", bmiRange: "16 – 17", primeRange: "0.64 – 0.68", color: T.orange, colorDim: T.orangeDim },
    { label: "Mild Thinness", bmiRange: "17 – 18.5", primeRange: "0.68 – 0.74", color: T.yellow, colorDim: T.yellowDim },
    { label: "Normal", bmiRange: "18.5 – 25", primeRange: "0.74 – 1.00", color: T.green, colorDim: T.greenDim },
    { label: "Overweight", bmiRange: "25 – 30", primeRange: "1.00 – 1.20", color: T.yellow, colorDim: T.yellowDim },
    { label: "Obese Class I", bmiRange: "30 – 35", primeRange: "1.20 – 1.40", color: T.orange, colorDim: T.orangeDim },
    { label: "Obese Class II", bmiRange: "35 – 40", primeRange: "1.40 – 1.60", color: T.red, colorDim: T.redDim },
    { label: "Obese Class III", bmiRange: "> 40", primeRange: "> 1.60", color: T.crimson, colorDim: T.crimsonDim },
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
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
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

// ─── Content & Formula Styles ─────────────────────────────────────────────────
const contentParagraph: React.CSSProperties = {
    color: T.textSec,
    lineHeight: 1.7,
    fontSize: 14,
    margin: "0 0 12px 0",
};

const tableHeaderStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "10px 20px",
    color: T.textSec,
    fontWeight: 500,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
};

const youBadge: React.CSSProperties = {
    marginLeft: 8,
    fontSize: 10,
    padding: "2px 8px",
    borderRadius: 10,
    background: T.accent,
    color: "#fff",
    fontWeight: 600,
};

const formulaCardStyle: React.CSSProperties = {
    background: T.surfaceHi,
    borderRadius: 10,
    padding: 20,
    border: `1px solid ${T.surfaceBorder}`,
};

const formulaLabelStyle: React.CSSProperties = {
    fontSize: 12,
    color: T.muted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    display: "flex",
    alignItems: "center",
    gap: 8,
};

const formulaMainStyle: React.CSSProperties = {
    fontFamily: "'Inter', monospace",
    fontSize: 16,
    color: T.accentLight,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
};

const formulaFractionStyle: React.CSSProperties = {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    verticalAlign: "middle",
    margin: "0 4px",
};

const formulaNumeratorStyle: React.CSSProperties = {
    borderBottom: `1px solid ${T.muted}`,
    paddingBottom: 3,
    fontSize: 14,
    color: T.text,
};

const formulaDenominatorStyle: React.CSSProperties = {
    paddingTop: 3,
    fontSize: 14,
    color: T.textSec,
};

const formulaExampleStyle: React.CSSProperties = {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
};

const formulaEqualsStyle: React.CSSProperties = {
    color: T.muted,
    fontSize: 14,
};

// ─── Animated Number ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 1, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
    const [display, setDisplay] = useState(value);

    useEffect(() => {
        const target = value;
        const start = display;
        const diff = target - start;
        if (Math.abs(diff) < 0.01) { setDisplay(target); return; }
        const steps = 30;
        const stepTime = 400 / steps;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(start + diff * eased);
            if (step >= steps) {
                clearInterval(timer);
                setDisplay(target);
            }
        }, stepTime);
        return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return <>{display.toFixed(decimals)}{suffix}</>;
}

// ─── BMI Gauge SVG ────────────────────────────────────────────────────────────
function BMIGauge({ bmi }: { bmi: number | null }) {
    const width = 320;
    const height = 180;
    const cx = width / 2;
    const cy = 155;
    const radius = 115;
    const startAngle = Math.PI; // 180° (left)
    const endAngle = 0; // 0° (right)

    // BMI ranges mapped to arc segments (total 180°)
    const segments = [
        { min: 0, max: 16, color: T.crimson, label: "Severe" },
        { min: 16, max: 17, color: T.orange, label: "" },
        { min: 17, max: 18.5, color: T.yellow, label: "Under" },
        { min: 18.5, max: 25, color: T.green, label: "Normal" },
        { min: 25, max: 30, color: T.yellow, label: "Over" },
        { min: 30, max: 35, color: T.orange, label: "Obese I" },
        { min: 35, max: 40, color: T.red, label: "Obese II" },
        { min: 40, max: 50, color: T.crimson, label: "III" },
    ];

    const totalRange = 50; // 0 to 50 BMI mapped to the gauge
    const arcThickness = 24;

    const polarToCartesian = (angle: number, r: number) => ({
        x: cx + r * Math.cos(angle),
        y: cy - r * Math.sin(angle),
    });

    const bmiToAngle = (bmiVal: number) => {
        const clamped = Math.max(0, Math.min(50, bmiVal));
        const fraction = clamped / totalRange;
        return startAngle - fraction * Math.PI;
    };

    const describeArc = (startBmi: number, endBmi: number, r: number) => {
        const a1 = bmiToAngle(startBmi);
        const a2 = bmiToAngle(endBmi);
        const start = polarToCartesian(a1, r);
        const end = polarToCartesian(a2, r);
        const largeArc = Math.abs(a1 - a2) > Math.PI ? 1 : 0;
        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    };

    const needleAngle = bmi !== null ? bmiToAngle(bmi) : bmiToAngle(22);
    const needleLen = radius - arcThickness - 12;
    const needleTip = polarToCartesian(needleAngle, needleLen);
    const needleRotation = bmi !== null
        ? 90 - (needleAngle * 180 / Math.PI)
        : 90 - (bmiToAngle(22) * 180 / Math.PI);

    const getBmiCategory = (val: number) => {
        const cat = BMI_CATEGORIES.find(c => val >= c.min && val < c.max);
        return cat || BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
    };

    const category = bmi !== null ? getBmiCategory(bmi) : null;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                <defs>
                    <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.3" />
                    </filter>
                    <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background track */}
                <path
                    d={describeArc(0, 50, radius)}
                    fill="none"
                    stroke={T.surfaceBright}
                    strokeWidth={arcThickness}
                    strokeLinecap="round"
                />

                {/* Colored segments */}
                {segments.map((seg, i) => (
                    <path
                        key={i}
                        d={describeArc(seg.min, seg.max, radius)}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth={arcThickness - 2}
                        strokeLinecap="butt"
                        opacity={0.85}
                    />
                ))}

                {/* Tick marks with labels */}
                {[16, 18.5, 25, 30, 35, 40].map((tick, i) => {
                    const angle = bmiToAngle(tick);
                    const inner = polarToCartesian(angle, radius - arcThickness / 2 - 2);
                    const outer = polarToCartesian(angle, radius + arcThickness / 2 + 2);
                    const labelPos = polarToCartesian(angle, radius + arcThickness / 2 + 18);
                    return (
                        <g key={i}>
                            <line
                                x1={inner.x} y1={inner.y}
                                x2={outer.x} y2={outer.y}
                                stroke="rgba(255,255,255,0.3)"
                                strokeWidth={1.5}
                            />
                            <text
                                x={labelPos.x} y={labelPos.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={T.textSec}
                                fontSize={9}
                                fontFamily="Inter, system-ui, sans-serif"
                                fontWeight={500}
                            >
                                {tick}
                            </text>
                        </g>
                    );
                })}

                {/* Needle */}
                {bmi !== null && (
                    <g filter="url(#needleGlow)">
                        <line
                            x1={cx} y1={cy}
                            x2={cx} y2={cy - needleLen}
                            stroke={category?.color || T.text}
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            transform={`rotate(${needleRotation}, ${cx}, ${cy})`}
                            style={{ transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                        />
                        <circle cx={cx} cy={cy} r={6} fill={T.surfaceBright} stroke={category?.color || T.muted} strokeWidth={2} />
                        <circle cx={cx} cy={cy} r={2.5} fill={category?.color || T.muted} />
                    </g>
                )}
            </svg>

            {/* Central readout */}
            <div style={{
                marginTop: -15,
                textAlign: "center",
                position: "relative",
                zIndex: 1,
            }}>
                {bmi !== null ? (
                    <>
                        <div style={{
                            fontSize: 42,
                            fontWeight: 800,
                            color: category?.color || T.text,
                            lineHeight: 1,
                            letterSpacing: "-1px",
                            fontFamily: "Inter, system-ui, sans-serif",
                        }}>
                            <AnimatedNumber value={bmi} decimals={1} />
                        </div>
                        <div style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "1.5px",
                            color: T.muted,
                            marginTop: 2,
                        }}>
                            kg/m²
                        </div>
                        <div style={{
                            marginTop: 8,
                            padding: "4px 16px",
                            borderRadius: 20,
                            background: category?.colorDim || T.surfaceHi,
                            color: category?.color || T.text,
                            fontSize: 13,
                            fontWeight: 600,
                            display: "inline-block",
                        }}>
                            {category?.label}
                        </div>
                    </>
                ) : (
                    <div style={{ color: T.muted, fontSize: 14 }}>
                        Enter your details
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function BMICalculator() {
    // ─── State ────────────────────────────────────────────────────────────────
    const [unitSystem, setUnitSystem] = useState<"metric" | "us">("metric");
    const [age, setAge] = useState<number | "">(25);
    const [gender, setGender] = useState<"male" | "female">("male");
    const [heightCm, setHeightCm] = useState<number | "">(175);
    const [heightFt, setHeightFt] = useState<number | "">(5);
    const [heightIn, setHeightIn] = useState<number | "">(9);
    const [weightKg, setWeightKg] = useState<number | "">(70);
    const [weightLbs, setWeightLbs] = useState<number | "">(154);
    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    // ─── Derived values ───────────────────────────────────────────────────────
    const getHeightM = useCallback((): number | null => {
        if (unitSystem === "metric") {
            return heightCm === "" ? null : heightCm / 100;
        }
        if (heightFt === "" || heightIn === "") return null;
        const totalInches = (heightFt as number) * 12 + (heightIn as number);
        return totalInches * 0.0254;
    }, [unitSystem, heightCm, heightFt, heightIn]);

    const getWeightKg = useCallback((): number | null => {
        if (unitSystem === "metric") return weightKg === "" ? null : weightKg as number;
        return weightLbs === "" ? null : (weightLbs as number) * 0.453592;
    }, [unitSystem, weightKg, weightLbs]);

    const bmi = useMemo(() => {
        const h = getHeightM();
        const w = getWeightKg();
        if (!h || !w || h <= 0 || w <= 0) return null;
        return w / (h * h);
    }, [getHeightM, getWeightKg]);

    const bmiPrime = useMemo(() => bmi !== null ? bmi / 25 : null, [bmi]);

    const ponderalIndex = useMemo(() => {
        const h = getHeightM();
        const w = getWeightKg();
        if (!h || !w || h <= 0 || w <= 0) return null;
        return w / (h * h * h);
    }, [getHeightM, getWeightKg]);

    const healthyWeightRange = useMemo(() => {
        const h = getHeightM();
        if (!h || h <= 0) return null;
        const minW = 18.5 * h * h;
        const maxW = 25 * h * h;
        if (unitSystem === "us") {
            return {
                min: (minW / 0.453592).toFixed(1),
                max: (maxW / 0.453592).toFixed(1),
                unit: "lbs",
            };
        }
        return {
            min: minW.toFixed(1),
            max: maxW.toFixed(1),
            unit: "kg",
        };
    }, [getHeightM, unitSystem]);

    const weightToLose = useMemo(() => {
        if (bmi === null) return null;
        const h = getHeightM();
        const w = getWeightKg();
        if (!h || !w) return null;
        if (bmi >= 18.5 && bmi < 25) return { diff: 0, action: "maintain" };
        if (bmi >= 25) {
            const idealW = 25 * h * h;
            const diff = w - idealW;
            return {
                diff: unitSystem === "us" ? diff / 0.453592 : diff,
                unit: unitSystem === "us" ? "lbs" : "kg",
                action: "lose",
            };
        }
        // underweight
        const idealW = 18.5 * h * h;
        const diff = idealW - w;
        return {
            diff: unitSystem === "us" ? diff / 0.453592 : diff,
            unit: unitSystem === "us" ? "lbs" : "kg",
            action: "gain",
        };
    }, [bmi, getHeightM, getWeightKg, unitSystem]);

    const getBmiCategory = (val: number) => {
        const cat = BMI_CATEGORIES.find(c => val >= c.min && val < c.max);
        return cat || BMI_CATEGORIES[BMI_CATEGORIES.length - 1];
    };

    const category = bmi !== null ? getBmiCategory(bmi) : null;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div style={{
            maxWidth: 920,
            margin: "0 auto",
            padding: "40px 16px",
            color: T.text,
            fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{
                    display: "inline-flex",
                    padding: 14,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${T.accentDim}, ${T.purpleDim})`,
                    border: `1px solid ${T.surfaceBorder}`,
                    marginBottom: 16,
                }}>
                    <Activity size={28} color={T.accent} />
                </div>
                <h1 style={{
                    fontSize: 28,
                    fontWeight: 700,
                    margin: "0 0 8px 0",
                    background: `linear-gradient(135deg, ${T.text}, ${T.textSec})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}>
                    BMI Calculator
                </h1>
                <p style={{ color: T.muted, margin: 0, fontSize: 14, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
                    Calculate your Body Mass Index and find out where you stand on the health spectrum
                </p>
            </div>

            {/* Main Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
                {/* ─── Inputs Panel ────────────────────────────────────────────── */}
                <div style={panelStyle}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 20px 0", color: T.text }}>
                        Your Details
                    </h2>

                    {/* Unit System Toggle */}
                    <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>Unit System</label>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                            background: T.surfaceHi,
                            borderRadius: 8,
                            padding: 3,
                        }}>
                            {(["metric", "us"] as const).map(sys => (
                                <button
                                    key={sys}
                                    onClick={() => setUnitSystem(sys)}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: 6,
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        transition: "all 0.2s",
                                        background: unitSystem === sys
                                            ? `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`
                                            : "transparent",
                                        color: unitSystem === sys ? "#fff" : T.textSec,
                                        boxShadow: unitSystem === sys ? `0 2px 8px ${T.accentGlow}` : "none",
                                    }}
                                >
                                    {sys === "metric" ? "Metric" : "US Units"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Age */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Age</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="number"
                                value={age}
                                min={2}
                                max={120}
                                onChange={(e) => setAge(e.target.value === "" ? "" : parseInt(e.target.value))}
                                placeholder="25"
                                style={inputStyle}
                                onFocus={(e) => {
                                    e.target.style.borderColor = T.accent;
                                    e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = T.border;
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                            <span style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: T.muted,
                                fontSize: 12,
                                pointerEvents: "none",
                            }}>
                                years
                            </span>
                        </div>
                        <span style={{ fontSize: 11, color: T.muted, marginTop: 4, display: "block" }}>
                            Ages 2 – 120
                        </span>
                    </div>

                    {/* Gender */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Gender</label>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 8,
                        }}>
                            {(["male", "female"] as const).map(g => (
                                <button
                                    key={g}
                                    onClick={() => setGender(g)}
                                    style={{
                                        padding: "10px 16px",
                                        borderRadius: 8,
                                        border: `1px solid ${gender === g ? T.accent : T.border}`,
                                        cursor: "pointer",
                                        fontSize: 13,
                                        fontWeight: 500,
                                        transition: "all 0.2s",
                                        background: gender === g ? T.accentDim : T.surfaceHi,
                                        color: gender === g ? T.accentLight : T.textSec,
                                    }}
                                >
                                    {g === "male" ? "♂ Male" : "♀ Female"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Height */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>Height</label>
                        {unitSystem === "metric" ? (
                            <div style={{ position: "relative" }}>
                                <input
                                    type="number"
                                    value={heightCm}
                                    min={50}
                                    max={300}
                                    onChange={(e) => setHeightCm(e.target.value === "" ? "" : parseFloat(e.target.value))}
                                    placeholder="175"
                                    style={inputStyle}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = T.accent;
                                        e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = T.border;
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                                <span style={{
                                    position: "absolute", right: 12, top: "50%",
                                    transform: "translateY(-50%)", color: T.muted, fontSize: 12, pointerEvents: "none",
                                }}>cm</span>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="number"
                                        value={heightFt}
                                        min={1}
                                        max={8}
                                        onChange={(e) => setHeightFt(e.target.value === "" ? "" : parseInt(e.target.value))}
                                        placeholder="5"
                                        style={inputStyle}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = T.accent;
                                            e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`;
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = T.border;
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                    <span style={{
                                        position: "absolute", right: 12, top: "50%",
                                        transform: "translateY(-50%)", color: T.muted, fontSize: 12, pointerEvents: "none",
                                    }}>ft</span>
                                </div>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="number"
                                        value={heightIn}
                                        min={0}
                                        max={11}
                                        onChange={(e) => setHeightIn(e.target.value === "" ? "" : parseInt(e.target.value))}
                                        placeholder="9"
                                        style={inputStyle}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = T.accent;
                                            e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`;
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = T.border;
                                            e.target.style.boxShadow = "none";
                                        }}
                                    />
                                    <span style={{
                                        position: "absolute", right: 12, top: "50%",
                                        transform: "translateY(-50%)", color: T.muted, fontSize: 12, pointerEvents: "none",
                                    }}>in</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Weight */}
                    <div style={{ marginBottom: 8 }}>
                        <label style={labelStyle}>Weight</label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="number"
                                value={unitSystem === "metric" ? weightKg : weightLbs}
                                min={1}
                                max={500}
                                onChange={(e) => {
                                    const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                                    if (unitSystem === "metric") setWeightKg(val);
                                    else setWeightLbs(val);
                                }}
                                placeholder={unitSystem === "metric" ? "70" : "154"}
                                style={inputStyle}
                                onFocus={(e) => {
                                    e.target.style.borderColor = T.accent;
                                    e.target.style.boxShadow = `0 0 0 3px ${T.accentGlow}`;
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = T.border;
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                            <span style={{
                                position: "absolute", right: 12, top: "50%",
                                transform: "translateY(-50%)", color: T.muted, fontSize: 12, pointerEvents: "none",
                            }}>
                                {unitSystem === "metric" ? "kg" : "lbs"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── Results Panel ───────────────────────────────────────────── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Gauge */}
                    <div style={{
                        ...panelStyle,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        paddingTop: 16,
                        paddingBottom: 24,
                    }}>
                        <BMIGauge bmi={bmi} />
                    </div>

                    {/* Key Stats */}
                    {bmi !== null && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 12,
                        }}>
                            {/* Healthy Range */}
                            <div style={{
                                ...panelStyle,
                                padding: 16,
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                            }}>
                                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: T.muted }}>
                                    Healthy Weight
                                </span>
                                <span style={{ fontSize: 16, fontWeight: 700, color: T.green }}>
                                    {healthyWeightRange ? `${healthyWeightRange.min} – ${healthyWeightRange.max}` : "—"}
                                </span>
                                <span style={{ fontSize: 11, color: T.muted }}>
                                    {healthyWeightRange?.unit}
                                </span>
                            </div>

                            {/* BMI Prime */}
                            <div style={{
                                ...panelStyle,
                                padding: 16,
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                            }}>
                                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: T.muted }}>
                                    BMI Prime
                                </span>
                                <span style={{ fontSize: 16, fontWeight: 700, color: bmiPrime !== null && bmiPrime <= 1 ? T.green : T.orange }}>
                                    {bmiPrime !== null ? <AnimatedNumber value={bmiPrime} decimals={2} /> : "—"}
                                </span>
                                <span style={{ fontSize: 11, color: T.muted }}>
                                    ratio
                                </span>
                            </div>

                            {/* Ponderal Index */}
                            <div style={{
                                ...panelStyle,
                                padding: 16,
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                            }}>
                                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: T.muted }}>
                                    Ponderal Index
                                </span>
                                <span style={{ fontSize: 16, fontWeight: 700, color: T.blue }}>
                                    {ponderalIndex !== null ? <AnimatedNumber value={ponderalIndex} decimals={1} suffix=" kg/m³" /> : "—"}
                                </span>
                            </div>

                            {/* Weight to adjust */}
                            <div style={{
                                ...panelStyle,
                                padding: 16,
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                            }}>
                                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: T.muted }}>
                                    {weightToLose?.action === "lose" ? "Weight to Lose"
                                        : weightToLose?.action === "gain" ? "Weight to Gain"
                                        : "Status"}
                                </span>
                                <span style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: weightToLose?.action === "maintain" ? T.green
                                        : weightToLose?.action === "lose" ? T.orange
                                        : T.blue,
                                }}>
                                    {weightToLose?.action === "maintain"
                                        ? "✓ Healthy"
                                        : weightToLose ? <AnimatedNumber value={weightToLose.diff} decimals={1} suffix={` ${weightToLose.unit}`} /> : "—"
                                    }
                                </span>
                                {weightToLose?.action !== "maintain" && (
                                    <span style={{ fontSize: 11, color: T.muted }}>
                                        to reach normal BMI
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── BMI Categories Table ────────────────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24, padding: 0, overflow: "hidden" }}>
                <div style={{
                    padding: "16px 24px",
                    borderBottom: `1px solid ${T.surfaceBorder}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <Info size={16} color={T.accent} />
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>BMI Classification (WHO)</h3>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${T.surfaceBorder}` }}>
                            <th style={{ textAlign: "left", padding: "10px 24px", color: T.textSec, fontWeight: 500, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Classification
                            </th>
                            <th style={{ textAlign: "left", padding: "10px 24px", color: T.textSec, fontWeight: 500, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                BMI Range (kg/m²)
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {BMI_CATEGORIES.map((cat, i) => {
                            const isActive = category?.label === cat.label;
                            return (
                                <tr
                                    key={i}
                                    style={{
                                        borderBottom: i < BMI_CATEGORIES.length - 1 ? `1px solid ${T.surfaceBorder}` : "none",
                                        background: isActive ? cat.colorDim : "transparent",
                                        transition: "background 0.3s",
                                    }}
                                >
                                    <td style={{ padding: "10px 24px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: cat.color,
                                                boxShadow: isActive ? `0 0 8px ${cat.color}` : "none",
                                                transition: "box-shadow 0.3s",
                                            }} />
                                            <span style={{
                                                fontWeight: isActive ? 600 : 400,
                                                color: isActive ? cat.color : T.text,
                                            }}>
                                                {cat.label}
                                                {isActive && (
                                                    <span style={{
                                                        marginLeft: 8,
                                                        fontSize: 10,
                                                        padding: "2px 8px",
                                                        borderRadius: 10,
                                                        background: cat.color,
                                                        color: "#fff",
                                                        fontWeight: 600,
                                                    }}>
                                                        YOU
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{
                                        padding: "10px 24px",
                                        color: isActive ? cat.color : T.textSec,
                                        fontWeight: isActive ? 600 : 400,
                                        fontFamily: "monospace",
                                    }}>
                                        {cat.range}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                 CONTENT SECTIONS — Rich SEO educational content
                 ═══════════════════════════════════════════════════════════════ */}

            {/* ─── BMI Introduction ────────────────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 32 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 16px 0", color: T.text }}>
                    What is BMI?
                </h2>
                <p style={contentParagraph}>
                    The Body Mass Index (BMI) Calculator can be used to calculate BMI value and corresponding weight status while taking age into consideration. 
                    Use the <strong style={{ color: T.accentLight }}>&quot;Metric&quot;</strong> tab for the International System of Units or the 
                    <strong style={{ color: T.accentLight }}>&quot;US Units&quot;</strong> tab to input measurements in pounds and inches. 
                    Note that this calculator also computes the <strong>Ponderal Index</strong> in addition to BMI, both of which are discussed below in detail.
                </p>
                <div style={{
                    background: T.surfaceHi,
                    borderRadius: 8,
                    padding: 16,
                    border: `1px solid ${T.surfaceBorder}`,
                    borderLeft: `3px solid ${T.accent}`,
                    marginTop: 16,
                }}>
                    <p style={{ ...contentParagraph, margin: 0 }}>
                        BMI is a measurement of a person&apos;s leanness or corpulence based on their height and weight, and is intended to quantify tissue mass. 
                        It is widely used as a general indicator of whether a person has a healthy body weight for their height. Specifically, the value obtained 
                        from the calculation of BMI is used to categorize whether a person is <strong>underweight</strong>, <strong>normal weight</strong>, 
                        <strong>overweight</strong>, or <strong>obese</strong> depending on what range the value falls between.
                    </p>
                </div>
                <p style={{ ...contentParagraph, marginTop: 16 }}>
                    These ranges of BMI vary based on factors such as region and age, and are sometimes further divided into subcategories such as 
                    severely underweight or very severely obese. Being overweight or underweight can have significant health effects, so while BMI is 
                    an imperfect measure of healthy body weight, it is a useful indicator of whether any additional testing or action is required.
                </p>
            </div>

            {/* ─── BMI Table for Adults (WHO) ─────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px 0" }}>
                    BMI Table for Adults
                </h2>
                <p style={{ ...contentParagraph, marginBottom: 16, marginTop: 0 }}>
                    This is the World Health Organization&apos;s (WHO) recommended body weight based on BMI values for adults. 
                    It is used for both men and women, age 20 or older.
                </p>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${T.surfaceBorder}` }}>
                                <th style={tableHeaderStyle}>Classification</th>
                                <th style={tableHeaderStyle}>BMI Range (kg/m²)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {BMI_CATEGORIES.map((cat, i) => {
                                const isActive = category?.label === cat.label;
                                return (
                                    <tr key={i} style={{
                                        borderBottom: i < BMI_CATEGORIES.length - 1 ? `1px solid ${T.surfaceBorder}` : "none",
                                        background: isActive ? cat.colorDim : "transparent",
                                        transition: "background 0.3s",
                                    }}>
                                        <td style={{ padding: "10px 20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: "50%", background: cat.color,
                                                    boxShadow: isActive ? `0 0 8px ${cat.color}` : "none",
                                                }} />
                                                <span style={{ fontWeight: isActive ? 600 : 400, color: isActive ? cat.color : T.text }}>
                                                    {cat.label}
                                                    {isActive && <span style={youBadge}>YOU</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{
                                            padding: "10px 20px", color: isActive ? cat.color : T.textSec,
                                            fontWeight: isActive ? 600 : 400, fontFamily: "monospace",
                                        }}>{cat.range}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── BMI Table for Children & Teens ─────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px 0" }}>
                    BMI Table for Children &amp; Teens (Age 2–20)
                </h2>
                <p style={{ ...contentParagraph, marginBottom: 16, marginTop: 0 }}>
                    The Centers for Disease Control and Prevention (CDC) recommends BMI categorization for children and teens between age 2 and 20. 
                    For this age group, BMI is interpreted differently — it is compared to age- and sex-specific percentiles because body composition 
                    varies as children grow.
                </p>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${T.surfaceBorder}` }}>
                                <th style={tableHeaderStyle}>Category</th>
                                <th style={tableHeaderStyle}>Percentile Range</th>
                            </tr>
                        </thead>
                        <tbody>
                            {CHILDREN_BMI.map((row, i) => (
                                <tr key={i} style={{ borderBottom: i < CHILDREN_BMI.length - 1 ? `1px solid ${T.surfaceBorder}` : "none" }}>
                                    <td style={{ padding: "10px 20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.color }} />
                                            <span>{row.label}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "10px 20px", fontFamily: "monospace", color: T.textSec }}>{row.range}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Health Risks: Overweight ────────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px 0" }}>
                    Risks Associated with Being Overweight
                </h2>
                <p style={{ ...contentParagraph, marginTop: 0, marginBottom: 16 }}>
                    Being overweight increases the risk of a number of serious diseases and health conditions. 
                    Below is a list of said risks, according to the Centers for Disease Control and Prevention (CDC):
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {OVERWEIGHT_RISKS.map((risk, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "flex-start", gap: 12,
                            padding: "10px 16px",
                            borderRadius: 8,
                            background: i % 2 === 0 ? T.surfaceHi : "transparent",
                        }}>
                            <div style={{
                                width: 6, height: 6, borderRadius: "50%", background: T.red,
                                marginTop: 7, flexShrink: 0,
                            }} />
                            <span style={{ color: T.textSec, fontSize: 13, lineHeight: 1.6 }}>{risk}</span>
                        </div>
                    ))}
                </div>
                <div style={{
                    marginTop: 16, padding: 16, borderRadius: 8,
                    background: T.orangeDim, border: `1px solid ${T.orange}33`,
                }}>
                    <p style={{ ...contentParagraph, margin: 0, fontSize: 13 }}>
                        <strong style={{ color: T.orange }}>Important:</strong> Generally, a person should try to maintain a BMI below 25 kg/m², 
                        but ideally should consult their doctor to determine whether or not they need to make any changes to their lifestyle in order to be healthier.
                    </p>
                </div>
            </div>

            {/* ─── Health Risks: Underweight ───────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px 0" }}>
                    Risks Associated with Being Underweight
                </h2>
                <p style={{ ...contentParagraph, marginTop: 0, marginBottom: 16 }}>
                    Being underweight has its own associated risks, listed below:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {UNDERWEIGHT_RISKS.map((risk, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "flex-start", gap: 12,
                            padding: "10px 16px",
                            borderRadius: 8,
                            background: i % 2 === 0 ? T.surfaceHi : "transparent",
                        }}>
                            <div style={{
                                width: 6, height: 6, borderRadius: "50%", background: T.blue,
                                marginTop: 7, flexShrink: 0,
                            }} />
                            <span style={{ color: T.textSec, fontSize: 13, lineHeight: 1.6 }}>{risk}</span>
                        </div>
                    ))}
                </div>
                <div style={{
                    marginTop: 16, padding: 16, borderRadius: 8,
                    background: T.blueDim, border: `1px solid ${T.blue}33`,
                }}>
                    <p style={{ ...contentParagraph, margin: 0, fontSize: 13 }}>
                        In some cases, being underweight can be a sign of some underlying condition or disease such as anorexia nervosa, which has its own risks. 
                        Consult your doctor if you think you or someone you know is underweight, particularly if the reason for being underweight does not seem obvious.
                    </p>
                </div>
            </div>

            {/* ─── Limitations of BMI ──────────────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px 0" }}>
                    Limitations of BMI
                </h2>
                <p style={{ ...contentParagraph, marginTop: 0 }}>
                    Although BMI is a widely used and useful indicator of healthy body weight, it does have its limitations. BMI is only an estimate that 
                    cannot take body composition into account. Due to a wide variety of body types as well as distribution of muscle, bone mass, and fat, 
                    BMI should be considered along with other measurements rather than being used as the sole method for determining a person&apos;s healthy body weight.
                </p>

                {/* Adults */}
                <div style={{
                    marginTop: 16, padding: 20, borderRadius: 8,
                    background: T.surfaceHi, border: `1px solid ${T.surfaceBorder}`,
                }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 600, color: T.accentLight }}>
                        In Adults
                    </h4>
                    <p style={{ ...contentParagraph, margin: "0 0 12px 0" }}>
                        BMI cannot be fully accurate because it is a measure of excess body weight, rather than excess body fat. 
                        BMI is further influenced by factors such as age, sex, ethnicity, muscle mass, body fat, and activity level. 
                        For example, an older person who is considered a healthy weight, but is completely inactive in their daily life may have significant 
                        amounts of excess body fat even though they are not heavy.
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {ADULT_LIMITATIONS.map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, paddingLeft: 4 }}>
                                <span style={{ color: T.accent, marginTop: 2 }}>→</span>
                                <span style={{ color: T.textSec, fontSize: 13, lineHeight: 1.6 }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Children */}
                <div style={{
                    marginTop: 12, padding: 20, borderRadius: 8,
                    background: T.surfaceHi, border: `1px solid ${T.surfaceBorder}`,
                }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: 15, fontWeight: 600, color: T.accentLight }}>
                        In Children &amp; Adolescents
                    </h4>
                    <p style={{ ...contentParagraph, margin: 0 }}>
                        The same factors that limit the efficacy of BMI for adults can also apply to children and adolescents. Additionally, height and level of 
                        sexual maturation can influence BMI and body fat among children. BMI is a better indicator of excess body fat for obese children than 
                        it is for overweight children, whose BMI could be a result of increased levels of either fat or fat-free mass (all body components except 
                        for fat, which includes water, organs, muscle, etc.). In thin children, the difference in BMI can also be due to fat-free mass.
                    </p>
                </div>

                <div style={{
                    marginTop: 16, padding: 16, borderRadius: 8,
                    background: T.greenDim, border: `1px solid ${T.green}33`,
                }}>
                    <p style={{ ...contentParagraph, margin: 0, fontSize: 13 }}>
                        That being said, BMI is fairly indicative of body fat for <strong style={{ color: T.green }}>90–95% of the population</strong>, 
                        and can effectively be used along with other measures to help determine an individual&apos;s healthy body weight.
                    </p>
                </div>
            </div>

            {/* ─── BMI Formula ─────────────────────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px 0" }}>
                    BMI Formula
                </h2>
                <p style={{ ...contentParagraph, marginTop: 0, marginBottom: 20 }}>
                    Below are the equations used for calculating BMI in the International System of Units (SI) and the US customary system (USC), 
                    using a 5&apos;10&quot;, 160-pound individual as an example:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    {/* Metric */}
                    <div style={formulaCardStyle}>
                        <div style={formulaLabelStyle}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent }} />
                            SI / Metric Units
                        </div>
                        <div style={formulaMainStyle}>
                            BMI = <span style={formulaFractionStyle}>
                                <span style={formulaNumeratorStyle}>mass (kg)</span>
                                <span style={formulaDenominatorStyle}>height² (m)</span>
                            </span>
                        </div>
                        <div style={formulaExampleStyle}>
                            <span style={formulaEqualsStyle}>=</span>
                            <span style={formulaFractionStyle}>
                                <span style={formulaNumeratorStyle}>72.57</span>
                                <span style={formulaDenominatorStyle}>1.778²</span>
                            </span>
                            <span style={formulaEqualsStyle}>=</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: T.green }}>23.0</span>
                        </div>
                    </div>

                    {/* Imperial */}
                    <div style={formulaCardStyle}>
                        <div style={formulaLabelStyle}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.purple }} />
                            US Customary Units
                        </div>
                        <div style={formulaMainStyle}>
                            BMI = 703 × <span style={formulaFractionStyle}>
                                <span style={formulaNumeratorStyle}>mass (lbs)</span>
                                <span style={formulaDenominatorStyle}>height² (in)</span>
                            </span>
                        </div>
                        <div style={formulaExampleStyle}>
                            <span style={formulaEqualsStyle}>= 703 ×</span>
                            <span style={formulaFractionStyle}>
                                <span style={formulaNumeratorStyle}>160</span>
                                <span style={formulaDenominatorStyle}>70²</span>
                            </span>
                            <span style={formulaEqualsStyle}>=</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: T.green }}>23.0</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── BMI Prime ───────────────────────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px 0" }}>
                    BMI Prime
                </h2>
                <p style={{ ...contentParagraph, marginTop: 0 }}>
                    BMI Prime is the ratio of a person&apos;s measured BMI to the upper limit of BMI that is considered &quot;normal&quot; by institutions such as the 
                    WHO and the CDC. This upper limit, referred to as BMI<sub>upper</sub>, is <strong style={{ color: T.accentLight }}>25 kg/m²</strong>.
                </p>
                <div style={{
                    ...formulaCardStyle,
                    marginTop: 16,
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: "center",
                }}>
                    <div style={{ ...formulaMainStyle, fontSize: 18 }}>
                        BMI Prime = <span style={formulaFractionStyle}>
                            <span style={formulaNumeratorStyle}>BMI</span>
                            <span style={formulaDenominatorStyle}>25</span>
                        </span>
                    </div>
                </div>
                <p style={{ ...contentParagraph, marginBottom: 16 }}>
                    Since BMI Prime is a ratio of two BMI values, it is a <strong>dimensionless value</strong>. A person who has a BMI Prime less than 0.74 is classified as 
                    underweight; from 0.74 to 1 is classified as normal; greater than 1 is classified as overweight; and greater than 1.2 is classified as obese.
                </p>

                {/* BMI Prime Table */}
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${T.surfaceBorder}` }}>
                                <th style={tableHeaderStyle}>Classification</th>
                                <th style={tableHeaderStyle}>BMI (kg/m²)</th>
                                <th style={tableHeaderStyle}>BMI Prime</th>
                            </tr>
                        </thead>
                        <tbody>
                            {BMI_PRIME_TABLE.map((row, i) => {
                                const isActive = category?.label === row.label;
                                return (
                                    <tr key={i} style={{
                                        borderBottom: i < BMI_PRIME_TABLE.length - 1 ? `1px solid ${T.surfaceBorder}` : "none",
                                        background: isActive ? row.colorDim : "transparent",
                                    }}>
                                        <td style={{ padding: "10px 20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.color }} />
                                                <span style={{ fontWeight: isActive ? 600 : 400, color: isActive ? row.color : T.text }}>
                                                    {row.label}
                                                    {isActive && <span style={youBadge}>YOU</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "10px 20px", fontFamily: "monospace", color: isActive ? row.color : T.textSec, fontWeight: isActive ? 600 : 400 }}>
                                            {row.bmiRange}
                                        </td>
                                        <td style={{ padding: "10px 20px", fontFamily: "monospace", color: isActive ? row.color : T.textSec, fontWeight: isActive ? 600 : 400 }}>
                                            {row.primeRange}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <p style={{ ...contentParagraph, marginTop: 16, marginBottom: 0 }}>
                    BMI Prime allows us to make a quick assessment of how much a person&apos;s BMI differs from the upper limit of BMI that is considered normal. 
                    It also allows for comparisons between groups of people who have different upper BMI limits.
                </p>
            </div>

            {/* ─── Ponderal Index ───────────────────────────────────────────── */}
            <div style={{ ...panelStyle, marginTop: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px 0" }}>
                    Ponderal Index
                </h2>
                <p style={{ ...contentParagraph, marginTop: 0 }}>
                    The Ponderal Index (PI) is similar to BMI in that it measures the leanness or corpulence of a person based on their height and weight. 
                    The main difference between the PI and BMI is the <strong style={{ color: T.accentLight }}>cubing rather than squaring</strong> of 
                    the height in the formula. While BMI can be a useful tool when considering large populations, it is not reliable for determining leanness 
                    or corpulence in individuals.
                </p>
                <p style={contentParagraph}>
                    Although the PI suffers from similar considerations, the PI is more reliable for use with <strong>very tall or short individuals</strong>, 
                    while BMI tends to record uncharacteristically high or low body fat levels for those on the extreme ends of the height and weight spectrum.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                    {/* SI */}
                    <div style={formulaCardStyle}>
                        <div style={formulaLabelStyle}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.teal }} />
                            SI / Metric Units
                        </div>
                        <div style={formulaMainStyle}>
                            PI = <span style={formulaFractionStyle}>
                                <span style={formulaNumeratorStyle}>mass (kg)</span>
                                <span style={formulaDenominatorStyle}>height³ (m)</span>
                            </span>
                        </div>
                        <div style={formulaExampleStyle}>
                            <span style={formulaEqualsStyle}>=</span>
                            <span style={formulaFractionStyle}>
                                <span style={formulaNumeratorStyle}>72.57</span>
                                <span style={formulaDenominatorStyle}>1.778³</span>
                            </span>
                            <span style={formulaEqualsStyle}>=</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: T.teal }}>12.9</span>
                        </div>
                    </div>

                    {/* USC */}
                    <div style={formulaCardStyle}>
                        <div style={formulaLabelStyle}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.purple }} />
                            US Customary Units
                        </div>
                        <div style={formulaMainStyle}>
                            PI = <span style={formulaFractionStyle}>
                                <span style={formulaNumeratorStyle}>height (in)</span>
                                <span style={formulaDenominatorStyle}>∛mass (lbs)</span>
                            </span>
                        </div>
                        <div style={formulaExampleStyle}>
                            <span style={formulaEqualsStyle}>=</span>
                            <span style={formulaFractionStyle}>
                                <span style={formulaNumeratorStyle}>70</span>
                                <span style={formulaDenominatorStyle}>∛160</span>
                            </span>
                            <span style={formulaEqualsStyle}>=</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: T.teal }}>12.9</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── FAQ Section ─────────────────────────────────────────────── */}
            <div style={{ marginTop: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px 0" }}>
                    Frequently Asked Questions
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {FAQS.map((faq, i) => (
                        <div
                            key={i}
                            style={{
                                ...panelStyle,
                                padding: 0,
                                overflow: "hidden",
                                cursor: "pointer",
                                transition: "border-color 0.2s",
                                borderColor: faqOpen === i ? T.accent : T.surfaceBorder,
                            }}
                            onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                        >
                            <div style={{
                                padding: "14px 20px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}>
                                <span style={{ fontWeight: 500, fontSize: 14 }}>{faq.q}</span>
                                <ChevronDown
                                    size={16}
                                    color={T.muted}
                                    style={{
                                        transform: faqOpen === i ? "rotate(180deg)" : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                        flexShrink: 0,
                                    }}
                                />
                            </div>
                            <div style={{
                                maxHeight: faqOpen === i ? 400 : 0,
                                overflow: "hidden",
                                transition: "max-height 0.3s ease",
                            }}>
                                <div style={{
                                    padding: "0 20px 16px 20px",
                                    color: T.textSec,
                                    fontSize: 13,
                                    lineHeight: 1.7,
                                }}>
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Responsive override for mobile */}
            <style>{`
                @media (max-width: 700px) {
                    div[style*="gridTemplateColumns: 1fr 1fr"][style*="gap: 24"] {
                        grid-template-columns: 1fr !important;
                    }
                    div[style*="gridTemplateColumns: 1fr 1fr"][style*="gap: 16"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
