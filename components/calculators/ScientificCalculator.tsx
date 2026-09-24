"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Calculator, ChevronDown, History, Delete } from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
    bg: "#0a0a0a",
    surface: "#141414",
    surfaceHi: "#1c1c1c",
    surfaceBright: "#242424",
    surfaceBorder: "rgba(255,255,255,0.06)",
    text: "#f0ede8",
    textSec: "#a0a0a0",
    muted: "#666",
    border: "#2a2a2a",
    accent: "#6366f1",
    accentLight: "#818cf8",
    accentDim: "rgba(99,102,241,0.12)",
    accentGlow: "rgba(99,102,241,0.25)",
    orange: "#f59e0b",
    orangeDim: "rgba(245,158,11,0.10)",
    teal: "#14b8a6",
    tealDim: "rgba(20,184,166,0.10)",
    red: "#ef4444",
    redDim: "rgba(239,68,68,0.12)",
    blue: "#3b82f6",
    blueDim: "rgba(59,130,246,0.10)",
};

// ─── Safe Expression Parser ───────────────────────────────────────────────────
// Recursive-descent parser: no eval(). Supports +, -, *, /, ^, unary -, functions, constants.
class Parser {
    private pos = 0;
    private expr: string;
    private angleMode: "deg" | "rad";

    constructor(expr: string, angleMode: "deg" | "rad") {
        this.expr = expr.replace(/\s/g, "");
        this.angleMode = angleMode;
    }

    parse(): number {
        const result = this.parseExpression();
        if (this.pos < this.expr.length) {
            throw new Error("Unexpected character: " + this.expr[this.pos]);
        }
        return result;
    }

    private parseExpression(): number {
        let left = this.parseTerm();
        while (this.pos < this.expr.length) {
            const ch = this.expr[this.pos];
            if (ch === "+") { this.pos++; left += this.parseTerm(); }
            else if (ch === "-") { this.pos++; left -= this.parseTerm(); }
            else break;
        }
        return left;
    }

    private parseTerm(): number {
        let left = this.parseExponent();
        while (this.pos < this.expr.length) {
            const ch = this.expr[this.pos];
            if (ch === "*" || ch === "×") { this.pos++; left *= this.parseExponent(); }
            else if (ch === "/" || ch === "÷") {
                this.pos++;
                const right = this.parseExponent();
                if (right === 0) throw new Error("Division by zero");
                left /= right;
            }
            else break;
        }
        return left;
    }

    private parseExponent(): number {
        let base = this.parseUnary();
        while (this.pos < this.expr.length && this.expr[this.pos] === "^") {
            this.pos++;
            const exp = this.parseUnary();
            base = Math.pow(base, exp);
        }
        return base;
    }

    private parseUnary(): number {
        if (this.expr[this.pos] === "-") {
            this.pos++;
            return -this.parseUnary();
        }
        if (this.expr[this.pos] === "+") {
            this.pos++;
            return this.parseUnary();
        }
        return this.parsePrimary();
    }

    private toRad(angle: number): number {
        return this.angleMode === "deg" ? (angle * Math.PI) / 180 : angle;
    }

    private fromRad(angle: number): number {
        return this.angleMode === "deg" ? (angle * 180) / Math.PI : angle;
    }

