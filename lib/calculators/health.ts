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
    },
    {
        id: "bmi-calculator",
        name: "BMI Calculator",
        description: "Calculate your Body Mass Index (BMI) and find out where you stand on the health spectrum with detailed analysis.",
        category: "Fitness & Health",
        icon: Activity,
        seo: {
            title: "Free BMI Calculator - Body Mass Index Calculator",
            description: "Calculate your BMI with our advanced Body Mass Index calculator. Get your BMI value, category, healthy weight range, BMI Prime, and Ponderal Index — all for free.",
            keywords: [
                "bmi calculator", "body mass index calculator", "BMI", "body mass index",
                "healthy weight calculator", "weight calculator", "ideal weight",
                "bmi chart", "bmi categories", "am I overweight", "healthy BMI range",
                "BMI Prime", "Ponderal Index", "WHO BMI classification"
            ]
        },
        inputs: [],
        calculate: () => ({}),
        content: {},
        outputLayout: "bmi"
    }
];

