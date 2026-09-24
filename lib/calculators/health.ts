import { CalculatorDefinition } from "./types";
import { Activity, Flame } from "lucide-react";

export const healthCalculators: CalculatorDefinition[] = [
    {
        id: "calorie-calculator",
        name: "Calorie Calculator",
        description: "Calculate your daily calorie needs, BMR, TDEE, and get a full macronutrient breakdown with weight loss/gain plans.",
        category: "Fitness & Health",
        icon: Flame,
        seo: {
            title: "Free Calorie Calculator - TDEE, BMR & Macro Calculator",
            description: "Calculate your daily calorie needs with our advanced calorie calculator. Get your BMR, TDEE, weight loss/gain plans, zigzag calorie cycling schedule, and macronutrient breakdown — all for free.",
            keywords: [
                "calorie calculator", "TDEE calculator", "BMR calculator", "daily calorie needs",
                "macro calculator", "weight loss calculator", "calorie deficit calculator",
                "maintenance calories", "calorie counter", "calorie intake calculator",
                "how many calories should I eat", "Mifflin-St Jeor calculator"
            ]
        },
        inputs: [],
        calculate: () => ({}),
        content: {},
        outputLayout: "calorie"
    }
];

