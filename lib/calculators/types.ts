import { LucideIcon } from "lucide-react";

export type CalculatorCategory = "Financial" | "Fitness & Health" | "Math" | "Other";

export type InputFieldType = "number" | "currency" | "percentage" | "select" | "slider" | "date" | "toggle";

export interface CalculatorInputOption {
    label: string;
    value: string | number;
}

export interface CalculatorInput {
    id: string;
    label: string;
    type: InputFieldType;
    defaultValue?: any;
    placeholder?: string;
    description?: string;
    min?: number;
    max?: number;
    step?: number;
    options?: CalculatorInputOption[]; // for select or toggle types
}

export interface FAQItem {
    question: string;
    answer: string; // Can be simple text or Markdown
}

export interface CalculatorSEO {
    title: string;
    description: string;
    keywords: string[];
}

export interface CalculatorDefinition {
    id: string;
    name: string;
    description: string; // Short description for the card
    category: CalculatorCategory;
    icon: LucideIcon;
    seo: CalculatorSEO;
    inputs: CalculatorInput[];
    
    // The calculate function takes key-value pairs of the inputs and returns an object 
    // representing the result. The engine will pass this to the output component.
    calculate: (inputs: Record<string, any>) => any;
    
    // SEO-rich content sections to render below the calculator
    content: {
        howItWorks?: string; // Markdown
        formulas?: string;   // Markdown
        faqs?: FAQItem[];
    };
    
    // A specific React component to render the results, or use the default standard output
    // We will define this when building the shell
    outputLayout?: "standard" | "mortgage" | "bmi" | "calorie" | "scientific"; 
}
