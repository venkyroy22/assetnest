import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Free Invoice & Billing Generator - Create Invoices Online",
    description: "Generate professional invoices and billing documents in seconds. Free, no account needed. Download as PDF. Perfect for freelancers and small businesses.",
    keywords: [
        "gst invoice generator",
        "barcode scanner billing",
        "free invoice maker india",
        "billing generator",
        "create invoice online",
        "freelancer invoice",
        "digital receipts online",
        "invoice template free",
        "online billing tool",
        "inventory billing software",
    ],
    openGraph: {
        title: "Free Invoice & Billing Generator | AssetNest",
        description: "Generate professional invoices in seconds. Free, no account needed, download as PDF.",
        url: "https://assetnest.gloyas.com/tools/billing",
    },
    alternates: {
        canonical: "https://assetnest.gloyas.com/tools/billing",
    },
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "AssetNest Free Invoice & GST Billing Generator",
        description: "Generate professional GST-ready invoices with integrated barcode scanning. Export high-quality receipts for customers instantly. Free, no login required.",
        url: "https://assetnest.gloyas.com/tools/billing",
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

