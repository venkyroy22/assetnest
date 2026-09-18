import { CalculatorDefinition } from "./types";
import { Home } from "lucide-react";

export const financialCalculators: CalculatorDefinition[] = [
    {
        id: "mortgage",
        name: "Mortgage Calculator",
        description: "Calculate your monthly mortgage payment including principal, interest, taxes, and insurance.",
        category: "Financial",
        icon: Home,
        seo: {
            title: "Free Mortgage Calculator - Monthly Payment Estimator",
            description: "Use our free mortgage calculator to estimate your monthly payments, including taxes and insurance. See your amortization schedule instantly.",
            keywords: ["mortgage calculator", "home loan calculator", "amortization schedule", "monthly payment"]
        },
        inputs: [
            {
                id: "homePrice",
                label: "Home Price",
                type: "currency",
                defaultValue: 400000,
            },
            {
                id: "downPayment",
                label: "Down Payment",
                type: "currency",
                defaultValue: 80000,
            },
            {
                id: "loanTerm",
                label: "Loan Term (Years)",
                type: "select",
                defaultValue: 30,
                options: [
                    { label: "30 Years", value: 30 },
                    { label: "20 Years", value: 20 },
                    { label: "15 Years", value: 15 },
                    { label: "10 Years", value: 10 },
                ]
            },
            {
                id: "interestRate",
                label: "Interest Rate (%)",
                type: "percentage",
                defaultValue: 6.5,
                step: 0.1,
            },
            {
                id: "propertyTax",
                label: "Annual Property Tax",
                type: "currency",
                defaultValue: 4000,
            },
            {
                id: "homeInsurance",
                label: "Annual Home Insurance",
                type: "currency",
                defaultValue: 1500,
            }
        ],
        calculate: (inputs) => {
            const p = inputs.homePrice - inputs.downPayment;
            const r = (inputs.interestRate / 100) / 12;
            const n = inputs.loanTerm * 12;

            // M = P [ r(1 + r)^n ] / [ (1 + r)^n - 1 ]
            let monthlyPrincipalInterest = 0;
            if (r === 0) {
                monthlyPrincipalInterest = p / n;
            } else {
                monthlyPrincipalInterest = p * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
            }

            const monthlyTax = inputs.propertyTax / 12;
            const monthlyInsurance = inputs.homeInsurance / 12;
            const totalMonthlyPayment = monthlyPrincipalInterest + monthlyTax + monthlyInsurance;

            return {
                monthlyPayment: totalMonthlyPayment,
                breakdown: {
                    principalAndInterest: monthlyPrincipalInterest,
                    propertyTax: monthlyTax,
                    homeInsurance: monthlyInsurance,
                },
                totalLoanAmount: p,
            };
        },
        content: {
            howItWorks: "The mortgage calculator estimates your monthly payment by taking the total home price and subtracting your down payment to find the loan amount. It then applies the standard amortization formula to calculate the monthly principal and interest. Finally, it adds monthly property taxes and homeowners insurance to give you a complete picture of your monthly housing costs.",
            faqs: [
                {
                    question: "What is an amortization schedule?",
                    answer: "An amortization schedule is a table detailing each periodic payment on an amortizing loan (typically a mortgage). Each calculation shows the amount of the payment that goes toward the principal balance and the amount that pays for interest."
                },
                {
                    question: "How much should I put down?",
                    answer: "While 20% is often recommended to avoid Private Mortgage Insurance (PMI), many buyers put down between 3% and 10%. Your ideal down payment depends on your financial situation and loan type."
                }
            ]
        },
        outputLayout: "mortgage"
    }
];
