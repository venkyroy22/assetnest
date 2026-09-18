import { CalculatorDefinition } from "./types";
import { Activity } from "lucide-react";

export const healthCalculators: CalculatorDefinition[] = [
    {
        id: "bmi",
        name: "BMI Calculator",
        description: "Calculate your Body Mass Index (BMI) to see if you are at a healthy weight.",
        category: "Fitness & Health",
        icon: Activity,
        seo: {
            title: "Free BMI Calculator - Check Your Body Mass Index",
            description: "Easily calculate your Body Mass Index (BMI) with our free tool. Works with both Metric and Imperial units.",
            keywords: ["bmi calculator", "body mass index", "healthy weight calculator", "ideal weight"]
        },
        inputs: [
            {
                id: "unitSystem",
                label: "Unit System",
                type: "toggle",
                defaultValue: "imperial",
                options: [
                    { label: "Imperial (lbs/in)", value: "imperial" },
                    { label: "Metric (kg/cm)", value: "metric" }
                ]
            },
            {
                id: "weight",
                label: "Weight",
                type: "number",
                defaultValue: 160,
            },
            {
                id: "height",
                label: "Height",
                type: "number",
                defaultValue: 68,
            }
        ],
        calculate: (inputs) => {
            const { unitSystem, weight, height } = inputs;
            let bmi = 0;
            if (height > 0) {
                if (unitSystem === "metric") {
                    // weight in kg, height in cm
                    bmi = weight / Math.pow(height / 100, 2);
                } else {
                    // weight in lbs, height in inches
                    bmi = 703 * (weight / Math.pow(height, 2));
                }
            }

            let status = "Unknown";
            if (bmi < 18.5) status = "Underweight";
            else if (bmi < 25) status = "Healthy Weight";
            else if (bmi < 30) status = "Overweight";
            else status = "Obese";

            return {
                bmi: parseFloat(bmi.toFixed(1)),
                status
            };
        },
        content: {
            howItWorks: "Body Mass Index (BMI) is a person's weight in kilograms divided by the square of height in meters. A high BMI can be an indicator of high body fatness. BMI can be used to screen for weight categories that may lead to health problems but it is not diagnostic of the body fatness or health of an individual.",
            faqs: [
                {
                    question: "Is BMI accurate?",
                    answer: "BMI is a useful general guideline but it does not measure body fat directly. It may not be accurate for athletes with high muscle mass, pregnant women, or the elderly."
                }
            ]
        },
        outputLayout: "bmi"
    }
];
