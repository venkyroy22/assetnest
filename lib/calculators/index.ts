import { financialCalculators } from "./financial";
import { healthCalculators } from "./health";
import { mathCalculators } from "./math";
import { otherCalculators } from "./other";
import { CalculatorDefinition } from "./types";

export const ALL_CALCULATORS: CalculatorDefinition[] = [
    ...financialCalculators,
    ...healthCalculators,
    ...mathCalculators,
    ...otherCalculators
];

export function getCalculator(id: string): CalculatorDefinition | undefined {
    return ALL_CALCULATORS.find(c => c.id === id);
}

export function getCalculatorsByCategory() {
    return ALL_CALCULATORS.reduce((acc, calc) => {
        if (!acc[calc.category]) {
            acc[calc.category] = [];
        }
        acc[calc.category].push(calc);
        return acc;
    }, {} as Record<string, CalculatorDefinition[]>);
}
