import Container from "@/components/Container";
import { Crown, CheckCircle } from "lucide-react";

export const metadata = {
    title: "Premium Membership",
    description: "Get exclusive access to high-end asset packs and priority support.",
};

export default function PremiumPage() {
    const features = [
        "Full access to 500+ Premium Assets",
        "Priority support from our team",
        "Early access to new keyword strategies",
        "Commercial license for all downloads",
        "Exclusive video editing workshop access"
    ];

    return (
        <div className="py-20">
            <Container>
                <div className="max-w-4xl mx-auto text-center">
                    <header className="mb-20">
                        <div className="inline-block p-3 border border-border mb-6 animate-pulse">
                            <Crown size={32} />
                        </div>
                        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tighter uppercase mb-6">Premium Access</h1>
                        <p className="text-xl text-secondary max-w-2xl mx-auto">
                            Our premium membership is launching soon. Get ready for the ultimate creative toolkit.
                        </p>
                    </header>

                    <div className="premium-card p-12 md:p-20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 transform translate-x-1/2 -translate-y-1/2 bg-foreground text-background font-black text-xs rotate-45 px-12">
                            COMING SOON
                        </div>

                        <h2 className="text-3xl font-bold mb-10 uppercase tracking-tight">What&apos;s Included?</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-12">
                            {features.map((feature) => (
                                <div key={feature} className="flex items-start gap-3">
                                    <CheckCircle size={20} className="shrink-0 mt-0.5" />
                                    <span className="text-lg text-secondary">{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-border pt-12">
                            <p className="mb-8 font-bold text-secondary">Want to be notified when we launch?</p>
                            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="YOUR EMAIL@DOMAIN.COM"
                                    className="flex-grow bg-transparent border border-border px-6 py-4 text-sm font-bold focus:outline-none focus:border-foreground"
                                />
                                <button className="bg-foreground text-background px-8 py-4 font-black uppercase tracking-tighter hover:opacity-90">
                                    NOTIFY ME
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}
