import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free Invoice & Billing Generator — Create Invoices Online",
    description: "Generate professional invoices and billing documents in seconds. Free, no account needed. Download as PDF. Perfect for freelancers and small businesses.",
    keywords: [
        "invoice generator",
        "free invoice maker",
        "billing generator",
        "create invoice online",
        "freelancer invoice",
        "pdf invoice",
        "invoice template free",
        "online billing tool",
    ],
    openGraph: {
        title: "Free Invoice & Billing Generator | AssetNest",
        description: "Generate professional invoices in seconds. Free, no account needed, download as PDF.",
        url: "https://assetnest.vercel.app/tools/billing",
    },
    alternates: {
        canonical: "https://assetnest.vercel.app/tools/billing",
    },
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Invoice & Billing Generator",
        description: "Generate professional invoices and billing documents in seconds. Free, no account needed. Download as PDF.",
        url: "https://assetnest.vercel.app/tools/billing",
        applicationCategory: "WebApplication",
        operatingSystem: "All",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    };
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {children}
        </>
    );
}