    private factorial(n: number): number {
        if (n < 0) throw new Error("Factorial of negative");
        if (n > 170) return Infinity;
        if (!Number.isInteger(n)) throw new Error("Factorial of non-integer");
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    private parsePrimary(): number {
        // Parentheses
        if (this.expr[this.pos] === "(") {
            this.pos++;
            const val = this.parseExpression();
            if (this.expr[this.pos] === ")") this.pos++;
            return val;
        }

        // Functions
        const funcNames = [
            "asin", "acos", "atan", "sinh", "cosh", "tanh",
            "sin", "cos", "tan", "ln", "log", "sqrt", "cbrt", "abs", "exp",
        ];
        for (const fn of funcNames) {
            if (this.expr.substring(this.pos, this.pos + fn.length) === fn) {
                const afterFn = this.pos + fn.length;
                if (this.expr[afterFn] === "(") {
                    this.pos = afterFn + 1;
                    const arg = this.parseExpression();
                    if (this.expr[this.pos] === ")") this.pos++;
                    return this.applyFunction(fn, arg);
                }
            }
        }

        // Constants
        if (this.expr.substring(this.pos, this.pos + 2) === "pi" || this.expr[this.pos] === "π") {
            this.pos += this.expr[this.pos] === "π" ? 1 : 2;
            return Math.PI;
        }
        if (this.expr[this.pos] === "e" && (this.pos + 1 >= this.expr.length || !/[a-z]/i.test(this.expr[this.pos + 1]))) {
            this.pos++;
            return Math.E;
        }

        // Number (including scientific notation like 2.5e10)
        const start = this.pos;
        while (this.pos < this.expr.length && (/[0-9.]/.test(this.expr[this.pos]) || (this.expr[this.pos].toLowerCase() === "e" && /[0-9+\-]/.test(this.expr[this.pos + 1] || "")))) {
            if (this.expr[this.pos].toLowerCase() === "e") {
                this.pos++;
                if (this.expr[this.pos] === "+" || this.expr[this.pos] === "-") this.pos++;
            } else {
                this.pos++;
            }
        }
        if (this.pos === start) throw new Error("Unexpected: " + (this.expr[this.pos] || "end"));
        const num = parseFloat(this.expr.substring(start, this.pos));
        if (isNaN(num)) throw new Error("Invalid number");

        // Postfix factorial
        if (this.pos < this.expr.length && this.expr[this.pos] === "!") {
            this.pos++;
            return this.factorial(num);
        }

        return num;
    }

    private applyFunction(fn: string, arg: number): number {
        switch (fn) {
            case "sin": return Math.sin(this.toRad(arg));
            case "cos": return Math.cos(this.toRad(arg));
            case "tan": return Math.tan(this.toRad(arg));
            case "asin": return this.fromRad(Math.asin(arg));
            case "acos": return this.fromRad(Math.acos(arg));
            case "atan": return this.fromRad(Math.atan(arg));
            case "sinh": return Math.sinh(arg);
            case "cosh": return Math.cosh(arg);
            case "tanh": return Math.tanh(arg);
            case "ln": return Math.log(arg);
            case "log": return Math.log10(arg);
            case "sqrt": return Math.sqrt(arg);
            case "cbrt": return Math.cbrt(arg);
            case "abs": return Math.abs(arg);
            case "exp": return Math.exp(arg);
            default: throw new Error("Unknown function: " + fn);
        }
    }
}

function safeEvaluate(expression: string, angleMode: "deg" | "rad"): number {
    const parser = new Parser(expression, angleMode);
    return parser.parse();
}

// ─── Format Display Number ────────────────────────────────────────────────────
function formatNumber(n: number): string {
    if (isNaN(n)) return "Error";
    if (!isFinite(n)) return n > 0 ? "Infinity" : "-Infinity";
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString("en-US");
    if (Math.abs(n) < 0.0001 || Math.abs(n) >= 1e15) return n.toExponential(8);
    const s = n.toPrecision(12);
    return parseFloat(s).toString();
}

// ─── History item ─────────────────────────────────────────────────────────────
interface HistoryItem {
    expression: string;
    result: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════
interface CalcButton {
    label: string;
    display?: string; // what to show on button face (if different from label)
    action: string;   // what action the button performs
    type: "sci" | "num" | "op" | "func" | "mem" | "ctrl";
    span?: number;    // column span
}

const BUTTONS: CalcButton[][] = [
    // Row 1: Scientific functions
    [
        { label: "sin", action: "fn:sin", type: "sci" },
        { label: "cos", action: "fn:cos", type: "sci" },
        { label: "tan", action: "fn:tan", type: "sci" },
        { label: "Deg", action: "toggle:angle", type: "ctrl", display: "Deg" },
        { label: "7", action: "num:7", type: "num" },
        { label: "8", action: "num:8", type: "num" },
        { label: "9", action: "num:9", type: "num" },
        { label: "+", action: "op:+", type: "op" },
        { label: "⌫", action: "backspace", type: "ctrl" },
    ],
    // Row 2
    [
        { label: "sin⁻¹", action: "fn:asin", type: "sci" },
        { label: "cos⁻¹", action: "fn:acos", type: "sci" },
        { label: "tan⁻¹", action: "fn:atan", type: "sci" },
        { label: "π", action: "const:pi", type: "sci" },
        { label: "4", action: "num:4", type: "num" },
        { label: "5", action: "num:5", type: "num" },
        { label: "6", action: "num:6", type: "num" },
        { label: "−", action: "op:-", type: "op" },
        { label: "Ans", action: "ans", type: "mem" },
    ],
    // Row 3
    [
        { label: "xʸ", action: "op:^", type: "sci" },
        { label: "x³", action: "fn:cube", type: "sci" },
        { label: "x²", action: "fn:square", type: "sci" },
        { label: "eˣ", action: "fn:exp", type: "sci" },
        { label: "1", action: "num:1", type: "num" },
        { label: "2", action: "num:2", type: "num" },
        { label: "3", action: "num:3", type: "num" },
        { label: "×", action: "op:*", type: "op" },
        { label: "M+", action: "mem:add", type: "mem" },
    ],
    // Row 4
    [
        { label: "ʸ√x", action: "fn:nthroot", type: "sci" },
        { label: "³√x", action: "fn:cbrt", type: "sci" },
        { label: "√x", action: "fn:sqrt", type: "sci" },
        { label: "ln", action: "fn:ln", type: "sci" },
        { label: "0", action: "num:0", type: "num" },
        { label: ".", action: "num:.", type: "num" },
        { label: "EXP", action: "fn:sciexp", type: "sci" },
        { label: "÷", action: "op:/", type: "op" },
        { label: "M−", action: "mem:sub", type: "mem" },
    ],
    // Row 5
    [
        { label: "(", action: "paren:(", type: "func" },
        { label: ")", action: "paren:)", type: "func" },
        { label: "1/x", action: "fn:recip", type: "sci" },
        { label: "log", action: "fn:log", type: "sci" },
        { label: "±", action: "negate", type: "func" },
        { label: "%", action: "op:%", type: "func" },
        { label: "n!", action: "fn:fact", type: "sci" },
        { label: "AC", action: "clear", type: "ctrl" },
        { label: "=", action: "equals", type: "op" },
    ],
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ScientificCalculator() {
    const [expression, setExpression] = useState("");
    const [display, setDisplay] = useState("0");
    const [prevResult, setPrevResult] = useState<string | null>(null);
    const [angleMode, setAngleMode] = useState<"deg" | "rad">("deg");
    const [memory, setMemory] = useState(0);
    const [hasMemory, setHasMemory] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [lastAnswer, setLastAnswer] = useState(0);
    const [justEvaluated, setJustEvaluated] = useState(false);
    const [pressedKey, setPressedKey] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const displayRef = useRef<HTMLDivElement>(null);

    // ─── Auto-scroll display ──────────────────────────────────────────────────
    useEffect(() => {
        if (displayRef.current) {
            displayRef.current.scrollLeft = displayRef.current.scrollWidth;
        }
    }, [expression, display]);

    // ─── Evaluate expression ──────────────────────────────────────────────────
    const evaluate = useCallback(() => {
        if (!expression && display === "0") return;
        const expr = expression || display;
        try {
            // Replace display characters with parseable ones
            let evalExpr = expr
                .replace(/×/g, "*")
                .replace(/÷/g, "/")
                .replace(/−/g, "-")
                .replace(/π/g, "pi")
                .replace(/Ans/g, String(lastAnswer));

            const result = safeEvaluate(evalExpr, angleMode);
            const formatted = formatNumber(result);
            setDisplay(formatted);
            setExpression("");
            setPrevResult(expr + " =");
            setLastAnswer(result);
            setJustEvaluated(true);
            setHistory(prev => [{ expression: expr, result: formatted }, ...prev].slice(0, 50));
        } catch {
            setDisplay("Error");
            setExpression("");
            setPrevResult(expr + " =");
            setJustEvaluated(true);
        }
    }, [expression, display, angleMode, lastAnswer]);

    // ─── Handle button press ──────────────────────────────────────────────────
    const handleAction = useCallback((action: string) => {
        const appendToExpr = (val: string) => {
            if (justEvaluated) {
                // If user types a number after evaluation, start fresh
                // If user types an operator, continue with the result
                if (/^[0-9.]/.test(val) || val === "(" || val.endsWith("(")) {
                    setExpression(val);
                    setDisplay(val);
                    setPrevResult(null);
                } else {
                    setExpression(display + val);
                    setDisplay(display + val);
                }
                setJustEvaluated(false);
                return;
            }
            const newExpr = expression + val;
            setExpression(newExpr);
            setDisplay(newExpr);
        };

        if (action.startsWith("num:")) {
            const num = action.slice(4);
            appendToExpr(num);
            return;
        }

        if (action.startsWith("op:")) {
            const op = action.slice(3);
            const opChar = op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : op === "%" ? "%" : op;
            appendToExpr(opChar);
            return;
        }

        if (action.startsWith("fn:")) {
            const fn = action.slice(3);
            switch (fn) {
                case "sin": case "cos": case "tan":
                case "asin": case "acos": case "atan":
                case "ln": case "log": case "sqrt": case "cbrt": case "exp":
                    appendToExpr(fn + "(");
                    break;
                case "square": {
                    const currentExpr = expression || display;
                    if (justEvaluated) {
                        setExpression("(" + display + ")^2");
                        setDisplay("(" + display + ")^2");
                    } else {
                        appendToExpr("^2");
                    }
                    setJustEvaluated(false);
                    break;
                }
                case "cube": {
                    if (justEvaluated) {
                        setExpression("(" + display + ")^3");
                        setDisplay("(" + display + ")^3");
                    } else {
                        appendToExpr("^3");
                    }
                    setJustEvaluated(false);
                    break;
                }
                case "nthroot":
                    appendToExpr("^(1/");
                    break;
                case "recip": {
                    if (justEvaluated) {
                        setExpression("1/(" + display + ")");
                        setDisplay("1/(" + display + ")");
                    } else {
                        appendToExpr("1/(");
                    }
                    setJustEvaluated(false);
                    break;
                }
                case "fact":
                    appendToExpr("!");
                    break;
                case "sciexp":
                    appendToExpr("e");
                    break;
            }
            return;
        }

        if (action.startsWith("const:")) {
            if (action === "const:pi") appendToExpr("π");
            if (action === "const:e") appendToExpr("e");
            return;
        }

        if (action.startsWith("paren:")) {
            appendToExpr(action.slice(6));
            return;
        }

        if (action.startsWith("mem:")) {
            const currentVal = (() => {
                try {
                    let evalExpr = (expression || display)
                        .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-")
                        .replace(/π/g, "pi").replace(/Ans/g, String(lastAnswer));
                    return safeEvaluate(evalExpr, angleMode);
                } catch { return 0; }
            })();

            switch (action) {
                case "mem:add":
                    setMemory(prev => prev + currentVal);
                    setHasMemory(true);
                    break;
                case "mem:sub":
                    setMemory(prev => prev - currentVal);
                    setHasMemory(true);
                    break;
            }
            return;
        }

        switch (action) {
            case "toggle:angle":
                setAngleMode(prev => prev === "deg" ? "rad" : "deg");
                break;
            case "ans":
                appendToExpr("Ans");
                break;
            case "negate": {
                if (justEvaluated) {
                    const negated = -lastAnswer;
                    setDisplay(formatNumber(negated));
                    setLastAnswer(negated);
                } else {
                    const currentExpr = expression || display;
                    if (currentExpr.startsWith("−") || currentExpr.startsWith("-")) {
                        const newExpr = currentExpr.slice(1);
                        setExpression(newExpr);
                        setDisplay(newExpr || "0");
                    } else {
                        setExpression("−" + currentExpr);
                        setDisplay("−" + currentExpr);
                    }
                }
                break;
            }
            case "backspace": {
                if (justEvaluated) {
                    setExpression("");
                    setDisplay("0");
                    setPrevResult(null);
                    setJustEvaluated(false);
                } else {
                    const newExpr = expression.slice(0, -1);
                    setExpression(newExpr);
                    setDisplay(newExpr || "0");
                }
                break;
            }
            case "clear":
                setExpression("");
                setDisplay("0");
                setPrevResult(null);
                setJustEvaluated(false);
                break;
            case "equals":
                evaluate();
                break;
        }
    }, [expression, display, justEvaluated, lastAnswer, angleMode, evaluate]);

    // ─── Keyboard support ─────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Don't capture if user is typing in an input elsewhere
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            let action = "";
            const key = e.key;

            if (/^[0-9]$/.test(key)) action = `num:${key}`;
            else if (key === ".") action = "num:.";
            else if (key === "+") action = "op:+";
            else if (key === "-") action = "op:-";
            else if (key === "*") action = "op:*";
            else if (key === "/") { e.preventDefault(); action = "op:/"; }
            else if (key === "%") action = "op:%";
            else if (key === "^") action = "op:^";
            else if (key === "(") action = "paren:(";
            else if (key === ")") action = "paren:)";
            else if (key === "!" ) action = "fn:fact";
            else if (key === "Enter" || key === "=") { e.preventDefault(); action = "equals"; }
            else if (key === "Backspace") action = "backspace";
            else if (key === "Escape" || key === "Delete") action = "clear";

            if (action) {
                setPressedKey(action);
                setTimeout(() => setPressedKey(null), 120);
                handleAction(action);
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [handleAction]);

    // ─── Memory Recall (click MR badge) ───────────────────────────────────────
    const recallMemory = useCallback(() => {
        if (!hasMemory) return;
        const memStr = formatNumber(memory);
        if (justEvaluated) {
            setExpression(memStr);
            setDisplay(memStr);
            setPrevResult(null);
            setJustEvaluated(false);
        } else {
            setExpression(prev => prev + memStr);
            setDisplay(prev => (prev === "0" ? memStr : prev + memStr));
        }
    }, [hasMemory, memory, justEvaluated]);

    const clearMemory = useCallback(() => {
        setMemory(0);
        setHasMemory(false);
    }, []);

    // ─── Button Styles ────────────────────────────────────────────────────────
    const getButtonStyle = (btn: CalcButton, isPressed: boolean): React.CSSProperties => {
        const base: React.CSSProperties = {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
            height: 54,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
            transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden",
            userSelect: "none",
            WebkitTapHighlightColor: "transparent",
            transform: isPressed ? "scale(0.93)" : "scale(1)",
            outline: "none",
        };

        switch (btn.type) {
            case "num":
                return {
                    ...base,
                    background: isPressed ? "#3a3a3a" : T.surfaceBright,
                    color: T.text,
                    fontSize: 18,
                    fontWeight: 500,
                    border: `1px solid ${isPressed ? "rgba(255,255,255,0.12)" : T.surfaceBorder}`,
                    boxShadow: isPressed ? "inset 0 2px 6px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
                };
            case "op":
                if (btn.label === "=") {
                    return {
                        ...base,
                        background: isPressed
                            ? "linear-gradient(135deg, #4f46e5, #4338ca)"
                            : `linear-gradient(135deg, ${T.accent}, #7c3aed)`,
                        color: "#fff",
                        fontSize: 20,
                        fontWeight: 700,
                        border: `1px solid ${T.accentGlow}`,
                        boxShadow: isPressed
                            ? "inset 0 2px 6px rgba(0,0,0,0.3)"
                            : `0 4px 20px ${T.accentGlow}, 0 2px 8px rgba(0,0,0,0.3)`,
                    };
                }
                return {
                    ...base,
                    background: isPressed ? "rgba(245,158,11,0.2)" : T.orangeDim,
                    color: T.orange,
                    fontSize: 18,
                    fontWeight: 700,
                    border: `1px solid ${isPressed ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.15)"}`,
                    boxShadow: isPressed ? "inset 0 2px 6px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.15)",
                };
            case "sci":
                return {
                    ...base,
                    background: isPressed ? "rgba(20,184,166,0.15)" : T.tealDim,
                    color: T.teal,
                    fontSize: 12,
                    fontWeight: 600,
                    border: `1px solid ${isPressed ? "rgba(20,184,166,0.25)" : "rgba(20,184,166,0.1)"}`,
                    boxShadow: isPressed ? "inset 0 2px 6px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.12)",
                };
            case "func":
                return {
                    ...base,
                    background: isPressed ? "rgba(59,130,246,0.15)" : T.blueDim,
                    color: T.blue,
                    fontSize: 13,
                    fontWeight: 600,
                    border: `1px solid ${isPressed ? "rgba(59,130,246,0.25)" : "rgba(59,130,246,0.1)"}`,
                    boxShadow: isPressed ? "inset 0 2px 6px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.12)",
                };
            case "mem":
                return {
                    ...base,
                    background: isPressed ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.08)",
                    color: "#a78bfa",
                    fontSize: 12,
                    fontWeight: 600,
                    border: `1px solid ${isPressed ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.1)"}`,
                    boxShadow: isPressed ? "inset 0 2px 6px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.12)",
                };
            case "ctrl":
                if (btn.label === "AC") {
                    return {
                        ...base,
                        background: isPressed ? "rgba(239,68,68,0.2)" : T.redDim,
                        color: T.red,
                        fontSize: 14,
                        fontWeight: 700,
                        border: `1px solid ${isPressed ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.15)"}`,
                        boxShadow: isPressed ? "inset 0 2px 6px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.12)",
                    };
                }
                return {
                    ...base,
                    background: isPressed ? "#2a2a2a" : T.surfaceHi,
                    color: T.textSec,
                    fontSize: 13,
                    fontWeight: 600,
                    border: `1px solid ${T.surfaceBorder}`,
                    boxShadow: isPressed ? "inset 0 2px 6px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.12)",
                };
            default:
                return base;
        }
    };

    // ─── FAQs ─────────────────────────────────────────────────────────────────
    const [faqOpen, setFaqOpen] = useState<number | null>(null);
    const faqs = [
        { q: "What formulas does this calculator use?", a: "Standard mathematical functions from the JavaScript Math library — sin, cos, tan (and their inverses), natural log (ln), base-10 log (log), square root, cube root, exponentials, and factorial. Trigonometric functions respect the Deg/Rad toggle." },
        { q: "Is the Deg/Rad toggle affecting results?", a: "Yes. In Degree mode, trig functions convert inputs to radians internally. sin(90) in Deg mode = 1.0. In Rad mode, sin(90) ≈ 0.894. The toggle state is shown on the button." },
        { q: "Does the calculator support keyboard input?", a: "Absolutely. Type numbers and operators directly. Press Enter or = to evaluate, Backspace to delete, Escape to clear, and use ^ for powers." },
        { q: "How does Memory work?", a: "M+ adds the current value to memory, M− subtracts it. Click the MR indicator to recall the stored value. Click MC to clear memory." },
        { q: "What does the Ans button do?", a: "Ans inserts the result of the last calculation into the current expression. It's useful for chaining calculations without retyping values." },
        { q: "Is my data safe?", a: "100%. Everything runs locally in your browser. No calculations are sent to any server. Your history is session-only and not stored." },
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 16px", color: T.text }} ref={containerRef}>

            {/* ─── Header ──────────────────────────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div style={{
                    display: "inline-flex", padding: 14, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${T.accentDim}, transparent)`,
                    border: `1px solid ${T.accentGlow}`, marginBottom: 16,
                }}>
                    <Calculator size={32} color={T.accent} />
                </div>
                <h1 style={{ fontSize: 30, margin: "0 0 8px 0", fontWeight: 700 }}>
                    Scientific Calculator
                </h1>
                <p style={{ color: T.muted, margin: 0, maxWidth: 600, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                    A full-featured scientific calculator with trigonometry, logarithms, powers, memory, and keyboard support. Runs 100% in your browser.
                </p>
            </div>

            {/* ─── Calculator Body ─────────────────────────────────────────────── */}
            <div style={{
                maxWidth: 580,
                margin: "0 auto",
                background: T.surface,
                border: `1px solid ${T.surfaceBorder}`,
                borderRadius: 20,
                padding: "20px 20px 24px",
                boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 60px ${T.accentGlow}`,
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Ambient glow */}
                <div style={{
                    position: "absolute", top: -80, right: -80, width: 200, height: 200,
                    borderRadius: "50%", background: T.accentGlow, filter: "blur(80px)",
                    pointerEvents: "none", opacity: 0.4,
                }} />

                {/* ─── Status Bar ──────────────────────────────────────────────── */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginBottom: 12, padding: "0 4px", position: "relative", zIndex: 1,
                }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* Angle mode badge */}
                        <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: 1,
                            padding: "3px 8px", borderRadius: 6,
                            background: angleMode === "deg" ? T.accentDim : T.orangeDim,
                            color: angleMode === "deg" ? T.accentLight : T.orange,
                            border: `1px solid ${angleMode === "deg" ? T.accentGlow : "rgba(245,158,11,0.2)"}`,
                            textTransform: "uppercase",
                        }}>
                            {angleMode}
                        </span>

                        {/* Memory badge */}
                        {hasMemory && (
                            <span
                                onClick={recallMemory}
                                style={{
                                    fontSize: 10, fontWeight: 700, letterSpacing: 1,
                                    padding: "3px 8px", borderRadius: 6,
                                    background: "rgba(139,92,246,0.1)",
                                    color: "#a78bfa",
                                    border: "1px solid rgba(139,92,246,0.15)",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                                title={`Memory: ${formatNumber(memory)} — Click to recall, double-click to clear`}
                                onDoubleClick={clearMemory}
                            >
                                MR: {formatNumber(memory).length > 8 ? formatNumber(memory).slice(0, 8) + "…" : formatNumber(memory)}
                            </span>
                        )}
                    </div>

                    {/* History toggle */}
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        style={{
                            display: "flex", alignItems: "center", gap: 4,
                            background: showHistory ? T.accentDim : "transparent",
                            border: `1px solid ${showHistory ? T.accentGlow : "transparent"}`,
                            borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                            color: showHistory ? T.accentLight : T.muted,
                            fontSize: 11, fontWeight: 600, transition: "all 0.2s",
                        }}
                    >
                        <History size={12} />
                        History
                    </button>
                </div>

                {/* ─── History Panel ───────────────────────────────────────────── */}
                {showHistory && (
                    <div style={{
                        background: T.surfaceHi,
                        border: `1px solid ${T.border}`,
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 12,
                        maxHeight: 180,
                        overflowY: "auto",
                        position: "relative", zIndex: 1,
                    }}>
                        {history.length === 0 ? (
                            <p style={{ fontSize: 12, color: T.muted, textAlign: "center", margin: 0, padding: "12px 0" }}>
                                No calculations yet
                            </p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {history.map((h, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setDisplay(h.result);
                                            setExpression("");
                                            setJustEvaluated(true);
                                            try { setLastAnswer(parseFloat(h.result.replace(/,/g, ""))); } catch { /* ignore */ }
                                            setShowHistory(false);
                                        }}
                                        style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "8px 10px", borderRadius: 8,
                                            background: i === 0 ? T.accentDim : "transparent",
                                            border: `1px solid ${i === 0 ? T.accentGlow : "transparent"}`,
                                            cursor: "pointer", transition: "all 0.15s",
                                            color: T.text, fontSize: 12, fontFamily: "inherit",
                                            textAlign: "left", width: "100%",
                                        }}
                                    >
                                        <span style={{ color: T.textSec, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 12 }}>
                                            {h.expression}
                                        </span>
                                        <span style={{ fontWeight: 700, color: T.accentLight, whiteSpace: "nowrap" }}>
                                            = {h.result}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Display ─────────────────────────────────────────────────── */}
                <div style={{
                    background: `linear-gradient(135deg, #0d0d0d 0%, #111 100%)`,
                    borderRadius: 14,
                    padding: "16px 20px",
                    marginBottom: 16,
                    border: `1px solid ${T.border}`,
                    position: "relative", zIndex: 1,
                    minHeight: 90,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    overflow: "hidden",
                }}>
                    {/* Previous expression */}
                    <div style={{
                        fontSize: 13,
                        color: T.muted,
                        textAlign: "right",
                        height: 20,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: 4,
                        fontWeight: 400,
                        opacity: prevResult ? 1 : 0,
                        transition: "opacity 0.2s",
                    }}>
                        {prevResult || ""}
                    </div>

                    {/* Current display */}
                    <div
                        ref={displayRef}
                        style={{
                            fontSize: display.length > 16 ? 24 : display.length > 10 ? 30 : 38,
                            fontWeight: 300,
                            textAlign: "right",
                            color: display === "Error" ? T.red : T.text,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: "'Inter', 'SF Mono', monospace",
                            letterSpacing: "-0.5px",
                            lineHeight: 1.2,
                            transition: "font-size 0.2s ease",
                        }}
                    >
                        {display}
                    </div>
                </div>

                {/* ─── Button Grid ─────────────────────────────────────────────── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", zIndex: 1 }}>
                    {BUTTONS.map((row, ri) => (
                        <div key={ri} style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(9, 1fr)",
                            gap: 6,
                        }}>
                            {row.map((btn, ci) => {
                                const isPressed = pressedKey === btn.action;
                                const displayLabel = btn.action === "toggle:angle"
                                    ? (angleMode === "deg" ? "Deg" : "Rad")
                                    : (btn.display || btn.label);

                                return (
                                    <button
                                        key={ci}
                                        onClick={() => {
                                            setPressedKey(btn.action);
                                            setTimeout(() => setPressedKey(null), 120);
                                            handleAction(btn.action);
                                        }}
                                        style={{
                                            ...getButtonStyle(btn, isPressed),
                                            gridColumn: btn.span ? `span ${btn.span}` : undefined,
                                        }}
                                        title={btn.label}
                                    >
                                        {btn.label === "⌫" ? <Delete size={16} /> : displayLabel}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* ─── Keyboard Hint ───────────────────────────────────────────── */}
                <p style={{
                    fontSize: 11, color: T.muted, textAlign: "center",
                    margin: "14px 0 0 0", opacity: 0.6,
                }}>
                    ⌨ Keyboard supported — type numbers, operators, Enter to evaluate
                </p>
            </div>

            {/* ─── SEO Content ─────────────────────────────────────────────────── */}
            <div style={{ marginTop: 48, borderTop: `1px solid ${T.border}`, paddingTop: 32, maxWidth: 720, margin: "48px auto 0" }}>

                {/* How it Works */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 12, fontWeight: 600 }}>How Does This Calculator Work?</h2>
                    <p style={{ color: T.textSec, lineHeight: 1.7, fontSize: 14 }}>
                        This scientific calculator processes mathematical expressions using a <strong>recursive-descent parser</strong> —
                        a safe, structured approach that properly handles operator precedence (BODMAS/PEMDAS), nested parentheses,
                        and function composition without using JavaScript&apos;s <code style={{ background: T.surfaceHi, padding: "2px 6px", borderRadius: 4, fontSize: 13 }}>eval()</code>.
                        Every calculation runs entirely in your browser with zero server communication.
                    </p>
                </div>

                {/* Supported Operations */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 16, fontWeight: 600 }}>Supported Operations</h2>
                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                    }}>
                        {[
                            { title: "Arithmetic", ops: "+, −, ×, ÷, %, Parentheses" },
                            { title: "Powers & Roots", ops: "xʸ, x², x³, √x, ³√x, ʸ√x" },
                            { title: "Trigonometry", ops: "sin, cos, tan, sin⁻¹, cos⁻¹, tan⁻¹" },
                            { title: "Logarithms", ops: "ln (natural), log (base 10), eˣ, 10ˣ" },
                            { title: "Constants", ops: "π (3.14159…), e (2.71828…)" },
                            { title: "Utilities", ops: "n!, 1/x, ±, EXP, Ans, Memory" },
                        ].map((g, i) => (
                            <div key={i} style={{
                                background: T.surfaceHi,
                                border: `1px solid ${T.surfaceBorder}`,
                                borderRadius: 10, padding: "14px 16px",
                            }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.teal, marginBottom: 4 }}>{g.title}</div>
                                <div style={{ fontSize: 13, color: T.textSec }}>{g.ops}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQs */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 16, fontWeight: 600 }}>Frequently Asked Questions</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {faqs.map((faq, i) => (
                            <div key={i} style={{
                                background: T.surfaceHi,
                                border: `1px solid ${faqOpen === i ? T.accentGlow : T.surfaceBorder}`,
                                borderRadius: 10, overflow: "hidden",
                                transition: "border-color 0.2s",
                            }}>
                                <button
                                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                                    style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        width: "100%", padding: "14px 16px",
                                        background: "transparent", border: "none",
                                        color: T.text, fontSize: 14, fontWeight: 500,
                                        cursor: "pointer", textAlign: "left",
                                        fontFamily: "inherit",
                                    }}
                                >
                                    {faq.q}
                                    <ChevronDown
                                        size={16}
                                        color={T.muted}
                                        style={{
                                            transform: faqOpen === i ? "rotate(180deg)" : "rotate(0)",
                                            transition: "transform 0.25s",
                                            flexShrink: 0,
                                            marginLeft: 12,
                                        }}
                                    />
                                </button>
                                {faqOpen === i && (
                                    <div style={{
                                        padding: "0 16px 14px",
                                        color: T.textSec,
                                        fontSize: 13,
                                        lineHeight: 1.6,
                                        animation: "fadeIn 0.2s ease",
                                    }}>
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
