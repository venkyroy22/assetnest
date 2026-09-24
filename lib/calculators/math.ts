import { CalculatorDefinition } from "./types";
import { Calculator } from "lucide-react";

export const mathCalculators: CalculatorDefinition[] = [
    {
        id: "scientific-calculator",
        name: "Scientific Calculator",
        description: "A full-featured scientific calculator with trig, logs, powers, memory, and full keyboard support.",
        category: "Math",
        icon: Calculator,
        seo: {
            title: "Free Scientific Calculator Online | Trig, Log, Powers & More",
            description: "Full-featured scientific calculator with trigonometry, logarithms, powers, roots, memory, and keyboard support. Runs 100% in your browser — no sign-up, no ads, forever free.",
            keywords: [
                "scientific calculator", "online calculator", "trig calculator", "sin cos tan",
                "logarithm calculator", "free calculator", "math calculator", "engineering calculator",
                "square root calculator", "power calculator", "factorial calculator"
            ]
        },
        inputs: [],
        calculate: () => ({}),
        content: {},
        outputLayout: "scientific"
    }
];
