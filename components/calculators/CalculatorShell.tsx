"use client";

import React, { useState, useEffect } from "react";
import { getCalculator } from "@/lib/calculators";

const T = {
    background: "#121212",
    surface: "#1e1e1e",
    surfaceHi: "#2a2a2a",
    text: "#ffffff",
    textSec: "#a0a0a0",
    muted: "#666666",
    border: "#333333",
    borderDim: "#222222",
    accent: "#6366f1"
};

interface CalculatorShellProps {
    calculatorId: string;
}

export default function CalculatorShell({ calculatorId }: CalculatorShellProps) {
    const calculator = getCalculator(calculatorId);
    const [inputs, setInputs] = useState<Record<string, any>>({});
    const [result, setResult] = useState<any>(null);

    // If calculator not found, return null
    if (!calculator) return null;

    // Initialize inputs with default values
    useEffect(() => {
        const initialInputs: Record<string, any> = {};
        calculator.inputs.forEach(input => {
            initialInputs[input.id] = input.defaultValue ?? "";
        });
        setInputs(initialInputs);
    }, [calculator]);

    // Recalculate whenever inputs change
    useEffect(() => {
        if (Object.keys(inputs).length > 0) {
            try {
                const res = calculator.calculate(inputs);
                setResult(res);
            } catch (e) {
                console.error("Calculation error", e);
            }
        }
    }, [inputs, calculator]);

    const handleInputChange = (id: string, value: any) => {
        setInputs(prev => ({ ...prev, [id]: value }));
    };

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 16px", color: T.text }}>
            {/* Header */}
            <div style={{ marginBottom: 32, textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                    <div style={{ padding: 12, borderRadius: "50%", background: T.surfaceHi, border: `1px solid ${T.border}` }}>
                        <calculator.icon size={32} color={T.accent} />
                    </div>
                </div>
                <h1 style={{ fontSize: 28, margin: "0 0 8px 0" }}>{calculator.name}</h1>
                <p style={{ color: T.muted, margin: 0 }}>{calculator.description}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
                {/* Inputs Panel */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 24, borderRadius: 8 }}>
                    <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 20 }}>Inputs</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {calculator.inputs.map(input => (
                            <div key={input.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                <label style={{ fontSize: 13, fontWeight: 500, color: T.textSec }}>{input.label}</label>
                                {input.type === "select" || input.type === "toggle" ? (
                                    <select
                                        value={inputs[input.id] ?? ""}
                                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                                        style={{
                                            padding: "10px 12px", borderRadius: 6, background: T.surfaceHi, 
                                            border: `1px solid ${T.border}`, color: T.text, fontSize: 14
                                        }}
                                    >
                                        {input.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={input.type === "date" ? "date" : "number"}
                                        value={inputs[input.id] ?? ""}
                                        step={input.step || 1}
                                        onChange={(e) => {
                                            const val = input.type === "date" ? e.target.value : parseFloat(e.target.value);
                                            handleInputChange(input.id, isNaN(val as any) ? "" : val);
                                        }}
                                        style={{
                                            padding: "10px 12px", borderRadius: 6, background: T.surfaceHi, 
                                            border: `1px solid ${T.border}`, color: T.text, fontSize: 14
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Results Panel */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: 24, borderRadius: 8 }}>
                    <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 20 }}>Results</h2>
                    <pre style={{ 
                        background: T.surfaceHi, padding: 16, borderRadius: 6, 
                        fontSize: 13, overflowX: "auto", color: T.text, border: `1px solid ${T.borderDim}`
                    }}>
                        {result ? JSON.stringify(result, null, 2) : "Calculating..."}
                    </pre>
                </div>
            </div>

            {/* SEO Content */}
            <div style={{ marginTop: 40, borderTop: `1px solid ${T.borderDim}`, paddingTop: 32 }}>
                <h3 style={{ fontSize: 20, marginBottom: 12 }}>How it Works</h3>
                <p style={{ color: T.textSec, lineHeight: 1.6 }}>{calculator.content?.howItWorks}</p>

                {calculator.content?.faqs && calculator.content.faqs.length > 0 && (
                    <div style={{ marginTop: 32 }}>
                        <h3 style={{ fontSize: 20, marginBottom: 16 }}>Frequently Asked Questions</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {calculator.content.faqs.map((faq, i) => (
                                <div key={i} style={{ background: T.surface, padding: 16, borderRadius: 6, border: `1px solid ${T.borderDim}` }}>
                                    <h4 style={{ margin: "0 0 8px 0", fontSize: 15 }}>{faq.question}</h4>
                                    <p style={{ margin: 0, color: T.textSec, fontSize: 14, lineHeight: 1.5 }}>{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
