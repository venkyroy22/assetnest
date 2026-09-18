import { CalculatorDefinition } from "./types";
import { Clock } from "lucide-react";

export const otherCalculators: CalculatorDefinition[] = [
    {
        id: "age",
        name: "Age Calculator",
        description: "Calculate your exact age in years, months, and days based on your date of birth.",
        category: "Other",
        icon: Clock,
        seo: {
            title: "Free Age Calculator - Calculate Age in Years, Months & Days",
            description: "Calculate your exact age in years, months, days, and even seconds with our free online age calculator.",
            keywords: ["age calculator", "date of birth calculator", "how old am i", "calculate age"]
        },
        inputs: [
            {
                id: "dob",
                label: "Date of Birth",
                type: "date",
                defaultValue: "2000-01-01",
            },
            {
                id: "targetDate",
                label: "Target Date",
                type: "date",
                defaultValue: new Date().toISOString().split('T')[0],
            }
        ],
        calculate: (inputs) => {
            const dob = new Date(inputs.dob);
            const target = new Date(inputs.targetDate);
            
            let years = target.getFullYear() - dob.getFullYear();
            let months = target.getMonth() - dob.getMonth();
            let days = target.getDate() - dob.getDate();

            if (days < 0) {
                months--;
                // Get days in previous month
                const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
                days += prevMonth.getDate();
            }
            if (months < 0) {
                years--;
                months += 12;
            }

            return {
                years,
                months,
                days,
                totalDays: Math.floor((target.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24))
            };
        },
        content: {
            howItWorks: "The age calculator subtracts the date of birth from the target date to calculate the exact time elapsed, adjusting for leap years and different month lengths.",
        },
        outputLayout: "standard"
    }
];
