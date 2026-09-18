import { getCalculator, ALL_CALCULATORS } from "@/lib/calculators";
import { notFound } from "next/navigation";
import CalculatorShell from "@/components/calculators/CalculatorShell";

const T = {
    background: "#121212",
};

interface CalculatorPageProps {
    params: Promise<{
        id: string;
    }>;
}

// Generate static params for all calculators
export function generateStaticParams() {
    return ALL_CALCULATORS.map((calc) => ({
        id: calc.id,
    }));
}

// Generate SEO metadata
export async function generateMetadata({ params }: CalculatorPageProps) {
    const { id } = await params;
    const calc = getCalculator(id);
    if (!calc) return { title: "Calculator Not Found" };

    return {
        title: calc.seo.title,
        description: calc.seo.description,
        keywords: calc.seo.keywords.join(", "),
    };
}

export default async function CalculatorPage({ params }: CalculatorPageProps) {
    const { id } = await params;
    const calc = getCalculator(id);
    
    if (!calc) {
        notFound();
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, padding: "60px 0" }}>
                <CalculatorShell calculatorId={id} />
            </div>
        </div>
    );
}
