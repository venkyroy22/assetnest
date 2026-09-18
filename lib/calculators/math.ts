import { CalculatorDefinition } from "./types";
import { Percent } from "lucide-react";

export const mathCalculators: CalculatorDefinition[] = [
    {
        id: "percentage",
        name: "Percentage Calculator",
        description: "Easily calculate percentages: what is X% of Y, X is what % of Y, or the percentage change.",
        category: "Math",
        icon: Percent,
        seo: {
            title: "Free Percentage Calculator - Fast & Accurate",
            description: "Easily calculate percentages. Find out what X% of Y is, or the percentage increase/decrease between two numbers instantly.",
            keywords: ["percentage calculator", "percent increase", "percent decrease", "calculate percent"]
        },
        inputs: [
            {
                id: "calcType",
                label: "Calculation Type",
                type: "select",
                defaultValue: "percentOf",
                options: [
                    { label: "What is X% of Y?", value: "percentOf" },
                    { label: "X is what % of Y?", value: "isWhatPercent" },
                    { label: "Percentage Change (X to Y)", value: "percentChange" }
                ]
            },
            {
                id: "x",
                label: "Value X",
                type: "number",
                defaultValue: 20,
            },
            {
                id: "y",
                label: "Value Y",
                type: "number",
                defaultValue: 150,
            }
        ],
        calculate: (inputs) => {
            const { calcType, x, y } = inputs;
            let result = 0;
            let text = "";

            if (calcType === "percentOf") {
                result = (x / 100) * y;
                text = `${x}% of ${y} is ${result}`;
            } else if (calcType === "isWhatPercent") {
                result = (x / y) * 100;
                text = `${x} is ${parseFloat(result.toFixed(4))}% of ${y}`;
            } else if (calcType === "percentChange") {
                result = ((y - x) / Math.abs(x)) * 100;
                const dir = result > 0 ? "increase" : "decrease";
                text = `${x} to ${y} is a ${parseFloat(Math.abs(result).toFixed(4))}% ${dir}`;
            }

            return {
                result: parseFloat(result.toFixed(4)),
                text
            };
        },
        content: {
            howItWorks: "Percentage calculations follow standard mathematical rules. 'Percent' means per 100. So 20% is 20/100. To find 20% of 150, you multiply 0.20 * 150.",
            faqs: [
                {
                    question: "How do you calculate percentage increase?",
                    answer: "Subtract the original value from the new value, then divide the result by the original value. Multiply by 100 to get the percentage."
                }
            ]
        },
        outputLayout: "standard"
    }
];
